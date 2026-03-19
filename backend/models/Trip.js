const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema(
  {
    // Trip details from booking form
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    people: {
      type: Number,
      required: true,
    },
    travelType: {
      type: String,
      required: true,
    },
    transport: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    
    // Generated plan (saved after generatePlan call)
    plan: {
      heroImage: String,
      bestTime: String,
      budgetBreakdown: {
        transport: Number,
        stay: Number,
        food: Number,
        activities: Number,
        local: Number,
        buffer: Number,
      },
      topPlaces: [String],
      itinerary: [
        {
          title: String,
          items: [String],
        }
      ],
      famousPlaces: [
        {
          name: String,
          img: String,
          rating: String,
          review: String,
        }
      ],
      hotels: [
        {
          name: String,
          price: String,
          img: String,
        }
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", TripSchema);
