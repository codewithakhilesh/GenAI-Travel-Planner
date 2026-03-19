const { readTrips, writeTrips, newId } = require("../services/trip.store");

function clean(value) {
  return String(value || "").trim();
}

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return number;
}

function normalizeForm(rawForm) {
  const form = rawForm && typeof rawForm === "object" ? rawForm : {};

  const bestTimeRaw = form.bestTime;
  let bestTime = "";
  if (typeof bestTimeRaw === "string") {
    bestTime = bestTimeRaw.trim();
  } else if (bestTimeRaw != null) {
    try {
      bestTime = JSON.stringify(bestTimeRaw);
    } catch (_error) {
      bestTime = String(bestTimeRaw);
    }
  }

  const normalized = {
    from: clean(form.from),
    to: clean(form.to),
    startDate: clean(form.startDate),
    endDate: clean(form.endDate),
    people: Math.max(1, Math.round(toPositiveNumber(form.people, 1))),
    travelType: clean(form.travelType),
    transport: clean(form.transport),
    budget: Math.round(toPositiveNumber(form.budget, 0))
  };

  if (bestTime) {
    normalized.bestTime = bestTime;
  }

  return normalized;
}

function ownsTrip(trip, userId) {
  if (!trip || !trip.userId) return false;
  return String(trip.userId) === String(userId);
}

function getRequestUserId(req) {
  return req && req.user && req.user.id ? String(req.user.id) : "";
}

exports.createTrip = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body || {};
    const form = normalizeForm(body.form);
    const plan = body.plan || null;

    if (!form.from || !form.to || !form.startDate || !form.endDate || !plan) {
      return res.status(400).json({ message: "form and plan are required" });
    }

    const now = new Date().toISOString();
    const trip = {
      id: newId(),
      userId,
      createdAt: now,
      updatedAt: now,
      title: `${form.from} -> ${form.to}`.trim() || "My Trip",
      form,
      plan
    };

    const trips = await readTrips();
    trips.unshift(trip);
    await writeTrips(trips);

    return res.status(201).json({ message: "Trip saved", trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getTrips = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trips = await readTrips();
    const ownedTrips = trips.filter((trip) => ownsTrip(trip, userId));
    return res.json({ trips: ownedTrips });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = String(req.params.id || "");
    const trips = await readTrips();
    const trip = trips.find((item) => String(item.id) === id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!ownsTrip(trip, userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = String(req.params.id || "");
    const trips = await readTrips();
    const index = trips.findIndex((item) => String(item.id) === id);

    if (index < 0) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const trip = trips[index];
    if (!ownsTrip(trip, userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    trips.splice(index, 1);
    await writeTrips(trips);
    return res.json({ message: "Trip deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
