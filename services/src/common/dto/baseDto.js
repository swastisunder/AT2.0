import Joi from "joi";

class BaseDto {
  static schema = Joi.object({});

  static validate(data) {
    const { error, value } = this.schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error)
      return { errors: error.details.map((err) => err.message), value: null };

    return { errors: null, value };
  }
}

export default BaseDto;

