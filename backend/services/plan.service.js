function calculateDays(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function budgetSplit(total) {
  const transport = Math.round(total * 0.25);
  const stay = Math.round(total * 0.35);
  const food = Math.round(total * 0.18);
  const activities = Math.round(total * 0.12);
  const local = Math.round(total * 0.05);
  const buffer = Math.max(0, total - (transport + stay + food + activities + local));
  return { transport, stay, food, activities, local, buffer };
}

function getHeroImage(to) {
  const key = (to || "").toLowerCase();
  if (key.includes("goa")) return "assets/images/goa1.jpg";
  if (key.includes("manali")) return "assets/images/manali.jpg";
  if (key.includes("kerala")) return "assets/images/kerla.jpg";
  if (key.includes("rajasthan")) return "assets/images/rajsthan.jpg";
  if (key.includes("kashmir")) return "assets/images/kashmir.jpg";
  if (key.includes("leh")) return "assets/images/leh.jpg";
  if (key.includes("jaipur")) return "assets/images/jaipur.jpg";
  return "assets/images/goa1.jpg"; // fallback
}

function bestTimeText(to) {
  const key = (to || "").toLowerCase();
  if (key.includes("goa")) return "November to February (pleasant weather, beaches & nightlife best).";
  if (key.includes("manali")) return "October to February (snow) or March to June (pleasant).";
  if (key.includes("kerala")) return "September to March (best for backwaters & sightseeing).";
  if (key.includes("rajasthan")) return "October to March (best for forts & desert).";
  if (key.includes("kashmir")) return "April to October (best for trekking & scenic beauty).";
  if (key.includes("leh")) return "June to September (good weather for travel).";
  if (key.includes("jaipur")) return "October to March (best for exploring forts & palaces).";
  return "Best time depends on weather; generally avoid heavy monsoon months.";
}

function topPlacesList(to) {
  const key = (to || "").toLowerCase();
  if (key.includes("goa")) return ["Baga Beach", "Calangute Beach", "Fort Aguada", "Anjuna Market", "Dudhsagar Falls"];
  if (key.includes("manali")) return ["Solang Valley", "Hadimba Temple", "Old Manali", "Atal Tunnel", "Mall Road"];
  if (key.includes("kerala")) return ["Munnar Tea Gardens", "Alleppey Backwaters", "Kovalam Beach", "Wayanad", "Fort Kochi"];
  if (key.includes("rajasthan")) return ["Amer Fort", "Hawa Mahal", "Jaisalmer Fort", "Mehrangarh Fort", "Desert Safari"];
  return [`${to} Main Spot`, `${to} View Point`, `${to} Market`, `${to} Temple`, `${to} Lake`];
}

function famousPlacesCards(to) {
  const key = (to || "").toLowerCase();

  if (key.includes("goa")) {
    return [
      { name: "Baga Beach", img: "assets/images/goa1.jpg", rating: "4.6", review: "Lively beach & nightlife." },
      { name: "Calangute Beach", img: "assets/images/goa2.jpg", rating: "4.5", review: "Crowd favorite beach." },
      { name: "Fort Aguada", img: "assets/images/goa3.jpg", rating: "4.7", review: "Best sunset views." },
      { name: "Anjuna Market", img: "assets/images/goa4.jpg", rating: "4.4", review: "Shopping + vibes." },
    ];
  }

  return [
    { name: `${to} Main Spot`, img: "assets/images/goa1.jpg", rating: "4.5", review: "Must visit place." },
    { name: `${to} View Point`, img: "assets/images/goa2.jpg", rating: "4.4", review: "Great photos." },
    { name: `${to} Market`, img: "assets/images/goa3.jpg", rating: "4.3", review: "Local shopping." },
  ];
}

function hotelsByBudget(to, budget) {
  if (budget <= 20000) {
    return [
      { name: `Budget Lodge - ${to}`, price: "₹900–₹1,800 / night", img: "assets/images/goa1.jpg" },
      { name: `Homestay - ${to}`, price: "₹1,200–₹2,000 / night", img: "assets/images/goa2.jpg" },
      { name: `Hostel/Dorm - ${to}`, price: "₹600–₹1,200 / night", img: "assets/images/goa3.jpg" },
    ];
  } else if (budget <= 40000) {
    return [
      { name: `Mid-range Hotel - ${to}`, price: "₹2,500–₹4,500 / night", img: "assets/images/goa2.jpg" },
      { name: `3-Star Stay - ${to}`, price: "₹3,000–₹5,500 / night", img: "assets/images/goa3.jpg" },
      { name: `Resort - ${to}`, price: "₹3,500–₹6,000 / night", img: "assets/images/goa4.jpg" },
    ];
  }
  return [
    { name: `Premium Resort - ${to}`, price: "₹8,000+ / night", img: "assets/images/goa3.jpg" },
    { name: `4-5 Star Hotel - ${to}`, price: "₹10,000+ / night", img: "assets/images/goa4.jpg" },
    { name: `Luxury Stay - ${to}`, price: "₹12,000+ / night", img: "assets/images/goa2.jpg" },
  ];
}

function buildItinerary(days, to, transport) {
  const out = [];
  for (let i = 1; i <= days; i++) {
    out.push({
      title: i === 1 ? `Arrival in ${to}` : i === days ? `Departure from ${to}` : `Explore ${to}`,
      items: [
        "Morning: Breakfast + local walk",
        `Afternoon: Visit top attraction in ${to}`,
        "Evening: Street food + shopping / sunset point",
        `Notes: Transport mode: ${transport}`,
      ],
    });
  }
  return out;
}

exports.generateCompleteTravelPlan = (tripData) => {
  const days = calculateDays(tripData.startDate, tripData.endDate);
  const budget = parseInt(tripData.budget || 0, 10);

  return {
    heroImage: getHeroImage(tripData.to),
    bestTime: bestTimeText(tripData.to),
    budgetBreakdown: budgetSplit(budget),
    topPlaces: topPlacesList(tripData.to),
    itinerary: buildItinerary(days, tripData.to, tripData.transport),
    famousPlaces: famousPlacesCards(tripData.to),
    hotels: hotelsByBudget(tripData.to, budget),
  };
};

// Legacy function for backward compatibility
exports.createPlan = (trip) => {
  return exports.generateCompleteTravelPlan(trip);
};

