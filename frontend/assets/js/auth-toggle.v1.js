(function authToggleV1(global) {
  "use strict";

  var API_BASE_URL = "https://genai-travel-planner-wuk9.onrender.com";
  var isRegisterMode = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function setMessage(node, message, type) {
    if (!node) return;
    node.textContent = message || "";
    node.classList.remove("show", "error", "success");

    if (!message) return;

    node.classList.add("show");
    node.classList.add(type === "success" ? "success" : "error");
  }

  function setLoading(button, isLoading, loadingText) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText || "Please wait...";
      return;
    }

    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  function normalizeIndianPhone(rawValue) {
    var digits = String(rawValue || "").replace(/\D/g, "");
    if (!digits) return null;

    if (digits.length === 12 && digits.indexOf("91") === 0) {
      digits = digits.slice(2);
    }

    if (!/^[6-9]\d{9}$/.test(digits)) {
      return null;
    }

    return "+91" + digits;
  }

  function isValidPassword(password) {
    return String(password || "").length >= 6;
  }

  function isValidName(name) {
    return String(name || "").trim().length >= 2;
  }

  function setGroupVisible(groupEl, visible) {
    if (!groupEl) return;

    if (visible) {
      groupEl.classList.remove("hidden");
      groupEl.style.display = "block";
      return;
    }

    groupEl.classList.add("hidden");
    groupEl.style.display = "none";
  }

  function updateModeUI() {
    var title = byId("authTitle");
    var subtitle = byId("authSubtitle");
    var submitBtn = byId("authSubmitBtn");
    var switchPrefix = byId("authSwitchPrefix");
    var switchBtn = byId("authModeToggleBtn");
    var passwordInput = byId("passwordInput");
    var firstNameGroup = byId("firstNameGroup");
    var lastNameGroup = byId("lastNameGroup");
    var authMessage = byId("authMessage");

    setMessage(authMessage, "", "error");

    if (isRegisterMode) {
      if (title) title.textContent = "Create Account";
      if (subtitle) subtitle.textContent = "Register with first name, last name, mobile number and password.";
      if (submitBtn) submitBtn.textContent = "Create Account";
      if (switchPrefix) switchPrefix.textContent = "Already have an account?";
      if (switchBtn) switchBtn.textContent = "Login";
      if (passwordInput) passwordInput.setAttribute("autocomplete", "new-password");

      setGroupVisible(firstNameGroup, true);
      setGroupVisible(lastNameGroup, true);
      return;
    }

    if (title) title.textContent = "Sign In";
    if (subtitle) subtitle.textContent = "Continue with your mobile number.";
    if (submitBtn) submitBtn.textContent = "Login";
    if (switchPrefix) switchPrefix.textContent = "Create New Account ";
    if (switchBtn) switchBtn.textContent = "Create Account";
    if (passwordInput) passwordInput.setAttribute("autocomplete", "current-password");

    setGroupVisible(firstNameGroup, false);
    setGroupVisible(lastNameGroup, false);
  }

  function toggleMode(event) {
    if (event) {
      if (event.__authToggleHandled) return;
      event.__authToggleHandled = true;
      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
    }

    isRegisterMode = !isRegisterMode;
    updateModeUI();
  }

  function togglePasswordVisibility() {
    var passwordInput = byId("passwordInput");
    var toggleBtn = byId("togglePasswordBtn");
    if (!passwordInput || !toggleBtn) return;

    var nextType = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = nextType;
    toggleBtn.textContent = nextType === "password" ? "Show" : "Hide";
  }

  async function postJson(path, payload) {
    var response = await fetch(API_BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });

    var data = {};
    var raw = await response.text();
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (_error) {
        data = {};
      }
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  function redirectAfterAuth() {
    var afterLoginRedirect = localStorage.getItem("goyatra_after_login_redirect");
    if (afterLoginRedirect) {
      localStorage.removeItem("goyatra_after_login_redirect");
      global.location.href = afterLoginRedirect;
      return;
    }

    var params = new URLSearchParams(global.location.search);
    var next = params.get("next");
    var hasPendingTrip = Boolean(localStorage.getItem("goyatra_pending_trip"));

    if (next === "plan" && hasPendingTrip) {
      global.location.href = "plantrip.html";
      return;
    }

    if (next === "mytrips") {
      global.location.href = "mytrips.html";
      return;
    }

    global.location.href = "index.html";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    var authMessage = byId("authMessage");
    var submitBtn = byId("authSubmitBtn");
    var firstName = String((byId("firstNameInput") || {}).value || "").trim();
    var lastName = String((byId("lastNameInput") || {}).value || "").trim();
    var phoneRaw = (byId("phoneInput") || {}).value || "";
    var password = String((byId("passwordInput") || {}).value || "");
    var normalizedPhone = normalizeIndianPhone(phoneRaw);

    setMessage(authMessage, "", "error");

    if (isRegisterMode && !isValidName(firstName)) {
      setMessage(authMessage, "Enter first name (min 2 letters).", "error");
      return;
    }

    if (isRegisterMode && !isValidName(lastName)) {
      setMessage(authMessage, "Enter last name (min 2 letters).", "error");
      return;
    }

    if (!normalizedPhone) {
      setMessage(authMessage, "Enter a valid Indian mobile number.", "error");
      return;
    }

    if (!isValidPassword(password)) {
      setMessage(authMessage, "Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(submitBtn, true, isRegisterMode ? "Creating..." : "Logging in...");

    try {
      var endpoint = isRegisterMode ? "/api/auth/register-phone" : "/api/auth/login-phone";
      var payload = isRegisterMode
        ? { firstName: firstName, lastName: lastName, phone: normalizedPhone, password: password }
        : { phone: normalizedPhone, password: password };

      var result = await postJson(endpoint, payload);

      if (!result.token || !result.user) {
        throw new Error("Invalid auth response from server.");
      }

      if (!global.GOYATRA_SESSION || typeof global.GOYATRA_SESSION.setSession !== "function") {
        throw new Error("Session module not available.");
      }

      global.GOYATRA_SESSION.setSession(result.token, result.user);
      setMessage(authMessage, result.message || "Login successful.", "success");

      global.setTimeout(function () {
        redirectAfterAuth();
      }, 150);
    } catch (error) {
      setMessage(authMessage, error.message || "Authentication failed.", "error");
    } finally {
      setLoading(submitBtn, false);
    }
  }

  function bindToggleButton() {
    var modeToggleBtn = byId("authModeToggleBtn");
    if (!modeToggleBtn) return;

    modeToggleBtn.addEventListener("click", toggleMode, true);
    modeToggleBtn.onclick = toggleMode;
  }

  function bindKeyboardFallback() {
    document.addEventListener("keydown", function (event) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === "r" || event.key === "R") {
        toggleMode();
      }
    });
  }

  function init() {
    updateModeUI();
    bindToggleButton();
    bindKeyboardFallback();

    var passwordToggleBtn = byId("togglePasswordBtn");
    if (passwordToggleBtn) {
      passwordToggleBtn.addEventListener("click", togglePasswordVisibility);
    }

    var authForm = byId("authForm");
    if (authForm) {
      authForm.addEventListener("submit", handleSubmit);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
