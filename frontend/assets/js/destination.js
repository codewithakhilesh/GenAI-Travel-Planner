
function applyAlternateLayout() {
  const cards = Array.from(document.querySelectorAll(".travel-card"));
  const visible = cards.filter(c => !c.classList.contains("hidden"));

  visible.forEach((card, idx) => {
    card.classList.toggle("reverse", idx % 2 === 1);
  });
}



// =========================================================================


const SELECTED_DESTINATION_KEY = "goyatra_selected_destination";

function slugifyDestination(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function ensureDestinationStatusElement() {
  let statusElement = document.getElementById("destinationStatus");
  if (statusElement) return statusElement;

  const section = document.querySelector(".destination-filter") || document.querySelector(".travel-sections");
  if (!section || !section.parentNode) return null;

  statusElement = document.createElement("div");
  statusElement.id = "destinationStatus";
  statusElement.style.maxWidth = "1200px";
  statusElement.style.margin = "0 auto 16px";
  statusElement.style.padding = "0 16px";
  statusElement.style.fontSize = "14px";
  statusElement.style.fontWeight = "500";

  section.parentNode.insertBefore(statusElement, section.nextSibling);
  return statusElement;
}

function setDestinationStatus(message, type) {
  const statusElement = ensureDestinationStatusElement();
  if (!statusElement) return;

  statusElement.textContent = message || "";

  if (type === "error") {
    statusElement.style.color = "#b42318";
  } else if (type === "success") {
    statusElement.style.color = "#027a48";
  } else {
    statusElement.style.color = "#0c5460";
  }
}

function setupHomeBannerSlider() {
  const slides = document.querySelector(".banner-slides");
  const slider = document.querySelector(".banner-slider");
  const totalSlides = document.querySelectorAll(".banner-slides .slide").length;

  if (!slides || !slider || totalSlides === 0) return;

  let index = 0;
  slides.style.transform = "translateX(0%)";

  setInterval(() => {
    index += 1;

    if (index >= totalSlides) {
      slides.style.transition = "none";
      index = 0;
      slides.style.transform = "translateX(0%)";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          slides.style.transition = "transform 0.8s ease-in-out";
        });
      });
      return;
    }

    slides.style.transform = `translateX(-${index * 100}%)`;
  }, 3000);
}

function setupDestinationFilters() {
  const buttons = document.querySelectorAll(".filter-link");
  const cards = document.querySelectorAll(".travel-card");
  if (!buttons.length || !cards.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;
      cards.forEach((card) => {
        const categories = String(card.dataset.category || "")
          .split(",")
          .map((item) => item.trim());
        card.style.display = filter === "all" || categories.includes(filter) ? "flex" : "none";
        card.classList.remove("reverse");
      });

      const visibleCards = Array.from(cards).filter((card) => card.style.display !== "none");
      visibleCards.forEach((card, index) => {
        if (index % 2 !== 0) {
          card.classList.add("reverse");
        }
      });
    });
  });
}

function setupDestinationImageRotator() {
  const allTravelImages = document.querySelectorAll(".travel-images");

  allTravelImages.forEach((container) => {
    const images = container.querySelectorAll("img");
    if (!images.length) return;

    let current = 0;
    images[current].classList.add("active");

    setInterval(() => {
      images[current].classList.remove("active");
      current = (current + 1) % images.length;
      images[current].classList.add("active");
    }, 3000);
  });
}

async function onPlanTripClick(button, card) {
  if (!window.GOYATRA_API || typeof window.GOYATRA_API.apiFetch !== "function") {
    console.error("API helper not loaded. Ensure assets/js/api.js is included before destination.js.");
    setDestinationStatus("App configuration error: API helper missing.", "error");
    return;
  }

  const heading = card.querySelector("h2");
  const destinationName = heading ? heading.textContent.trim() : "";
  if (!destinationName) return;

  const slug = slugifyDestination(destinationName);
  if (!slug) return;

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Loading...";
  setDestinationStatus(`Loading destination details for ${destinationName}...`, "info");

  try {
    const result = await window.GOYATRA_API.apiFetch(`/api/destinations/${encodeURIComponent(slug)}`);
    if (!result.success || !result.data) {
      setDestinationStatus(result.message || "Failed to load destination details.", "error");
      return;
    }

    localStorage.setItem(SELECTED_DESTINATION_KEY, JSON.stringify(result.data));
    setDestinationStatus("Destination loaded. Redirecting to planner...", "success");
    window.location.href = `index.html?destination=${encodeURIComponent(result.data.name)}`;
  } catch (error) {
    console.error("Error fetching destination details:", error);
    setDestinationStatus("Unexpected error while loading destination details.", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function setupPlanTripButtons() {
  const buttons = document.querySelectorAll(".travel-card .travel-details button");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const card = button.closest(".travel-card");
      if (!card) return;
      onPlanTripClick(button, card);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHomeBannerSlider();
  setupDestinationFilters();
  setupDestinationImageRotator();
  setupPlanTripButtons();
});
// ==========================================================================================================
// destination ke plan trip pr click krte hi index.html booking section open js
// ==========================================================================================================
function setupPlanTripButtons() {
  const buttons = document.querySelectorAll(".plan-trip-btn");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const card = button.closest(".travel-card");
      const nameEl = card ? card.querySelector("h2") : null;
      const destinationName = nameEl ? nameEl.textContent.trim() : "";

      // ✅ redirect to booking form with destination in URL
      const url = destinationName
        ? `index.html?destination=${encodeURIComponent(destinationName)}#bookingForm`
        : `index.html#bookingForm`;

      window.location.href = url;
    });
  });
}