import jwt from "jsonwebtoken";
import { findUserById } from "../repositories/userRepository.js";
import { apiError } from "../utils/apiResponse.js";

export async function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(apiError("Session could not be verified.", 401));

  try {
    const tokenPayload = jwt.verify(header.replace("Bearer ", ""), process.env.JWT_ACCESS_SECRET);
    const user = await findUserById(tokenPayload.id);
    if (!user) return next(apiError("Session could not be verified.", 401));

    req.user = user;
    next();
  } catch (err) {
    next(apiError("Session has expired or is invalid.", 401));
  }
}
