const fs = require("fs/promises");
const path = require("path");

const DESTINATIONS_FILE = path.join(__dirname, "..", "data", "destinations.routes.json");

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function readDestinations() {
  const raw = await fs.readFile(DESTINATIONS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.destinations) ? parsed.destinations : [];
}

function normalizeDestination(destination) {
  return {
    id: destination.id,
    slug: toSlug(destination.name),
    name: destination.name,
    categories: Array.isArray(destination.categories) ? destination.categories : [],
    bestTime: destination.bestTime || "",
    budget: destination.budget || { min: 0, max: 0, currency: "INR" },
    places: Array.isArray(destination.places) ? destination.places : [],
    images: Array.isArray(destination.images) ? destination.images : [],
  };
}

async function listDestinations(filters = {}) {
  const { category, search } = filters;
  const destinations = (await readDestinations()).map(normalizeDestination);

  return destinations.filter((destination) => {
    const categoryMatch = !category || destination.categories.includes(String(category).toLowerCase());
    const searchTerm = String(search || "").trim().toLowerCase();
    const searchMatch =
      !searchTerm ||
      destination.name.toLowerCase().includes(searchTerm) ||
      destination.slug.includes(searchTerm);

    return categoryMatch && searchMatch;
  });
}

async function getDestinationBySlug(slug) {
  const normalizedSlug = toSlug(slug);
  const destinations = (await readDestinations()).map(normalizeDestination);
  return destinations.find((destination) => destination.slug === normalizedSlug) || null;
}

module.exports = {
  toSlug,
  listDestinations,
  getDestinationBySlug,
};
