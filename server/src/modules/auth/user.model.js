import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "../../common/config/envConfig.js";
import {
  USER_ROLES,
  USER_ROLE_VALUES,
} from "../../common/utils/constand/user.js";
import { hashToken } from "../../common/utils/crypto.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLE_VALUES,
        message: "{VALUE} is not a valid role",
      },
      default: USER_ROLES.USER,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      dailyTaskGoal: {
        type: Number,
        default: 5,
        min: 1,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Hash token helper attached to schema
userSchema.statics.hashToken = hashToken;
userSchema.methods.hashToken = hashToken;

// Hash password before saving if modified & increment tokenVersion on password update
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && !this.isNew) {
    this.tokenVersion = (this.tokenVersion || 0) + 1;
  }

  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
      tokenVersion: this.tokenVersion,
      jti: randomUUID(),
    },

    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
};

// Instance method to generate JWT refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id, jti: randomUUID() },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
};


// Sanitize user object when returned to client
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
