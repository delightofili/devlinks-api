export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
// fn = your async route handler function
// returns a new function that wraps fn
// if fn throws or rejects — catch(next) calls next(error)
// which sends error to global error handler
// without this — async errors crash silently in Express
