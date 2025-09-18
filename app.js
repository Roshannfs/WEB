// User Management System - JavaScript Implementation

// Application Configuration
const CONFIG = {
    otpLength: 6,
    otpExpiry: 300, // 5 minutes in seconds
    passwordMinLength: 8,
    apiDelay: 1000
};

// Mock Database - Users
let users = [
    
];

// Application State
let currentUser = null;
let currentOTP = null;
let otpTimer = null;
let pendingUser = null;

// Utility Functions
function generateId() {
    return Math.max(...users.map(u => u.id)) + 1;
}

function encryptPassword(password) {
    // Simulate password encryption (in real app, use proper hashing)
    return `encrypted_${btoa(password)}_${Date.now()}`;
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[+]?[\d\s\-()]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    const toastId = 'toast-' + Date.now();
    
    const bgClass = type === 'success' ? 'bg-success' : 
                   type === 'error' ? 'bg-danger' : 
                   type === 'warning' ? 'bg-warning' : 'bg-info';
    
    const iconClass = type === 'success' ? 'bi-check-circle' : 
                     type === 'error' ? 'bi-exclamation-circle' : 
                     type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';

    const toastHTML = `
        <div id="${toastId}" class="toast ${bgClass}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="bi ${iconClass} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body text-white">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Page Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('d-none');
    });
    
    // Show selected page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.remove('d-none');
    }
    
    // Show/hide navbar based on page
    const navbar = document.getElementById('navbar');
    if (pageName === 'dashboard') {
        navbar.classList.remove('d-none');
        updateDashboard();
    } else {
        navbar.classList.add('d-none');
    }
}

// Form Validation
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
        
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else if (input.type === 'email' && input.value && !validateEmail(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
        } else if (input.type === 'tel' && input.value && !validatePhone(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
        } else if (input.type === 'password' && input.value && input.value.length < CONFIG.passwordMinLength) {
            input.classList.add('is-invalid');
            isValid = false;
        } else if (input.id === 'otp-code' && input.value && !/^\d{6}$/.test(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
        } else if (input.value.trim()) {
            input.classList.add('is-valid');
        }
    });
    
    return isValid;
}

// Registration Process
function handleRegistration(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!validateForm(form)) {
        showToast('Please correct the errors in the form', 'error');
        return;
    }
    
    const formData = {
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        phone: document.getElementById('reg-phone').value.trim(),
        profession: document.getElementById('reg-profession').value
    };
    
    // Check if email already exists
    if (users.find(user => user.email === formData.email)) {
        showToast('Email already exists. Please use a different email.', 'error');
        return;
    }
    
    // Simulate API call with loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
    
    setTimeout(() => {
        // Encrypt password and log to console (as requested)
        const encryptedPassword = encryptPassword(formData.password);
        console.log('Password Encryption Simulation:');
        console.log('Original Password:', formData.password);
        console.log('Encrypted Password:', encryptedPassword);
        
        // Store pending user data
        pendingUser = {
            id: generateId(),
            name: formData.name,
            email: formData.email,
            password: encryptedPassword,
            phone: formData.phone,
            profession: formData.profession,
            verified: false
        };
        
        // Generate and store OTP
        currentOTP = generateOTP();
        console.log('Generated OTP for verification:', currentOTP); // For demo purposes
        
        // Reset form and show success
        form.reset();
        form.querySelectorAll('.is-valid').forEach(input => input.classList.remove('is-valid'));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        showToast('Registration successful! Please verify your email.', 'success');
        
        // Navigate to OTP page
        document.getElementById('otp-email').textContent = pendingUser.email;
        showPage('otp');
        startOTPTimer();
        displayOTPForDemo();
        
    }, CONFIG.apiDelay);
}

// Display OTP for demo purposes
function displayOTPForDemo() {
    // Create or update demo OTP display
    let demoOTPElement = document.getElementById('demo-otp-display');
    if (!demoOTPElement) {
        const otpCard = document.querySelector('#otp-page .card-body');
        demoOTPElement = document.createElement('div');
        demoOTPElement.id = 'demo-otp-display';
        demoOTPElement.className = 'alert alert-info mt-3';
        otpCard.appendChild(demoOTPElement);
    }
    
    demoOTPElement.innerHTML = `
        <strong><i class="bi bi-info-circle"></i> Demo Mode : Server is offline use demo mode:</strong> 
        Your verification code is: <code class="fs-4 fw-bold">${currentOTP}</code>
    `;
}

// OTP Timer Management
function startOTPTimer() {
    let timeLeft = CONFIG.otpExpiry;
    const timerElement = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('resend-otp');
    
    resendBtn.disabled = true;
    
    otpTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            timerElement.textContent = '00:00';
            resendBtn.disabled = false;
            currentOTP = null;
            // Remove demo OTP display when expired
            const demoOTPElement = document.getElementById('demo-otp-display');
            if (demoOTPElement) {
                demoOTPElement.remove();
            }
            showToast('OTP has expired. Please request a new code.', 'warning');
        }
        
        timeLeft--;
    }, 1000);
}

function resendOTP() {
    if (!pendingUser) return;
    
    currentOTP = generateOTP();
    console.log('New OTP generated:', currentOTP); // For demo purposes
    
    showToast('New verification code sent to your email!', 'success');
    startOTPTimer();
    displayOTPForDemo();
}

// OTP Verification
function handleOTPVerification(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!validateForm(form)) {
        showToast('Please enter a valid 6-digit code', 'error');
        return;
    }
    
    const enteredOTP = document.getElementById('otp-code').value;
    
    if (!currentOTP) {
        showToast('OTP has expired. Please request a new code.', 'error');
        return;
    }
    
    if (enteredOTP !== currentOTP) {
        showToast('Invalid verification code. Please try again.', 'error');
        return;
    }
    
    // Simulate API call
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying...';
    
    setTimeout(() => {
        // Add user to database
        pendingUser.verified = true;
        users.push(pendingUser);
        
        // Clear OTP timer and data
        clearInterval(otpTimer);
        currentOTP = null;
        
        // Remove demo OTP display
        const demoOTPElement = document.getElementById('demo-otp-display');
        if (demoOTPElement) {
            demoOTPElement.remove();
        }
        
        form.reset();
        form.querySelectorAll('.is-valid').forEach(input => input.classList.remove('is-valid'));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        showToast('Email verified successfully! You can now login.', 'success');
        
        // Navigate to login page
        showPage('login');
        
        // Pre-fill login email
        document.getElementById('login-email').value = pendingUser.email;
        pendingUser = null;
        
    }, CONFIG.apiDelay);
}

// Login Process
function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!validateForm(form)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Simulate API call
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
    
    setTimeout(() => {
        // Find user
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showToast('Invalid email or password', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }
        
        if (!user.verified) {
            showTotp('Please verify your email before logging in', 'warning');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }
        
        // In a real app, you'd verify the hashed password
        // For demo purposes, we'll just check if password is not empty
        if (!password) {
            showToast('Invalid email or password', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }
        
        // Successful login
        currentUser = user;
        form.reset();
        form.querySelectorAll('.is-valid').forEach(input => input.classList.remove('is-valid'));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        showToast(`Welcome back, ${user.name}!`, 'success');
        
        // Update navbar
        document.getElementById('current-user').textContent = user.name;
        
        // Navigate to dashboard
        showPage('dashboard');
        
    }, CONFIG.apiDelay);
}

// Dashboard Functions
function updateDashboard() {
    // Update statistics
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('verified-users').textContent = users.filter(u => u.verified).length;
    document.getElementById('pending-users').textContent = users.filter(u => !u.verified).length;
    
    // Update users table
    updateUsersTable();
}

function updateUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.profession}</td>
            <td>
                <span class="badge ${user.verified ? 'bg-success' : 'bg-warning'}">
                    ${user.verified ? 'Verified' : 'Pending'}
                </span>
            </td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-2" onclick="editUser(${user.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteUser(${user.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// User CRUD Operations
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Populate edit form
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-phone').value = user.phone;
    document.getElementById('edit-profession').value = user.profession;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
}

function updateUser() {
    const form = document.getElementById('edit-user-form');
    
    if (!validateForm(form)) {
        showToast('Please correct the errors in the form', 'error');
        return;
    }
    
    const userId = parseInt(document.getElementById('edit-user-id').value);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    // Check if email is taken by another user
    const email = document.getElementById('edit-email').value.trim();
    const existingUser = users.find(u => u.email === email && u.id !== userId);
    if (existingUser) {
        showToast('Email already exists. Please use a different email.', 'error');
        return;
    }
    
    // Update user
    users[userIndex] = {
        ...users[userIndex],
        name: document.getElementById('edit-name').value.trim(),
        email: email,
        phone: document.getElementById('edit-phone').value.trim(),
        profession: document.getElementById('edit-profession').value
    };
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    modal.hide();
    
    updateDashboard();
    showToast('User updated successfully!', 'success');
}

function deleteUser(userId) {
    document.getElementById('delete-user-id').value = userId;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function confirmDelete() {
    const userId = parseInt(document.getElementById('delete-user-id').value);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    // Remove user
    users.splice(userIndex, 1);
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
    modal.hide();
    
    updateDashboard();
    showToast('User deleted successfully!', 'success');
}

function showAddUserModal() {
    // Reset form
    const form = document.getElementById('add-user-form');
    form.reset();
    form.querySelectorAll('.is-valid, .is-invalid').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
    
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

function addUser() {
    const form = document.getElementById('add-user-form');
    
    if (!validateForm(form)) {
        showToast('Please correct the errors in the form', 'error');
        return;
    }
    
    const email = document.getElementById('add-email').value.trim();
    
    // Check if email already exists
    if (users.find(user => user.email === email)) {
        showToast('Email already exists. Please use a different email.', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        name: document.getElementById('add-name').value.trim(),
        email: email,
        password: encryptPassword(document.getElementById('add-password').value),
        phone: document.getElementById('add-phone').value.trim(),
        profession: document.getElementById('add-profession').value,
        verified: true // Auto-verify for admin-added users
    };
    
    users.push(newUser);
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
    modal.hide();
    
    updateDashboard();
    showToast('User added successfully!', 'success');
}

// Logout
function logout() {
    currentUser = null;
    showToast('You have been logged out successfully', 'info');
    showPage('login');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Registration form
    document.getElementById('registration-form').addEventListener('submit', handleRegistration);
    
    // OTP form
    document.getElementById('otp-form').addEventListener('submit', handleOTPVerification);
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Real-time form validation
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('blur', function() {
            const form = this.closest('form');
            if (form) {
                validateForm(form);
            }
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
            }
        });
    });
    
    // OTP input formatting
    document.getElementById('otp-code').addEventListener('input', function(e) {
        // Only allow numbers
        this.value = this.value.replace(/\D/g, '');
    });
    
    // Phone number formatting
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function(e) {
            // Basic phone number formatting
            let value = this.value.replace(/\D/g, '');
            if (value.length > 0 && !value.startsWith('+')) {
                value = '+' + value;
            }
            this.value = value.substring(0, 15); // Limit length
        });
    });
    
    // Initialize app - show registration page by default
    showPage('registration');
});

// Global functions for inline event handlers
window.showPage = showPage;
window.editUser = editUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.confirmDelete = confirmDelete;
window.showAddUserModal = showAddUserModal;
window.addUser = addUser;
window.logout = logout;
window.resendOTP = resendOTP;