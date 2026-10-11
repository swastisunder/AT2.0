import Joi from "joi";
import BaseDto from "../../../common/dto/baseDto.js";

class RefreshDto extends BaseDto {
  static schema = Joi.object({
    refreshToken: Joi.string().required().max(2048).messages({
      "string.base": "Refresh token must be a string",
      "string.empty": "Refresh token is required",
      "string.max": "Refresh token cannot exceed 2048 characters",
      "any.required": "Refresh token is required",
    }),
  });
}

export default RefreshDto;

