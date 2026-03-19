const Trip = require("../models/Trip");
const { generateCompleteTravelPlan } = require("../services/plan.service");
const { sendSuccess, sendError } = require("../utils/response");

function toTripSummary(trip) {
  return {
    id: String(trip._id),
    from: trip.from,
    to: trip.to,
    startDate: trip.startDate,
    endDate: trip.endDate,
    people: trip.people,
    travelType: trip.travelType,
    transport: trip.transport,
    budget: trip.budget,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
}

exports.generatePlan = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return sendError(res, 404, "Trip not found");
    }

    const plan = generateCompleteTravelPlan({
      from: trip.from,
      to: trip.to,
      startDate: trip.startDate,
      endDate: trip.endDate,
      people: trip.people,
      travelType: trip.travelType,
      transport: trip.transport,
      budget: trip.budget,
    });

    trip.plan = plan;
    await trip.save();

    return sendSuccess(res, {
      tripId: String(trip._id),
      trip: toTripSummary(trip),
      plan,
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    return sendError(res, 500, "Error generating plan", error);
  }
};

exports.getPlan = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return sendError(res, 404, "Trip not found");
    }

    if (!trip.plan || Object.keys(trip.plan).length === 0) {
      return sendError(res, 404, "Plan not generated yet");
    }

    return sendSuccess(res, {
      trip: toTripSummary(trip),
      plan: trip.plan,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return sendError(res, 500, "Error fetching plan", error);
  }
};
