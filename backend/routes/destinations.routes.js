const router = require("express").Router();
const {
  getDestinations,
  getDestinationDetails,
} = require("../controllers/destinations.controller");

router.get("/", getDestinations);
router.get("/:slug", getDestinationDetails);

module.exports = router;
