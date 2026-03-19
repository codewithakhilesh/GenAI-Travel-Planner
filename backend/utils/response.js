function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

function sendError(res, statusCode, message, error) {
  const payload = {
    success: false,
    message,
  };

  if (error) {
    payload.error = typeof error === "string" ? error : error.message || "Unknown error";
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError,
};
