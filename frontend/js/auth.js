document.addEventListener('DOMContentLoaded', function() {
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const demoLoginBtn = document.getElementById('demo-login');
    
    if (loginForm) {
        setupLoginForm();
    }
    
    if (registerForm) {
        setupRegisterForm();
    }
    
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }
    
    animateEntrance();
});

function setupLoginForm() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await api.login(email, password);
            
            showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            showError(error.message || 'Login failed. Please try again.');
            setLoading(false);
        }
    });
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        
        if (!name || !email || !password || !confirmPassword) {
            showError('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (!agreeTerms) {
            showError('Please agree to the terms and conditions');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await api.register(name, email, password);
            
            showSuccess('Account created successfully! Redirecting...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            showError(error.message || 'Registration failed. Please try again.');
            setLoading(false);
        }
    });
}

function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strength-bar');
    const hintText = document.getElementById('password-hint');
    
    if (!strengthBar) return;
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    
    if (/\d/.test(password)) strength++;
    
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    strengthBar.className = 'strength-bar';
    
    if (strength === 0) {
        strengthBar.classList.add('weak');
        hintText.textContent = 'Use at least 6 characters';
    } else if (strength <= 2) {
        strengthBar.classList.add('weak');
        hintText.textContent = 'Weak password';
    } else if (strength === 3) {
        strengthBar.classList.add('medium');
        hintText.textContent = 'Medium strength';
    } else {
        strengthBar.classList.add('strong');
        hintText.textContent = 'Strong password!';
    }
}

async function handleDemoLogin() {
    setLoading(true);
    
    try {
        await api.login('demo@energytrack.com', 'demo123');
        
        showSuccess('Demo login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showError('Demo account not available. Please register.');
        setLoading(false);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        errorDiv.classList.add('shake');
        setTimeout(() => errorDiv.classList.remove('shake'), 500);
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

function setLoading(loading) {
    const submitButton = document.querySelector('.btn-primary');
    const btnText = submitButton.querySelector('.btn-text');
    const btnLoader = submitButton.querySelector('.btn-loader');
    
    if (loading) {
        submitButton.classList.add('loading');
        submitButton.disabled = true;
    } else {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
}

function animateEntrance() {
    const authCard = document.querySelector('.auth-card');
    
    if (authCard && typeof anime !== 'undefined') {
        anime({
            targets: authCard,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            easing: 'easeOutCubic'
        });
    }
}