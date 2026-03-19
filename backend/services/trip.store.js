const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const TRIPS_FILE = path.join(__dirname, "..", "data", "trips.json");

async function readTrips() {
  try {
    const raw = await fs.readFile(TRIPS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeTrips(trips) {
  await fs.writeFile(TRIPS_FILE, JSON.stringify(trips, null, 2), "utf-8");
}

async function deleteTripsByUserId(userId) {
  const ownerId = String(userId || "").trim();
  if (!ownerId) return 0;

  const trips = await readTrips();
  const filtered = trips.filter((trip) => String(trip && trip.userId ? trip.userId : "") !== ownerId);
  const deletedCount = trips.length - filtered.length;

  if (deletedCount > 0) {
    await writeTrips(filtered);
  }

  return deletedCount;
}

function newId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `trip_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

module.exports = { readTrips, writeTrips, deleteTripsByUserId, newId };
