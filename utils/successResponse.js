const successResponse = (message = "", data = null, meta = {}) => ({
  status: "success",
  message,
  ...(data !== null && { data }),
  ...meta,
});

export const errorResponse = (message = "", data = null, meta = {}) => ({
  status: "error",
  message,
  ...(data !== null && { data }),
  ...meta,
});

export default successResponse;