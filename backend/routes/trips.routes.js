const express = require("express");
const router = express.Router();

const c = require("../controllers/trips.controller");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);
router.get("/", c.getTrips);
router.post("/", c.createTrip);
router.get("/:id", c.getTripById);
router.delete("/:id", c.deleteTrip);

module.exports = router;
