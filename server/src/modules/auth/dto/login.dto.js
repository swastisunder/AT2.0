import Joi from "joi";
import BaseDto from "../../../common/dto/baseDto.js";

class LoginDto extends BaseDto {
  static schema = Joi.object({
    email: Joi.string().trim().email().lowercase().required().messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  });
}

export default LoginDto;

