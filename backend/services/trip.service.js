const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const TRIPS_FILE = path.join(__dirname, "..", "data", "trips.json");
const REQUIRED_FIELDS = ["from", "to", "startDate", "endDate", "people", "travelType", "transport", "budget"];

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeTripId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function normalizeDateInput(value) {
  return cleanText(value);
}

function sortByLatest(trips) {
  return trips
    .slice()
    .sort((a, b) => {
      const timeA = Date.parse(a.createdAt || "") || 0;
      const timeB = Date.parse(b.createdAt || "") || 0;
      return timeB - timeA;
    });
}

async function ensureStorageFile() {
  const dirPath = path.dirname(TRIPS_FILE);
  await fs.mkdir(dirPath, { recursive: true });

  try {
    await fs.access(TRIPS_FILE);
  } catch (_error) {
    await fs.writeFile(TRIPS_FILE, "[]", "utf8");
  }
}

async function readTrips() {
  await ensureStorageFile();

  const raw = await fs.readFile(TRIPS_FILE, "utf8");
  if (!raw || !raw.trim()) return [];

  const parsed = safeParseJson(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.trips)) return parsed.trips;
  return [];
}

async function writeTrips(trips) {
  await ensureStorageFile();
  await fs.writeFile(TRIPS_FILE, `${JSON.stringify(trips, null, 2)}\n`, "utf8");
}

function validateTripPayload(payload) {
  const body = payload && typeof payload === "object" ? payload : {};
  const normalizedTravelType = cleanText(body.travelType || body.travelGroup);
  const normalizedTransport = cleanText(body.transport || body.transportMode);

  const normalized = {
    from: cleanText(body.from),
    to: cleanText(body.to),
    startDate: normalizeDateInput(body.startDate),
    endDate: normalizeDateInput(body.endDate),
    people: toNumber(body.people, NaN),
    travelType: normalizedTravelType,
    transport: normalizedTransport,
    budget: toNumber(body.budget, NaN),
    notes: cleanText(body.notes || body.preferenceNotes),
    preferences: normalizeObject(body.preferences),
    plan: normalizeObject(body.plan),
  };

  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = normalized[field];
    if (field === "people" || field === "budget") {
      return !Number.isFinite(value);
    }
    return cleanText(value) === "";
  });

  if (missingFields.length) {
    const error = new Error(`Missing required field(s): ${missingFields.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(normalized.people) || normalized.people <= 0) {
    const error = new Error("Invalid field: people must be a positive number.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(normalized.budget) || normalized.budget < 0) {
    const error = new Error("Invalid field: budget must be zero or greater.");
    error.statusCode = 400;
    throw error;
  }

  const startTimestamp = Date.parse(normalized.startDate || "");
  const endTimestamp = Date.parse(normalized.endDate || "");
  if (Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp) && endTimestamp < startTimestamp) {
    const error = new Error("Invalid date range: endDate must be on or after startDate.");
    error.statusCode = 400;
    throw error;
  }

  return {
    from: normalized.from,
    to: normalized.to,
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    people: Math.max(1, Math.round(normalized.people)),
    travelType: normalized.travelType || "Solo",
    transport: normalized.transport,
    budget: Math.round(normalized.budget),
    notes: normalized.notes,
    preferences: normalized.preferences,
    plan: normalized.plan,
  };
}

function normalizeTripRecord(record) {
  if (!record || typeof record !== "object") return null;

  const tripId = cleanText(record.tripId || record.id || record._id);
  if (!tripId) return null;

  const normalized = {
    tripId,
    id: tripId,
    from: cleanText(record.from),
    to: cleanText(record.to),
    startDate: normalizeDateInput(record.startDate),
    endDate: normalizeDateInput(record.endDate),
    people: Math.max(1, Math.round(toNumber(record.people, 1))),
    travelType: cleanText(record.travelType || record.travelGroup) || "Solo",
    transport: cleanText(record.transport || record.transportMode),
    budget: Math.max(0, Math.round(toNumber(record.budget, 0))),
    createdAt: cleanText(record.createdAt),
    updatedAt: cleanText(record.updatedAt),
  };

  const notes = cleanText(record.notes || record.preferenceNotes);
  const preferences = normalizeObject(record.preferences);
  const plan = normalizeObject(record.plan);

  if (notes) normalized.notes = notes;
  if (preferences) normalized.preferences = preferences;
  if (plan) normalized.plan = plan;

  return normalized;
}

async function listTrips() {
  const trips = await readTrips();
  return sortByLatest(trips.map(normalizeTripRecord).filter(Boolean));
}

async function getTripById(tripId) {
  const normalizedTripId = cleanText(tripId);
  if (!normalizedTripId) return null;

  const trips = await readTrips();
  const foundTrip = trips.find((entry) => {
    const entryId = cleanText(entry && (entry.tripId || entry.id || entry._id));
    return entryId === normalizedTripId;
  });

  return foundTrip ? normalizeTripRecord(foundTrip) : null;
}

async function createTrip(payload) {
  const normalized = validateTripPayload(payload);
  const now = new Date().toISOString();
  const tripId = normalizeTripId();

  const trip = {
    tripId,
    id: tripId,
    from: normalized.from,
    to: normalized.to,
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    people: normalized.people,
    travelType: normalized.travelType,
    transport: normalized.transport,
    budget: normalized.budget,
    createdAt: now,
    updatedAt: now,
  };

  if (normalized.notes) trip.notes = normalized.notes;
  if (normalized.preferences) trip.preferences = normalized.preferences;
  if (normalized.plan) trip.plan = normalized.plan;

  const trips = await readTrips();
  trips.unshift(trip);
  await writeTrips(trips);

  return normalizeTripRecord(trip);
}

async function deleteTripById(tripId) {
  const normalizedTripId = cleanText(tripId);
  if (!normalizedTripId) return false;

  const trips = await readTrips();
  const remainingTrips = trips.filter((entry) => {
    const entryId = cleanText(entry && (entry.tripId || entry.id || entry._id));
    return entryId !== normalizedTripId;
  });

  if (remainingTrips.length === trips.length) {
    return false;
  }

  await writeTrips(remainingTrips);
  return true;
}

module.exports = {
  listTrips,
  getTripById,
  createTrip,
  deleteTripById,
};
