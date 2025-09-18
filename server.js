
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Rate limiting to prevent spam
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 email requests per windowMs
  message: {
    success: false,
    message: 'Too many email requests, please try again later.'
  }
});

// Email configuration - FIXED: Use createTransport (not createTransporter)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // App Password from Google
    },
    // Additional options for better reliability
    tls: {
      rejectUnauthorized: false
    }
  });
};

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Utility functions
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = (email, otp) => {
  const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email, { otp, expiryTime });
  console.log(`📝 Stored OTP for ${email}: ${otp} (expires in 5 minutes)`);

  // Clean up expired OTPs
  setTimeout(() => {
    if (otpStore.has(email)) {
      otpStore.delete(email);
      console.log(`🗑️  Expired OTP removed for ${email}`);
    }
  }, 5 * 60 * 1000);
};

const verifyOTP = (email, inputOTP) => {
  const stored = otpStore.get(email);
  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }

  if (Date.now() > stored.expiryTime) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP expired' };
  }

  if (stored.otp !== inputOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  otpStore.delete(email); // OTP used successfully
  return { valid: true, message: 'OTP verified successfully' };
};

// Test email configuration endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ 
      success: true, 
      message: 'Email configuration is working correctly',
      emailUser: process.env.EMAIL_USER
    });
  } catch (error) {
    console.error('Email configuration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Email configuration failed: ' + error.message 
    });
  }
});

// Send OTP endpoint
app.post('/api/send-otp', emailLimiter, async (req, res) => {
  try {
    const { email, name, purpose = 'verification' } = req.body;

    console.log(`📧 Sending OTP to: ${email}`);

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    const transporter = createTransporter();
    const otp = generateOTP();

    // Store OTP
    storeOTP(email, otp);

    // Email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
          .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px; }
          .otp-box { background: #f8f9fa; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px; border: 3px solid #007bff; }
          .otp-code { font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px; padding: 20px; background: #f8f9fa; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
            <p style="margin: 0; opacity: 0.9;">User Management System</p>
          </div>
          <div class="content">
            <p><strong>Hello ${name || 'User'},</strong></p>
            <p>You requested an OTP for <strong>${purpose}</strong>. Please use the verification code below:</p>

            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #6c757d;">Enter this code to verify your email</p>
            </div>

            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important Security Information:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This code will expire in <strong>5 minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Our team will never ask for this code via phone or email</li>
              </ul>
            </div>

            <p style="margin-top: 25px;">If you're having trouble, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from User Management System</p>
            <p>Please do not reply to this email | ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: 'User Management System',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `🔐 Your Verification Code: ${otp}`,
      html: htmlTemplate,
      text: `Hello ${name || 'User'},\n\nYour OTP code for ${purpose} is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this, please ignore this email.\n\nUser Management System\n${new Date().toLocaleString()}`
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent successfully to ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email address',
      messageId: result.messageId,
      debug: {
        email: email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP: ' + error.message,
      errorType: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const verification = verifyOTP(email, otp);

    if (verification.valid) {
      console.log(`✅ OTP verified successfully for ${email}`);
      res.json({
        success: true,
        message: verification.message
      });
    } else {
      console.log(`❌ OTP verification failed for ${email}: ${verification.message}`);
      res.status(400).json({
        success: false,
        message: verification.message
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Resend OTP endpoint
app.post('/api/resend-otp', emailLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;

    console.log(`🔄 Resending OTP to: ${email}`);

    const transporter = createTransporter();
    const otp = generateOTP();

    storeOTP(email, otp);

    const mailOptions = {
      from: {
        name: 'User Management System',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `🔁 Resent Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🔁 OTP Resent</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hello ${name || 'User'},</p>
            <p>Here's your new verification code:</p>
            <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #17a2b8;">
              <h1 style="color: #17a2b8; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p style="color: #dc3545;"><strong>Note:</strong> Any previous OTP codes are now invalid.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP resent successfully to ${email}`);

    res.json({
      success: true,
      message: 'New OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// Debug endpoint to check current OTPs (remove in production)
app.get('/api/debug-otps', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  const currentOTPs = Array.from(otpStore.entries()).map(([email, data]) => ({
    email,
    otp: data.otp,
    expiresAt: new Date(data.expiryTime).toISOString(),
    expiresIn: Math.max(0, Math.floor((data.expiryTime - Date.now()) / 1000)) + 's'
  }));

  res.json({
    success: true,
    activeOTPs: currentOTPs,
    count: currentOTPs.length
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    emailConfigured: !!process.env.EMAIL_USER
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured (' + process.env.EMAIL_USER + ')' : 'Not configured'}`);
  console.log(`🔒 App Password: ${process.env.EMAIL_PASS ? 'Configured' : 'Missing'}`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`   GET  /api/health      - Health check`);
  console.log(`   GET  /api/test-email  - Test email configuration`);
  console.log(`   POST /api/send-otp    - Send OTP to email`);
  console.log(`   POST /api/verify-otp  - Verify OTP`);
  console.log(`   POST /api/resend-otp  - Resend OTP`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   GET  /api/debug-otps  - Debug current OTPs`);
  }
  console.log(`\n💡 Quick test: curl http://localhost:${PORT}/api/health`);
});
