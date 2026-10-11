import crypto from "node:crypto";

/**
 * Generates a SHA-256 hash of a given token string.
 * Used for safely storing refresh tokens at rest.
 *
 * @param {string} token
 * @returns {string} Hex encoded hash
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export default {
  hashToken,
};

