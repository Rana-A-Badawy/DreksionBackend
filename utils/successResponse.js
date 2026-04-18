const successResponse = (message = "Success", data = null, meta = {}) => ({
  success: true,
  message,
  ...(data !== null && { data }),
  ...meta,
});

module.exports = successResponse;