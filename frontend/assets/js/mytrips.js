

// assets/js/mytrips.js
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var api = window.GOYATRA_API;
  var statusEl = document.getElementById("myTripsStatus");
  var grid = document.getElementById("main");

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message || "";
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function formatDate(dateValue) {
    var text = String(dateValue || "").trim();
    if (!text) return "-";

    var date = new Date(text + "T00:00:00");
    if (Number.isNaN(date.getTime())) {
      return text;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatBudget(amount) {
    if (window.GOYATRA_API && typeof window.GOYATRA_API.formatCurrency === "function") {
      return window.GOYATRA_API.formatCurrency(amount);
    }

    var value = Number(amount) || 0;
    return "Rs " + Math.round(value).toLocaleString("en-IN");
  }

  function bestTimeText(value) {
    if (value == null) return "";

    if (typeof value === "string") {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value
        .map(function (item) {
          return String(item == null ? "" : item).trim();
        })
        .filter(Boolean)
        .join(", ");
    }

    if (typeof value === "object") {
      if (typeof value.season === "string" && value.season.trim()) {
        return value.season.trim();
      }
      if (typeof value.overview === "string" && value.overview.trim()) {
        return value.overview.trim();
      }
      if (Array.isArray(value.dayTips) && value.dayTips.length) {
        return value.dayTips
          .map(function (tip) {
            return String(tip == null ? "" : tip).trim();
          })
          .filter(Boolean)
          .join(" | ");
      }
      try {
        return JSON.stringify(value);
      } catch (_error) {
        return String(value);
      }
    }

    return String(value);
  }

  function normalizeTrip(rawTrip) {
    var trip = rawTrip || {};
    var form = trip.form && typeof trip.form === "object" ? trip.form : trip;
    var summary = trip.plan && trip.plan.tripSummary ? trip.plan.tripSummary : {};

    var id = trip.id || trip._id || trip.tripId || "";
    var from = String(form.from || summary.from || "").trim();
    var to = String(form.to || summary.to || "").trim();
    var startDate = String(form.startDate || summary.startDate || "").trim();
    var endDate = String(form.endDate || summary.endDate || "").trim();
    var people = form.people != null ? form.people : summary.people;
    var travelType = String(form.travelType || summary.travelTypeLabel || summary.travelType || "").trim();
    var transport = String(form.transport || summary.transportModeLabel || summary.transportMode || "").trim();

    var budgetRaw = form.budget != null ? form.budget : summary.totalBudget;
    var budget = Number(budgetRaw);
    if (!Number.isFinite(budget)) budget = 0;

    var best = bestTimeText(form.bestTime || trip.bestTime || (trip.plan && trip.plan.bestTime));
    var title = String(trip.title || "").trim();
    if (!title) {
      title = (to || "Trip") + " Trip";
    }

    return {
      id: id,
      title: title,
      from: from,
      to: to,
      startDate: startDate,
      endDate: endDate,
      people: people,
      travelType: travelType,
      transport: transport,
      budget: budget,
      bestTime: best
    };
  }

  function buildCardMeta(trip) {
    var parts = [];
    parts.push("Dates: " + formatDate(trip.startDate) + " - " + formatDate(trip.endDate));
    parts.push("Budget: " + formatBudget(trip.budget));
    parts.push("From: " + (trip.from || "-"));
    parts.push("People: " + (trip.people || "-"));
    parts.push("Travel Type: " + (trip.travelType || "-"));
    parts.push("Transport: " + (trip.transport || "-"));
    if (trip.bestTime) {
      parts.push("Best Time: " + trip.bestTime);
    }
    return parts.join(" | ");
  }

  function renderTrips(trips) {
    if (!grid) return;

    if (!Array.isArray(trips) || trips.length === 0) {
      grid.innerHTML = "";
      setStatus("No trips saved yet");
      return;
    }

    setStatus("");

    var cardsHtml = trips
      .map(function (rawTrip) {
        var trip = normalizeTrip(rawTrip);
        return (
          '<article class="card" data-id="' +
          escapeHtml(trip.id) +
          '">' +
          '<div class="card-content">' +
          "<div>" +
          '<h3 class="card-title">' +
          escapeHtml(trip.from || "FROM") +
          ' <span class="route-arrow" aria-hidden="true">→</span> ' +
          escapeHtml(trip.to || "TO") +
          "</h3>" +
          '<p class="card-sub">' +
          escapeHtml(buildCardMeta(trip)) +
          "</p>" +
          "</div>" +
          '<div class="card-actions">' +
          '<button class="btn-card btn-view" type="button" data-action="view" data-id="' +
          escapeHtml(trip.id) +
          '">View Details</button>' +
          '<button class="btn-card btn-delete" type="button" data-action="delete" data-id="' +
          escapeHtml(trip.id) +
          '">Delete</button>' +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    grid.innerHTML = cardsHtml;
  }

  function removeCardFromUI(tripId) {
    if (!grid) return;

    var idText = String(tripId);
    var cards = grid.querySelectorAll(".card[data-id]");
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].getAttribute("data-id") === idText) {
        cards[i].remove();
        break;
      }
    }

    if (!grid.children.length) {
      setStatus("No trips saved yet");
    }
  }

  async function loadTrips() {
    if (!api || typeof api.listTrips !== "function") {
      setStatus("API not ready. Check assets/js/api.js");
      return;
    }

    setStatus("Loading trips...");

    try {
      var trips = await api.listTrips();
      renderTrips(trips);
    } catch (error) {
      var message = error && error.message ? error.message : "Unable to load trips";
      setStatus("Failed to load trips: " + message);
    }
  }

  if (grid) {
    grid.addEventListener("click", async function (event) {
      var button = event.target.closest("button[data-action]");
      if (!button) return;

      var action = button.getAttribute("data-action");
      var tripId = button.getAttribute("data-id");
      if (!tripId) return;

      if (action === "view") {
        localStorage.setItem("goyatra_view_trip_id", tripId);
        window.location.href = "plantrip.html";
        return;
      }

      if (action === "delete") {
        if (!confirm("Delete this trip?")) return;

        try {
          button.disabled = true;
          await api.deleteTrip(tripId);
          removeCardFromUI(tripId);
        } catch (error) {
          var message = error && error.message ? error.message : "Unable to delete trip";
          alert("Delete failed: " + message);
        } finally {
          button.disabled = false;
        }
      }
    });
  }

  loadTrips();
});
