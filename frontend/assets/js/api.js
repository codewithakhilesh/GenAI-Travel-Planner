// assets/js/api.js
(function (global) {
  "use strict";

  var LAST_PLAN_KEY = "goyatra_last_plan";
  var BASE = String(global.GOYATRA_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function readLocalPlan() {
    try {
      var raw = localStorage.getItem(LAST_PLAN_KEY);
      if (!raw) return null;
      return safeParse(raw);
    } catch (_error) {
      return null;
    }
  }

  function writeLocalPlan(plan) {
    try {
      localStorage.setItem(LAST_PLAN_KEY, JSON.stringify(plan));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function clearLocalPlan() {
    try {
      localStorage.removeItem(LAST_PLAN_KEY);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function formatCurrency(amount) {
    var value = Number(amount) || 0;
    return "Rs " + Math.round(value).toLocaleString("en-IN");
  }

  function parseJsonSafely(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_error) {
      return text;
    }
  }

  function request(path, options) {
    var token = "";
    try {
      token = localStorage.getItem("goyatra_token") || "";
    } catch (_error) {
      token = "";
    }

    var providedHeaders = (options && options.headers) || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, providedHeaders);
    if (token && !headers.Authorization) {
      headers.Authorization = "Bearer " + token;
    }

    var config = Object.assign(
      {
        method: "GET"
      },
      options || {}
    );
    config.headers = headers;

    return fetch(BASE + path, config).then(function (response) {
      return response.text().then(function (text) {
        var data = parseJsonSafely(text);

        if (!response.ok) {
          var message =
            (data && (data.message || data.error || data.details)) ||
            ("HTTP " + response.status);
          var err = new Error(message);
          err.status = response.status;
          err.response = data;
          throw err;
        }
        return data;
      });
    });
  }

  function normalizeBestTime(bestTime) {
    if (bestTime == null) return "";

    if (typeof bestTime === "string") {
      return bestTime.trim();
    }

    if (Array.isArray(bestTime)) {
      return bestTime
        .map(function (item) {
          return String(item == null ? "" : item).trim();
        })
        .filter(Boolean)
        .join(", ");
    }

    if (typeof bestTime === "object") {
      if (typeof bestTime.season === "string" && bestTime.season.trim()) {
        return bestTime.season.trim();
      }
      if (typeof bestTime.overview === "string" && bestTime.overview.trim()) {
        return bestTime.overview.trim();
      }
      if (Array.isArray(bestTime.dayTips) && bestTime.dayTips.length) {
        return bestTime.dayTips
          .map(function (tip) {
            return String(tip == null ? "" : tip).trim();
          })
          .filter(Boolean)
          .join(" | ");
      }
      try {
        return JSON.stringify(bestTime);
      } catch (_error) {
        return String(bestTime);
      }
    }

    return String(bestTime);
  }

  function normalizeTripForm(payload) {
    var source = payload || {};
    var sourceForm = source.form && typeof source.form === "object" ? source.form : {};

    var peopleRaw = source.people != null ? source.people : sourceForm.people;
    var budgetRaw = source.budget != null ? source.budget : sourceForm.budget;

    var people = Number(peopleRaw);
    if (!Number.isFinite(people) || people <= 0) people = 1;

    var budget = Number(budgetRaw);
    if (!Number.isFinite(budget) || budget < 0) budget = 0;

    var bestTimeRaw = source.bestTime != null ? source.bestTime : sourceForm.bestTime;
    var bestTime = normalizeBestTime(bestTimeRaw);

    var form = {
      from: String(source.from != null ? source.from : sourceForm.from || "").trim(),
      to: String(source.to != null ? source.to : sourceForm.to || "").trim(),
      startDate: String(source.startDate != null ? source.startDate : sourceForm.startDate || "").trim(),
      endDate: String(source.endDate != null ? source.endDate : sourceForm.endDate || "").trim(),
      people: people,
      travelType: String(source.travelType != null ? source.travelType : sourceForm.travelType || "").trim(),
      transport: String(source.transport != null ? source.transport : sourceForm.transport || "").trim(),
      budget: budget
    };

    if (bestTime) {
      form.bestTime = bestTime;
    }

    return form;
  }

  function unwrapTripsList(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    if (Array.isArray(payload.trips)) return payload.trips;

    if (payload.data) {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.data.trips)) return payload.data.trips;
    }

    return [];
  }

  function unwrapTrip(payload) {
    if (!payload || typeof payload !== "object") return null;

    if (payload.trip && typeof payload.trip === "object") return payload.trip;
    if (payload.data && payload.data.trip && typeof payload.data.trip === "object") return payload.data.trip;

    if (payload.data && typeof payload.data === "object") {
      if (payload.data.id || payload.data.tripId || payload.data.form || payload.data.plan) {
        return payload.data;
      }
    }

    if (payload.id || payload.tripId || payload.form || payload.plan) return payload;
    return null;
  }

  var api = global.GOYATRA_API || {};

  api.LAST_PLAN_KEY = LAST_PLAN_KEY;
  api.readLocalPlan = readLocalPlan;
  api.writeLocalPlan = writeLocalPlan;
  api.clearLocalPlan = clearLocalPlan;
  api.formatCurrency = formatCurrency;

  api.listTrips = function () {
    return request("/api/trips").then(unwrapTripsList);
  };

  api.getTrip = function (id) {
    return request("/api/trips/" + encodeURIComponent(id)).then(function (result) {
      var trip = unwrapTrip(result);
      if (!trip) {
        throw new Error("Trip not found in API response");
      }
      return trip;
    });
  };

  api.createTrip = function (payload) {
    var source = payload || {};
    var requestBody = {
      form: normalizeTripForm(source),
      plan: source.plan || null
    };

    return request("/api/trips", {
      method: "POST",
      body: JSON.stringify(requestBody)
    }).then(function (result) {
      return unwrapTrip(result) || result;
    });
  };

  api.deleteTrip = function (id) {
    return request("/api/trips/" + encodeURIComponent(id), {
      method: "DELETE"
    });
  };

  api.deleteAccount = function () {
    return request("/api/auth/delete-account", {
      method: "DELETE"
    });
  };

  api.apiFetch = function (path, options) {
    return request(path, options);
  };

  global.GOYATRA_API = api;

  global.API = global.API || {
    get: function (path) {
      return request(path, { method: "GET" });
    },
    post: function (path, body) {
      return request(path, { method: "POST", body: JSON.stringify(body) });
    },
    del: function (path) {
      return request(path, { method: "DELETE" });
    }
  };
})(window);
