import jwt from "jsonwebtoken";
import ApiError from "../../common/utils/apiError.js";
import { JWT_SECRET } from "../../common/config/envConfig.js";
import User from "./user.model.js";

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        ApiError.unauthorized("Authentication required: No token provided"),
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(ApiError.unauthorized("Authentication token expired"));
      }
      return next(ApiError.unauthorized("Invalid authentication token"));
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized("User account no longer exists"));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden("User account is deactivated"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("User is not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied: Role '${req.user.role}' is not authorized to access this resource`,
        ),
      );
    }

    next();
  };
};
