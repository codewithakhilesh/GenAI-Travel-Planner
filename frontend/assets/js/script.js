
// frontend/assets/js/session.js  (FULL REPLACE - WORKING)
(function sessionModule(global) {
  "use strict";

  var TOKEN_KEY = "goyatra_token";
  var USER_KEY = "goyatra_user";
  var PENDING_TRIP_KEY = "goyatra_pending_trip";
  var LAST_PLAN_KEY = "goyatra_last_plan";
  var API_BASE_URL = "https://genai-travel-planner-wuk9.onrender.com";
  var FALLBACK_USER_IMAGE = "assets/GIF/profile.gif";

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (_error) {
      return "";
    }
  }

  function getUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return safeJsonParse(raw);
    } catch (_error) {
      return null;
    }
  }

  // ✅ strong normalize: supports many key styles from backend
  function sanitizeUser(user) {
    if (!user || typeof user !== "object") return null;

    var firstName = String(
      user.firstName || user.firstname || user.first_name || ""
    ).trim();

    var lastName = String(
      user.lastName || user.lastname || user.last_name || ""
    ).trim();

    var fullName = String(
      user.name || user.fullName || user.full_name || ""
    ).trim();

    var phone = user.phone || user.mobile || user.phoneNumber || user.phone_number || null;

    // If only fullName exists, split it
    if (!firstName && fullName) {
      var parts = fullName.split(/\s+/).filter(Boolean);
      firstName = parts[0] || "";
      if (!lastName && parts.length > 1) {
        lastName = parts.slice(1).join(" ");
      }
    }

    if (!fullName) {
      fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    }

    return {
      id: user.id || user._id || "",
      firstName: firstName,
      lastName: lastName,
      name: fullName,
      phone: phone,
      provider: user.provider || "phone"
    };
  }

  function getFirstNameFromUser(user) {
    if (!user || typeof user !== "object") return "";

    var first = String(user.firstName || "").trim();
    if (first) return first;

    var name = String(user.name || "").trim();
    if (!name) return "";
    return name.split(/\s+/)[0];
  }

  function isLoggedIn() {
    var token = getToken();
    var user = getUser();
    return Boolean(token && user && (user.id || user.phone));
  }

  function setSession(token, user) {
    if (!token || !user) return false;

    var cleanUser = sanitizeUser(user);
    if (!cleanUser) return false;

    try {
      localStorage.setItem(TOKEN_KEY, String(token));
      localStorage.setItem(USER_KEY, JSON.stringify(cleanUser));
    } catch (_e) {
      return false;
    }

    updateNavbarUserUI();
    return true;
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PENDING_TRIP_KEY);
      localStorage.removeItem(LAST_PLAN_KEY);
      localStorage.removeItem("goyatra_view_trip_id");
    } catch (_e) { }
  }

  function logout() {
    clearSession();
    global.location.href = "user.html";
  }

  function handleDeleteAccount() {
    console.log("Delete button clicked");

    var token = getToken();
    console.log("Token exists:", Boolean(token));

    if (!token) {
      clearSession();
      global.location.href = "user.html";
      return;
    }

    var shouldDelete = global.confirm(
      "Are you sure you want to delete your account? This will delete all trips."
    );
    if (!shouldDelete) return;

    var requestUrl = API_BASE_URL + "/api/auth/delete-account";
    console.log("Delete request URL:", requestUrl);

    fetch(requestUrl, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      }
    })
      .then(function (response) {
        console.log("Delete request status code:", response.status);
        return response
          .text()
          .then(function (raw) {
            var data = safeJsonParse(raw);
            if (!data || typeof data !== "object") {
              data = raw ? { message: raw } : {};
            }
            console.log("Delete response JSON:", data);

            if (data.success === false && response.ok) {
              var invalidSuccessError = new Error(data.message || "Unable to delete account.");
              invalidSuccessError.status = response.status;
              throw invalidSuccessError;
            }

            if (!response.ok) {
              var err = new Error(data.message || "Unable to delete account.");
              err.status = response.status;
              throw err;
            }
            return data;
          });
      })
      .then(function (result) {
        clearSession();
        global.alert((result && result.message) || "Account deleted successfully");
        global.location.href = "user.html";
      })
      .catch(function (error) {
        console.error("Delete account request failed:", error);

        if (error && (error.status === 401 || error.status === 403)) {
          clearSession();
          global.location.href = "user.html";
          return;
        }

        if (error && error.status === 404) {
          global.alert("Route not found. Check backend route mount /api/auth/delete-account");
          return;
        }

        var errorText = String((error && error.message) || "");
        if ((error && error.name === "TypeError") || /failed to fetch/i.test(errorText)) {
          global.alert("Backend not running / CORS issue");
          return;
        }

        global.alert(errorText || "Unable to delete account.");
      });
  }

  function buildLoginRedirectUrl(nextPage) {
    var next = nextPage === "mytrips" ? "mytrips" : "plan";
    return "user.html?next=" + encodeURIComponent(next);
  }

  function requireAuth(nextPage) {
    if (isLoggedIn()) return true;
    global.location.href = buildLoginRedirectUrl(nextPage);
    return false;
  }

  function getCurrentPageName() {
    var pathname = String(global.location.pathname || "").toLowerCase();
    var file = pathname.split("/").pop();
    if (!file) return "index.html";
    return file;
  }

  function getFieldValue(id) {
    var field = document.getElementById(id);
    return field ? String(field.value || "").trim() : "";
  }

  function collectTripFormData() {
    var from = getFieldValue("from");
    var to = getFieldValue("to");
    var startDate = getFieldValue("startDate");
    var endDate = getFieldValue("endDate");
    var people = getFieldValue("people");
    var travelType = getFieldValue("travelType") || getFieldValue("travelGroup");
    var transportMode = getFieldValue("transportMode") || getFieldValue("transport");
    var budgetRaw = getFieldValue("budget");
    var budget = Number(budgetRaw);

    return {
      from: from,
      to: to,
      startDate: startDate,
      endDate: endDate,
      people: people || "1",
      travelType: travelType || "Solo",
      travelGroup: travelType || "Solo",
      transportMode: transportMode || "",
      transport: transportMode || "",
      budget: Number.isFinite(budget) ? budget : 0
    };
  }

  function savePendingTrip(data) {
    if (!data || typeof data !== "object") return false;
    try {
      localStorage.setItem(PENDING_TRIP_KEY, JSON.stringify(data));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function getPendingTrip() {
    try {
      var raw = localStorage.getItem(PENDING_TRIP_KEY);
      if (!raw) return null;
      return safeJsonParse(raw);
    } catch (_error) {
      return null;
    }
  }

  function clearPendingTrip() {
    try {
      localStorage.removeItem(PENDING_TRIP_KEY);
    } catch (_e) { }
  }

  function gatePlanFormForUnauthenticatedUsers() {
    var form = document.getElementById("bookingForm");
    if (!form || form.dataset.authGateBound === "1") return;

    form.dataset.authGateBound = "1";
    form.addEventListener(
      "submit",
      function (event) {
        if (isLoggedIn()) return;

        if (!form.checkValidity()) return;

        var pendingTrip = collectTripFormData();
        savePendingTrip(pendingTrip);

        event.preventDefault();
        event.stopImmediatePropagation();
        global.location.href = "user.html?next=plan";
      },
      true
    );
  }

  function tryGeneratePlanFromPendingTrip(attempt) {
    var pendingTrip = getPendingTrip();
    if (!pendingTrip) return;

    var planner = global.GOYATRA_PLAN_GENERATOR;
    if (!planner || typeof planner.generateCompleteTravelPlan !== "function") {
      if (attempt < 30) {
        global.setTimeout(function () {
          tryGeneratePlanFromPendingTrip(attempt + 1);
        }, 100);
      }
      return;
    }

    try {
      var plan = planner.generateCompleteTravelPlan(pendingTrip);
      localStorage.setItem(LAST_PLAN_KEY, JSON.stringify(plan));
      clearPendingTrip();
    } catch (error) {
      console.error("Failed to auto-generate plan from pending trip:", error);
    }
  }

  // ✅ Navbar label + dropdown + logout
  function updateNavbarUserUI() {
    var userButton = document.getElementById("userMenuBtn");
    var userDropdown = document.getElementById("userDropdown");
    var logoutBtn = document.getElementById("logoutBtn");
    var deleteAccountBtn = document.getElementById("deleteAccountBtn");
    if (!userButton) return;

    var user = getUser();
    var loggedIn = isLoggedIn();
    var userImage = userButton.querySelector("img.user-icon");
    var userLabel = userButton.querySelector("span");

    var labelText = "User";
    if (loggedIn && user) {
      labelText = getFirstNameFromUser(user) || user.phone || "User";
    }
    if (userLabel) userLabel.textContent = labelText;

    if (userImage) {
      userImage.src = FALLBACK_USER_IMAGE;
      userImage.onerror = function () {
        this.src = FALLBACK_USER_IMAGE;
      };
    }

    // Dropdown toggle (supports CSS class "show" OR "active")
    if (userDropdown && !userButton.dataset.dropdownBound) {
      userButton.dataset.dropdownBound = "1";

      userButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        userDropdown.classList.toggle("show");
        userDropdown.classList.toggle("active");
      });

      document.addEventListener("click", function () {
        userDropdown.classList.remove("show");
        userDropdown.classList.remove("active");
      });
    }

    if (logoutBtn) {
      logoutBtn.style.display = loggedIn ? "block" : "none";

      if (!logoutBtn.dataset.logoutBound) {
        logoutBtn.dataset.logoutBound = "1";
        logoutBtn.addEventListener("click", function (event) {
          event.preventDefault();
          logout();
        });
      }
    }

    if (deleteAccountBtn) {
      deleteAccountBtn.style.display = loggedIn ? "block" : "none";

      if (!deleteAccountBtn.dataset.deleteBound) {
        deleteAccountBtn.dataset.deleteBound = "1";
        deleteAccountBtn.addEventListener("click", function (event) {
          event.preventDefault();
          handleDeleteAccount();
        });
      }
    }
  }

  function runGuardsAndGates() {
    var page = getCurrentPageName();

    if (page === "plantrip.html") {
      if (!requireAuth("plan")) return;
      tryGeneratePlanFromPendingTrip(0);
    }

    if (page === "mytrips.html") {
      if (!requireAuth("mytrips")) return;
    }

    if (page === "index.html" || page === "planner.html") {
      gatePlanFormForUnauthenticatedUsers();
    }
  }

  function boot() {
    updateNavbarUserUI();
    runGuardsAndGates();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.GOYATRA_SESSION = {
    TOKEN_KEY: TOKEN_KEY,
    USER_KEY: USER_KEY,
    PENDING_TRIP_KEY: PENDING_TRIP_KEY,
    LAST_PLAN_KEY: LAST_PLAN_KEY,
    getToken: getToken,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    setSession: setSession,
    clearSession: clearSession,
    logout: logout,
    requireAuth: requireAuth,
    updateNavbarUserUI: updateNavbarUserUI,
    getPendingTrip: getPendingTrip,
    savePendingTrip: savePendingTrip,
    clearPendingTrip: clearPendingTrip
  };
})(window);
