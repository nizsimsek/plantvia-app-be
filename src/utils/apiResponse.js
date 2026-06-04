export function successResponse(res, data = null, message = "Request completed successfully.", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function apiError(message, status = 400, details = null) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}
