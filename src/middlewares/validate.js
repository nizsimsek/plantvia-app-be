import { apiError } from "../utils/apiResponse.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(apiError("Please check the fields and try again.", 422, result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}
