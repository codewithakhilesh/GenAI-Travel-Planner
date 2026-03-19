// assets/js/trips-save.js
(function attachTripSave(global) {
  "use strict";

  var CURRENT_TRIP_KEY = "goyatra_current_trip";
  var CURRENT_PLAN_KEY = "goyatra_current_plan";

  function byId(id) {
    return document.getElementById(id);
  }

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function readFirstObject(keys) {
    for (var i = 0; i < keys.length; i += 1) {
      var parsed = safeParse(localStorage.getItem(keys[i]));
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
    return null;
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

  function sanitizePeople(value) {
    var num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 1;
    return Math.round(num);
  }

  function sanitizeBudget(value) {
    var num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.round(num);
  }

  function readCurrentPlan() {
    var plan = readFirstObject([
      CURRENT_PLAN_KEY,
      "goyatra_last_plan",
      "goyatra_plan",
      "goyatra_trip_plan",
      "goyatra_last_trip_plan"
    ]);

    if (!plan && global.GOYATRA_API && typeof global.GOYATRA_API.readLocalPlan === "function") {
      plan = global.GOYATRA_API.readLocalPlan();
    }

    return plan;
  }

  function readCurrentTrip(plan) {
    var trip = readFirstObject([
      CURRENT_TRIP_KEY,
      "goyatra_trip",
      "goyatra_trip_form",
      "goyatra_booking_form",
      "goyatra_last_form",
      "goyatra_last_trip"
    ]);

    if (trip && trip.form && typeof trip.form === "object") {
      trip = trip.form;
    }

    if (!trip && plan && plan.tripSummary) {
      trip = {
        from: plan.tripSummary.from,
        to: plan.tripSummary.to,
        startDate: plan.tripSummary.startDate,
        endDate: plan.tripSummary.endDate,
        people: plan.tripSummary.people,
        travelType: plan.tripSummary.travelTypeLabel || plan.tripSummary.travelType,
        transport: plan.tripSummary.transportModeLabel || plan.tripSummary.transportMode,
        budget: plan.tripSummary.totalBudget,
        bestTime: plan.bestTime
      };
    }

    return trip;
  }

  function normalizePayload(trip, plan) {
    var source = trip || {};

    return {
      from: String(source.from || "").trim(),
      to: String(source.to || "").trim(),
      startDate: String(source.startDate || "").trim(),
      endDate: String(source.endDate || "").trim(),
      people: sanitizePeople(source.people),
      travelType: String(source.travelType || "").trim(),
      transport: String(source.transport || source.transportMode || "").trim(),
      budget: sanitizeBudget(source.budget),
      bestTime: normalizeBestTime(source.bestTime || (plan && plan.bestTime)),
      plan: plan || null
    };
  }

  function saveCurrentState(payload) {
    var tripOnly = {
      from: payload.from,
      to: payload.to,
      startDate: payload.startDate,
      endDate: payload.endDate,
      people: payload.people,
      travelType: payload.travelType,
      transport: payload.transport,
      budget: payload.budget,
      bestTime: payload.bestTime
    };

    localStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(tripOnly));
    localStorage.setItem(CURRENT_PLAN_KEY, JSON.stringify(payload.plan || {}));
    localStorage.setItem("goyatra_last_plan", JSON.stringify(payload.plan || {}));

    if (global.GOYATRA_API && typeof global.GOYATRA_API.writeLocalPlan === "function" && payload.plan) {
      global.GOYATRA_API.writeLocalPlan(payload.plan);
    }
  }

  async function handleSaveTripClick() {
    var api = global.GOYATRA_API;
    if (!api || typeof api.createTrip !== "function") {
      alert("API is not ready. Please refresh and try again.");
      return;
    }

    var plan = readCurrentPlan();
    var trip = readCurrentTrip(plan);
    var payload = normalizePayload(trip, plan);

    if (!payload.from || !payload.to || !payload.startDate || !payload.endDate) {
      alert("Trip details are incomplete. Please generate the trip plan again.");
      return;
    }

    if (!payload.plan) {
      alert("Trip plan is missing. Please generate the trip plan again.");
      return;
    }

    var saveButton = byId("saveTripBtn");
    var originalText = saveButton ? saveButton.textContent : "Save Trips";

    try {
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
      }

      saveCurrentState(payload);
      await api.createTrip(payload);
      global.location.href = "mytrips.html";
    } catch (error) {
      var message = error && error.message ? error.message : "Unable to save trip";
      alert("Save failed: " + message);
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saveButton = byId("saveTripBtn");
    if (!saveButton) return;

    saveButton.addEventListener("click", function (event) {
      event.preventDefault();
      handleSaveTripClick();
    });
  });
})(window);
