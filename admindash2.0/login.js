// Login Page JavaScript

document.addEventListener("DOMContentLoaded", () => {
    // Add animation to the login card
    const loginCard = document.querySelector(".login-card")
  
    if (loginCard) {
      loginCard.style.opacity = "0"
      loginCard.style.transform = "translateY(20px)"
  
      setTimeout(() => {
        loginCard.style.transition = "opacity 0.8s ease, transform 0.8s ease"
        loginCard.style.opacity = "1"
        loginCard.style.transform = "translateY(0)"
      }, 300)
    }
  
    // Form submission
    const loginForm = document.querySelector(".login-form")
  
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
  
        // Get form values
        const username = document.getElementById("username").value
        const password = document.getElementById("password").value
  
        // Show loading state
        const loginBtn = document.querySelector(".login-btn")
        const originalBtnText = loginBtn.innerHTML
  
        loginBtn.innerHTML = `
          <div class="loading-spinner-small"></div>
          <span style="margin-left: 10px;">Authenticating...</span>
        `
  
        // Add spinner style
        const spinnerStyle = document.createElement("style")
        spinnerStyle.textContent = `
          .loading-spinner-small {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
          }
        `
        document.head.appendChild(spinnerStyle)
  
        // Simulate authentication delay
        setTimeout(() => {
          // For demo purposes, redirect to admin dashboard
          // In a real app, you would validate credentials on the server
          if (username && password) {
            // Successful login animation
            loginBtn.innerHTML = `
              <span>Success!</span>
              <span style="margin-left: 10px;">✓</span>
            `
            loginBtn.style.background = "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"
  
            // Redirect after a short delay
            setTimeout(() => {
              window.location.href = "admin-dashboard.html"
            }, 1000)
          } else {
            // Failed login
            loginBtn.innerHTML = `
              <span>Login Failed</span>
              <span style="margin-left: 10px;">✗</span>
            `
            loginBtn.style.background = "linear-gradient(135deg, #f87171 0%, #ef4444 100%)"
  
            // Reset button after delay
            setTimeout(() => {
              loginBtn.innerHTML = originalBtnText
              loginBtn.style.background = "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-light-blue) 100%)"
            }, 2000)
          }
        }, 2000)
      })
    }
  
    // Password visibility toggle
    const passwordInput = document.getElementById("password")
  
    if (passwordInput) {
      const togglePassword = document.createElement("span")
      togglePassword.innerHTML = "👁️"
      togglePassword.className = "toggle-password"
      togglePassword.style.position = "absolute"
      togglePassword.style.right = "12px"
      togglePassword.style.top = "50%"
      togglePassword.style.transform = "translateY(-50%)"
      togglePassword.style.cursor = "pointer"
      togglePassword.style.color = "var(--text-secondary)"
      togglePassword.style.fontSize = "1rem"
      togglePassword.style.transition = "all var(--transition-fast)"
  
      passwordInput.parentElement.appendChild(togglePassword)
  
      togglePassword.addEventListener("click", function () {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
        passwordInput.setAttribute("type", type)
        this.innerHTML = type === "password" ? "👁️" : "👁️‍🗨️"
      })
  
      togglePassword.addEventListener("mouseenter", function () {
        this.style.color = "var(--text-primary)"
      })
  
      togglePassword.addEventListener("mouseleave", function () {
        this.style.color = "var(--text-secondary)"
      })
    }
  
    // Add subtle animation to form inputs
    const formInputs = document.querySelectorAll(".input-wrapper input")
  
    formInputs.forEach((input, index) => {
      input.style.opacity = "0"
      input.style.transform = "translateX(-10px)"
  
      setTimeout(
        () => {
          input.style.transition = "opacity 0.5s ease, transform 0.5s ease"
          input.style.opacity = "1"
          input.style.transform = "translateX(0)"
        },
        500 + index * 200,
      )
    })
  
    // Add floating animation to background elements
    const bgCircles = document.querySelectorAll(".bg-circle")
  
    bgCircles.forEach((circle) => {
      circle.style.opacity = "0"
  
      setTimeout(() => {
        circle.style.transition = "opacity 2s ease"
        circle.style.opacity = "1"
      }, 1000)
    })
  })
  