import ApiError from "../utils/apiError.js";

const validate = (DtoClass) => {
  return (req, _res, next) => {
    const { errors, value } = DtoClass.validate(req.body);

    if (errors) {
      return next(new ApiError(400, errors.join(", ")));
    }

    req.body = value;
    return next();
  };
};

export default validate;
