const { listDestinations, getDestinationBySlug } = require("../services/destinations.service");
const { sendSuccess, sendError } = require("../utils/response");

exports.getDestinations = async (req, res) => {
  try {
    const destinations = await listDestinations({
      category: req.query.category,
      search: req.query.search,
    });

    return sendSuccess(res, destinations);
  } catch (error) {
    console.error("Error listing destinations:", error);
    return sendError(res, 500, "Failed to fetch destinations", error);
  }
};

exports.getDestinationDetails = async (req, res) => {
  try {
    const destination = await getDestinationBySlug(req.params.slug);

    if (!destination) {
      return sendError(res, 404, `Destination not found for slug: ${req.params.slug}`);
    }

    return sendSuccess(res, destination);
  } catch (error) {
    console.error("Error fetching destination:", error);
    return sendError(res, 500, "Failed to fetch destination", error);
  }
};
