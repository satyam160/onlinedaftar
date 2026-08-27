// Express (v4, used in this project) does NOT automatically catch errors
// thrown inside async route handlers. Without this wrapper, an error like
// a bad Razorpay API key or a database hiccup can crash the ENTIRE server
// instead of just failing that one request — exactly the "app crashed"
// problem we hit earlier.
//
// Wrap every async route handler with this, and errors get forwarded to
// Express's error handler (registered in server.js), which sends back a
// clean JSON error immediately instead of taking the whole process down.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
