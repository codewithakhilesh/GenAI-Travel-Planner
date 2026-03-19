const router = require("express").Router();
const { generatePlan, getPlan } = require("../controllers/plan.controller");

// POST: Generate plan for a trip
router.post("/generate/:tripId", generatePlan);

// GET: Fetch plan for a trip
router.get("/:tripId", getPlan);

module.exports = router;
