export function errorMiddleware(err, req, res, _next) {
  if (err?.code === "LIMIT_FILE_SIZE") {
    err.status = 413;
    err.message = "Image file is too large. Please upload a smaller photo.";
  }

  const status = err.status || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error("[error]", {
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
  }

  res.status(status).json({
    success: false,
    message: isServerError ? "Something went wrong. Please try again later." : err.message,
    details: isServerError ? null : err.details || null,
    requestId: req.requestId || null
  });
}
