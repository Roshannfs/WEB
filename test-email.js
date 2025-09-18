
// test-email.js - Fixed version with proper nodemailer syntax
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfiguration() {
    console.log('🧪 Testing Email Configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass:', process.env.EMAIL_PASS ? '[CONFIGURED]' : '[NOT CONFIGURED]');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ EMAIL_USER or EMAIL_PASS not configured in .env file');
        return;
    }

    try {
        // Fixed: Use createTransport (not createTransporter)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Test connection
        console.log('🔗 Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful');

        // Send test email
        console.log('📧 Sending test email...');
        const testOTP = '123456';
        const result = await transporter.sendMail({
            from: {
                name: 'User Management System',
                address: process.env.EMAIL_USER
            },
            to: process.env.EMAIL_USER, // Send to yourself for testing
            subject: 'Test Email - OTP System Working',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #007bff;">🎉 Email Configuration Test Successful!</h2>
                    <p>If you receive this email, your email configuration is working correctly.</p>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #007bff;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0;">Test OTP: ${testOTP}</h1>
                    </div>
                    <p><strong>Your email service is ready to send OTP codes!</strong></p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #6c757d; font-size: 14px;">
                        This is an automated test message from your User Management System.<br>
                        Time: ${new Date().toLocaleString()}
                    </p>
                </div>
            `,
            text: `Email Configuration Test Successful! Test OTP: ${testOTP} - Time: ${new Date().toLocaleString()}`
        });

        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        console.log('📧 Check your inbox at:', process.env.EMAIL_USER);
        console.log('\n🎉 Your email configuration is working perfectly!');

    } catch (error) {
        console.error('❌ Email configuration test failed:', error.message);
        console.error('Error details:', error);

        if (error.message.includes('Invalid login')) {
            console.log('\n💡 Troubleshooting tips:');
            console.log('1. Make sure you are using an App Password, not your regular Gmail password');
            console.log('2. Enable 2-Step Verification in your Google Account');
            console.log('3. Generate a new App Password at: https://myaccount.google.com/apppasswords');
            console.log('4. App Password should be 16 characters without spaces');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
            console.log('\n💡 Network troubleshooting:');
            console.log('1. Check your internet connection');
            console.log('2. Try disabling firewall/antivirus temporarily');
            console.log('3. Check if your ISP blocks SMTP ports');
        } else if (error.message.includes('self signed certificate')) {
            console.log('\n💡 Certificate issue - try this fix:');
            console.log('Add this to your transporter config: { rejectUnauthorized: false }');
        }
    }
}

// Run the test
testEmailConfiguration();
