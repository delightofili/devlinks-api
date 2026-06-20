import validator from "validator";

export function sanitizeInput(req, res, next) {
  if (req.body.title) {
    req.body.title = validator.escape(req.body.title);
  }
  next();
}
