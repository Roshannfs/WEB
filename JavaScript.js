// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add body for POST/PUT requests
  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'API call failed');
    }
    
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Updated Registration Function
async function handleRegistration(formData) {
  try {
    const result = await apiCall('/auth/register', 'POST', formData);
    
    // Store user ID for OTP verification
    localStorage.setItem('pendingUserId', result.userId);
    
    showToast('Registration successful! Please check your email for OTP.', 'success');
    showOTPPage();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// OTP Verification Function
async function verifyOTP(otp) {
  try {
    const userId = localStorage.getItem('pendingUserId');
    await apiCall('/auth/verify-otp', 'POST', { userId, otp });
    
    localStorage.removeItem('pendingUserId');
    showToast('Email verified successfully!', 'success');
    showLoginPage();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Updated Login Function
async function handleLogin(email, password) {
  try {
    const result = await apiCall('/auth/login', 'POST', { email, password });
    
    // Store auth token
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('currentUser', JSON.stringify(result.user));
    
    showToast('Login successful!', 'success');
    showHomePage();
  } catch (error) {
    if (error.message.includes('verify')) {
      // Handle unverified users
      showOTPPage();
    }
    showToast(error.message, 'error');
  }
}
