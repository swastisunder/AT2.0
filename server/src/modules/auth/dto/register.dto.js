import Joi from "joi";
import BaseDto from "../../../common/dto/baseDto.js";

class RegisterDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().trim().email().lowercase().required().messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(4).required().messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 4 characters",
      "any.required": "Password is required",
    }),
    preferences: Joi.object({
      theme: Joi.string().valid("light", "dark", "system").default("system"),
      dailyTaskGoal: Joi.number().integer().min(1).max(100).default(5),
      emailNotifications: Joi.boolean().default(true),
    }).default(),
  });
}

export default RegisterDto;
