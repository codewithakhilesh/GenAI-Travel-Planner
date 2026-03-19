// assets/js/plantrip.js
(function initPlanTripPage(global) {
  "use strict";

  const STORAGE_KEY = "goyatra_last_plan";
  const CURRENT_TRIP_KEY = "goyatra_current_trip";
  const CURRENT_PLAN_KEY = "goyatra_current_plan";
  const VIEW_TRIP_ID_KEY = "goyatra_view_trip_id";

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCurrency(amount) {
    const value = Number(amount) || 0;
    return "Rs " + Math.round(value).toLocaleString("en-IN");
  }

  function formatDate(dateStr) {
    const raw = String(dateStr || "").trim();
    if (!raw) return "-";
    const date = new Date(raw + "T00:00:00");
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function capitalize(value) {
    const text = String(value || "");
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function readPlanFromStorage() {
    if (global.GOYATRA_API && typeof global.GOYATRA_API.readLocalPlan === "function") {
      const plan = global.GOYATRA_API.readLocalPlan();
      if (plan) return plan;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function normalizeBestTimeText(value) {
    if (value == null) return "";

    if (typeof value === "string") {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => String(item == null ? "" : item).trim())
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
          .map((tip) => String(tip == null ? "" : tip).trim())
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

  function readViewTripId() {
    const params = new URLSearchParams(global.location.search || "");
    const fromQuery = params.get("tripId") || params.get("id");
    if (fromQuery) return String(fromQuery).trim();

    const fromStorage = localStorage.getItem(VIEW_TRIP_ID_KEY);
    if (fromStorage) return String(fromStorage).trim();

    return "";
  }

  function persistCurrentTripState(plan, tripRecord) {
    if (!plan || typeof plan !== "object") return;

    const summary = plan.tripSummary || {};
    const form = (tripRecord && tripRecord.form && typeof tripRecord.form === "object")
      ? tripRecord.form
      : (tripRecord || {});

    const bestTime =
      normalizeBestTimeText(form.bestTime) ||
      normalizeBestTimeText(tripRecord && tripRecord.bestTime) ||
      normalizeBestTimeText(plan.bestTime);

    const currentTrip = {
      from: String(form.from || summary.from || "").trim(),
      to: String(form.to || summary.to || "").trim(),
      startDate: String(form.startDate || summary.startDate || "").trim(),
      endDate: String(form.endDate || summary.endDate || "").trim(),
      people: Number(form.people != null ? form.people : summary.people || 1) || 1,
      travelType: String(form.travelType || summary.travelTypeLabel || summary.travelType || "").trim(),
      transport: String(form.transport || summary.transportModeLabel || summary.transportMode || "").trim(),
      budget: Number(form.budget != null ? form.budget : summary.totalBudget || 0) || 0
    };

    if (bestTime) {
      currentTrip.bestTime = bestTime;
    }

    localStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(currentTrip));
    localStorage.setItem(CURRENT_PLAN_KEY, JSON.stringify(plan));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));

    if (global.GOYATRA_API && typeof global.GOYATRA_API.writeLocalPlan === "function") {
      global.GOYATRA_API.writeLocalPlan(plan);
    }
  }

  async function loadPlanFromViewedTripIfAny() {
    const viewTripId = readViewTripId();
    if (!viewTripId) return null;

    if (!global.GOYATRA_API || typeof global.GOYATRA_API.getTrip !== "function") {
      throw new Error("Trip API is not available");
    }

    const trip = await global.GOYATRA_API.getTrip(viewTripId);
    const plan = trip && trip.plan ? trip.plan : null;
    if (!plan) {
      throw new Error("Saved trip plan is missing");
    }

    persistCurrentTripState(plan, trip);
    localStorage.removeItem(VIEW_TRIP_ID_KEY);
    return plan;
  }

  function setResultsVisible() {
    const section = byId("tripResults");
    if (section) section.style.display = "block";
  }

  function renderTransportOptionsHtml(transport) {
    if (!transport || !transport.mode) return "";

    if (transport.mode === "flight") {
      const rows = (transport.options || [])
        .map((option) => (
          "<li>" +
          escapeHtml(option.airline) +
          " | " +
          escapeHtml(option.time) +
          " | " +
          formatCurrency(option.price) +
          " one-way/person</li>"
        ))
        .join("");

      return (
        "<div class='tp-line'><strong>Flight Options:</strong><ul>" +
        rows +
        "</ul><div><strong>Range:</strong> " +
        formatCurrency(transport.priceRange.min) +
        " - " +
        formatCurrency(transport.priceRange.max) +
        " one-way/person</div></div>"
      );
    }

    if (transport.mode === "train") {
      const rows = (transport.options || [])
        .map((option) => (
          "<li>" +
          escapeHtml(option.name) +
          " (" +
          escapeHtml(option.number) +
          ") | " +
          escapeHtml(option.time) +
          " | " +
          formatCurrency(option.price) +
          " one-way/person</li>"
        ))
        .join("");

      return (
        "<div class='tp-line'><strong>Train Options:</strong><ul>" +
        rows +
        "</ul><div><strong>Range:</strong> " +
        formatCurrency(transport.priceRange.min) +
        " - " +
        formatCurrency(transport.priceRange.max) +
        " one-way/person</div></div>"
      );
    }

    if (transport.mode === "car" || transport.mode === "bike") {
      return (
        "<div class='tp-line'>" +
        "<strong>Road Estimate:</strong> " +
        escapeHtml(String(transport.roundTripKm || 0)) +
        " km round-trip, approx " +
        escapeHtml(String(transport.travelTime || "")) +
        " one-way, fuel " +
        escapeHtml(String(transport.fuelLiters || 0)) +
        " L, fuel cost " +
        formatCurrency(transport.fuelCost || 0) +
        ", extra road cost " +
        formatCurrency(transport.extraRoadCost || 0) +
        "." +
        "</div>"
      );
    }

    return "";
  }

  function renderTripSummary(plan) {
    const container = byId("tripSummary");
    if (!container) return;

    const summary = plan.tripSummary || {};
    const transport = plan.transport || {};

    container.innerHTML =
      "<div class='tp-line'><strong>Route:</strong> " +
      escapeHtml(summary.from || "") +
      " → " +
      escapeHtml(summary.to || "") +
      "</div>" +
      "<div class='tp-line'><strong>Dates:</strong> " +
      formatDate(summary.startDate) +
      " - " +
      formatDate(summary.endDate) +
      "</div>" +
      "<div class='tp-line'><strong>Duration:</strong> " +
      escapeHtml(String(summary.days || 0)) +
      " days / " +
      escapeHtml(String(summary.nights || 0)) +
      " nights</div>" +
      "<div class='tp-line'><strong>People:</strong> " +
      escapeHtml(String(summary.people || 1)) +
      "</div>" +
      "<div class='tp-line'><strong>Travel Type:</strong> " +
      escapeHtml(summary.travelTypeLabel || capitalize(summary.travelType)) +
      "</div>" +
      "<div class='tp-line'><strong>Transport Mode:</strong> " +
      escapeHtml(summary.transportModeLabel || capitalize(summary.transportMode)) +
      "</div>" +
      "<div class='tp-line'><strong>Total Budget:</strong> " +
      formatCurrency(summary.totalBudget || 0) +
      "</div>" +
      "<div class='tp-line'><strong>Distance:</strong> " +
      escapeHtml(String(transport.distanceKm || 0)) +
      " km (Nagpur to " +
      escapeHtml(summary.to || "") +
      ")</div>" +
      "<div class='tp-line'><strong>Travel Time:</strong> " +
      escapeHtml(String(transport.travelTime || "Not available")) +
      "</div>" +
      "<div class='tp-line'><strong>Estimated Transport Total:</strong> " +
      formatCurrency(transport.transportTotal || 0) +
      "</div>" +
      renderTransportOptionsHtml(transport);
  }

  function renderBudgetBreakdown(plan) {
    const container = byId("budgetBreakdown");
    if (!container) return;

    const budget = plan.budgetBreakdown || {};
    const alloc = budget.allocations || {};
    const est = budget.estimates || {};
    const warnings = Array.isArray(budget.warnings) ? budget.warnings : [];

    const balanceLabel = budget.isOverBudget ? "Deficit" : "Remaining Budget";
    const balanceAmount = budget.isOverBudget ? budget.deficit : budget.remainingBudget;

    const warningHtml = warnings.length
      ? "<div class='tp-line' style='color:#b42318;'><strong>Warnings:</strong><ul>" +
        warnings.map((warning) => "<li>" + escapeHtml(warning) + "</li>").join("") +
        "</ul></div>"
      : "";

    container.innerHTML =
      // "<div class='tp-line'><strong>Split Rule:</strong> Transport 25%, Stay 35%, Food 20%, Activities + Local 20%</div>" +
      "<div class='tp-line'><strong>Allocation:</strong> Transport " + formatCurrency(alloc.transport || 0) +
      ", Stay " + formatCurrency(alloc.stay || 0) +
      ", Food " + formatCurrency(alloc.food || 0) +
      ", Activities " + formatCurrency(alloc.activity || 0) +
      ", Local " + formatCurrency(alloc.local || 0) +
      "</div>" +
      "<div class='tp-line'><strong>Estimate:</strong> Transport " + formatCurrency(est.transportTotal || 0) +
      ", Stay " + formatCurrency(est.stayTotal || 0) +
      ", Food " + formatCurrency(est.foodTotal || 0) +
      ", Activities " + formatCurrency(est.activityTotal || 0) +
      ", Local " + formatCurrency(est.localTotal || 0) +
      "</div>" +
      "<div class='tp-line'><strong>Total Estimated Cost:</strong> " + formatCurrency(est.totalEstimatedCost || 0) + "</div>" +
      "<div class='tp-line'><strong>" + balanceLabel + ":</strong> " + formatCurrency(balanceAmount || 0) + "</div>" +
      "<div class='tp-line'><strong>Rooms:</strong> " + escapeHtml(String(budget.rooms || 1)) +
      " | <strong>Nightly Estimate:</strong> " + formatCurrency(budget.nightlyEstimate || 0) + "</div>" +
      warningHtml;
  }

  function renderTopPlaces(plan) {
    const container = byId("topPlaces");
    if (!container) return;

    const places = Array.isArray(plan.topPlaces) ? plan.topPlaces.slice(0, 5) : [];
    if (!places.length) {
      container.innerHTML = "<p>No place data available.</p>";
      return;
    }

    container.innerHTML =
      "<ul>" +
      places
        .map((place) => (
          "<li><strong>" +
          escapeHtml(place.name) +
          ":</strong> " +
          escapeHtml(place.note) +
          " | Best: " +
          escapeHtml(place.bestTime) +
          "</li>"
        ))
        .join("") +
      "</ul>";
  }

  function formatItinerarySlot(slot) {
    if (!slot) return "-";
    return escapeHtml(slot.name) + " - " + escapeHtml(slot.note) + " (Best: " + escapeHtml(slot.bestTime) + ")";
  }

  function renderItinerary(plan) {
    const container = byId("itinerary");
    if (!container) return;

    const itinerary = Array.isArray(plan.itinerary) ? plan.itinerary : [];
    if (!itinerary.length) {
      container.innerHTML = "<p>No itinerary available.</p>";
      return;
    }

    container.innerHTML = itinerary
      .map(
        (dayPlan) =>
          "<div class='tp-line'>" +
          "<strong>Day " +
          escapeHtml(String(dayPlan.day)) +
          "</strong>" +
          "<ul>" +
          "<li><strong>Morning:</strong> " +
          formatItinerarySlot(dayPlan.morning) +
          "</li>" +
          "<li><strong>Afternoon:</strong> " +
          formatItinerarySlot(dayPlan.afternoon) +
          "</li>" +
          "<li><strong>Evening:</strong> " +
          formatItinerarySlot(dayPlan.evening) +
          "</li>" +
          "</ul>" +
          (Array.isArray(dayPlan.notes) && dayPlan.notes.length
            ? "<p><strong>Notes:</strong> " + dayPlan.notes.map((n) => escapeHtml(n)).join(" | ") + "</p>"
            : "") +
          "</div>"
      )
      .join("");
  }

  function renderBestTime(plan) {
    const container = byId("bestTime");
    if (!container) return;

    const best = plan.bestTime || {};
    const tips = Array.isArray(best.dayTips) ? best.dayTips : [];

    container.innerHTML =
      "<div class='tp-line'><strong>Season:</strong> " + escapeHtml(best.season || "Not available") + "</div>" +
      "<div class='tp-line'><strong>Why:</strong> " + escapeHtml(best.overview || "Not available") + "</div>" +
      "<div class='tp-line'><strong>Best Time of Day Tips:</strong><ul>" +
      tips.map((tip) => "<li>" + escapeHtml(tip) + "</li>").join("") +
      "</ul></div>";
  }

  function normalizePlacesForCarousel(places) {
    const base = Array.isArray(places) ? places.slice(0, 10) : [];
    if (!base.length) return [];
    let pointer = 0;
    while (base.length < 10) {
      base.push(base[pointer % base.length]);
      pointer += 1;
    }
    return base.slice(0, 10);
  }

  function renderFamousPlacesCarousel(plan) {
    const track = byId("placeTrack");
    if (!track) return;

    const places = normalizePlacesForCarousel(plan.famousPlaces);
    track.innerHTML = places
      .map(
        (place) =>
          "<div class='hotel-card'>" +
          "<img src='" +
          escapeHtml(place.img) +
          "' alt='" +
          escapeHtml(place.name) +
          "'>" +
          "<div class='hotel-info'>" +
          "<h4 class='hotel-name'>" +
          escapeHtml(place.name) +
          "</h4>" +
          "<p>" +
          escapeHtml(place.note) +
          "</p>" +
          "<p><strong>Best:</strong> " +
          escapeHtml(place.bestTime) +
          "</p>" +
          "</div>" +
          "</div>"
      )
      .join("");
  }

  function normalizeHotelsForCarousel(hotels) {
    const base = Array.isArray(hotels) ? hotels.slice(0, 6) : [];
    if (!base.length) return [];
    let pointer = 0;
    while (base.length < 6) {
      base.push(base[pointer % base.length]);
      pointer += 1;
    }
    return base;
  }

  function renderHotelWarning(message) {
    const carousel = byId("hotelCarousel");
    if (!carousel || !carousel.parentNode) return;

    let warningNode = byId("hotelWarningMessage");
    if (!warningNode) {
      warningNode = document.createElement("p");
      warningNode.id = "hotelWarningMessage";
      warningNode.className = "plan-note";
      warningNode.style.color = "#b54708";
      carousel.parentNode.insertBefore(warningNode, carousel);
    }

    warningNode.textContent = message || "";
    warningNode.style.display = message ? "block" : "none";
  }

  function renderHotelsCarousel(plan) {
    const track = byId("hotelTrack");
    if (!track) return;

    const hotels = normalizeHotelsForCarousel(plan.hotels);
    track.innerHTML = hotels
      .map(
        (hotel) =>
          "<div class='hotel-card'>" +
          "<img src='" +
          escapeHtml(hotel.img) +
          "' alt='" +
          escapeHtml(hotel.name) +
          "'>" +
          "<div class='hotel-info'>" +
          "<h4 class='hotel-name'>" +
          escapeHtml(hotel.name) +
          "</h4>" +
          "<p><strong>Near:</strong> " +
          escapeHtml(hotel.area) +
          "</p>" +
          "<p class='hotel-price'>" +
          formatCurrency(hotel.priceNight) +
          " / night</p>" +
          "<p><strong>Rating:</strong> " +
          escapeHtml(String(hotel.rating)) +
          "</p>" +
          "</div>" +
          "</div>"
      )
      .join("");

    renderHotelWarning(plan.hotelWarning || "");
  }

  function setupCarousel(trackId, prevId, nextId) {
    const track = byId(trackId);
    const prevButton = byId(prevId);
    const nextButton = byId(nextId);
    if (!track || !prevButton || !nextButton) return;

    let currentIndex = 0;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function getMetrics() {
      const cards = track.children;
      if (!cards.length) return { step: 0, maxIndex: 0 };

      const firstCard = cards[0];
      const cardWidth = firstCard.getBoundingClientRect().width;
      const gap = parseFloat(global.getComputedStyle(track).gap || "0") || 0;
      const step = cardWidth + gap;
      const viewportWidth = track.parentElement.getBoundingClientRect().width;
      const cardsPerView = step > 0 ? Math.max(1, Math.floor((viewportWidth + gap) / step)) : 1;
      const maxIndex = Math.max(0, cards.length - cardsPerView);

      return { step, maxIndex };
    }

    function updatePosition() {
      const metrics = getMetrics();
      currentIndex = clamp(currentIndex, 0, metrics.maxIndex);
      const offset = -(currentIndex * metrics.step);
      track.style.transform = "translateX(" + offset + "px)";
      prevButton.disabled = currentIndex <= 0;
      nextButton.disabled = currentIndex >= metrics.maxIndex;
    }

    prevButton.addEventListener("click", function () {
      currentIndex -= 1;
      updatePosition();
    });

    nextButton.addEventListener("click", function () {
      currentIndex += 1;
      updatePosition();
    });

    global.addEventListener("resize", updatePosition);
    global.addEventListener("load", updatePosition);
    updatePosition();
  }

  function itinerarySlotText(slot) {
    if (!slot) return "";
    return slot.name + " - " + slot.note + " (Best: " + slot.bestTime + ")";
  }

  function downloadPlanPDF(plan) {
    if (!global.jspdf || !global.jspdf.jsPDF) {
      alert("jsPDF is not loaded.");
      return;
    }

    const doc = new global.jspdf.jsPDF();
    let y = 16;
    const lineGap = 6;
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = 182;

    function ensureSpace(linesNeeded) {
      if (y + linesNeeded * lineGap > pageHeight - 12) {
        doc.addPage();
        y = 16;
      }
    }

    function writeHeading(text) {
      ensureSpace(2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(text, 14, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }

    function writeLine(text) {
      const lines = doc.splitTextToSize(String(text), maxWidth);
      ensureSpace(lines.length + 1);
      for (let i = 0; i < lines.length; i += 1) {
        doc.text(lines[i], 14, y);
        y += lineGap;
      }
    }

    const summary = plan.tripSummary || {};
    const budget = plan.budgetBreakdown || {};
    const est = budget.estimates || {};
    const transport = plan.transport || {};
    const best = plan.bestTime || {};
    const itinerary = Array.isArray(plan.itinerary) ? plan.itinerary : [];

    writeHeading("GoYatra Travel Plan");
    writeLine("From: " + (summary.from || ""));
    writeLine("To: " + (summary.to || ""));
    writeLine("Dates: " + formatDate(summary.startDate) + " - " + formatDate(summary.endDate));
    writeLine("Duration: " + (summary.days || 0) + " days / " + (summary.nights || 0) + " nights");
    writeLine("People: " + (summary.people || 1));
    writeLine("Travel Type: " + (summary.travelTypeLabel || capitalize(summary.travelType)));
    writeLine("Transport Mode: " + (summary.transportModeLabel || capitalize(summary.transportMode)));
    writeLine("Total Budget: " + formatCurrency(summary.totalBudget || 0));
    writeLine("Distance: " + (transport.distanceKm || 0) + " km");
    writeLine("Travel Time: " + (transport.travelTime || "Not available"));

    writeHeading("Budget Breakdown");
    writeLine("Transport: " + formatCurrency(est.transportTotal || 0));
    writeLine("Stay: " + formatCurrency(est.stayTotal || 0));
    writeLine("Food: " + formatCurrency(est.foodTotal || 0));
    writeLine("Activities: " + formatCurrency(est.activityTotal || 0));
    writeLine("Local: " + formatCurrency(est.localTotal || 0));
    writeLine("Total Estimated Cost: " + formatCurrency(est.totalEstimatedCost || 0));
    writeLine("Remaining Budget: " + formatCurrency(budget.remainingBudget || 0));
    if (budget.deficit) writeLine("Deficit: " + formatCurrency(budget.deficit));

    writeHeading("Day-by-Day Itinerary");
    for (let i = 0; i < itinerary.length; i += 1) {
      const dayPlan = itinerary[i];
      writeLine("Day " + dayPlan.day);
      writeLine("Morning: " + itinerarySlotText(dayPlan.morning));
      writeLine("Afternoon: " + itinerarySlotText(dayPlan.afternoon));
      writeLine("Evening: " + itinerarySlotText(dayPlan.evening));
      if (Array.isArray(dayPlan.notes) && dayPlan.notes.length) {
        writeLine("Notes: " + dayPlan.notes.join(" | "));
      }
    }

    writeHeading("Best Time to Visit");
    writeLine("Season: " + (best.season || "Not available"));
    writeLine("Overview: " + (best.overview || "Not available"));
    if (Array.isArray(best.dayTips)) {
      for (let i = 0; i < best.dayTips.length; i += 1) {
        writeLine("- " + best.dayTips[i]);
      }
    }

    const destinationSlug = String(summary.to || "Plan").replace(/[^a-z0-9]+/gi, "_");
    doc.save("GoYatra_TripPlan_" + destinationSlug + ".pdf");
  }

  function setupButtons(plan) {
    const downloadButton = byId("downloadPlanBtn");
    if (downloadButton) {
      downloadButton.onclick = function () {
        downloadPlanPDF(plan);
      };
    }

    const newTripButton = byId("newTripBtn");
    if (newTripButton) {
      newTripButton.onclick = function () {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CURRENT_PLAN_KEY);
        localStorage.removeItem(CURRENT_TRIP_KEY);
        localStorage.removeItem(VIEW_TRIP_ID_KEY);
        if (global.GOYATRA_PLAN_GENERATOR && typeof global.GOYATRA_PLAN_GENERATOR.clearPlanFromStorage === "function") {
          global.GOYATRA_PLAN_GENERATOR.clearPlanFromStorage();
        }
        if (global.GOYATRA_API && typeof global.GOYATRA_API.clearLocalPlan === "function") {
          global.GOYATRA_API.clearLocalPlan();
        }
        global.location.href = "index.html";
      };
    }
  }

  function renderDestinationImage(plan) {
  const image = byId("destinationImage");
  if (!image) return;

  image.src = plan.destinationImage || "assets/images/goa1.jpg";
  image.onerror = () => image.src = "assets/images/goa1.jpg";

  image.alt = (plan.tripSummary && plan.tripSummary.to ? plan.tripSummary.to : "Destination") + " image";
}

  function renderPlan(plan) {
    renderDestinationImage(plan);
    renderTripSummary(plan);
    renderBudgetBreakdown(plan);
    renderTopPlaces(plan);
    renderItinerary(plan);
    renderBestTime(plan);
    renderFamousPlacesCarousel(plan);
    renderHotelsCarousel(plan);
    setupCarousel("placeTrack", "placePrev", "placeNext");
    setupCarousel("hotelTrack", "hotelPrev", "hotelNext");
    setupButtons(plan);
    setResultsVisible();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!byId("tripResults")) {
      return;
    }

const viewedPlan = await loadPlanFromViewedTripIfAny();
if (viewedPlan) {
  renderPlan(viewedPlan);
  return;
}

    const plan = readPlanFromStorage();
    if (!plan) {
      alert("No saved trip plan found. Please plan your trip from the home page.");
      global.location.href = "index.html";
      return;
    }

    persistCurrentTripState(plan, null);
    renderPlan(plan);
  });
})(window);



