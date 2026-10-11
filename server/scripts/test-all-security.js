import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../src/modules/auth/user.model.js";
import { MONGO_URI } from "../src/common/config/envConfig.js";

const apiUrl =
  process.env.VERIFY_API_URL ||
  `http://localhost:${process.env.PORT || 5000}/api`;

const request = async (path, { method = "GET", body, token } = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    payload = await response.json();
  }
  return { response, payload };
};

const runTests = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for direct state verification.");

  // 1. Health and Readiness Checks
  console.log("\n[Test 1] Health and readiness endpoints...");
  const healthRes = await request("/health");
  assert.equal(healthRes.response.status, 200);
  assert.equal(healthRes.payload.success, true);

  const readyRes = await request("/health/ready");
  assert.equal(readyRes.response.status, 200);
  assert.equal(readyRes.payload.status, "ready");
  assert.equal(readyRes.payload.services.mongodb, "connected");
  console.log("✔ Health and readiness endpoints working.");

  // 2. 404 Route Not Found
  console.log("\n[Test 2] 404 Route Not Found...");
  const notFoundRes = await request("/non-existent-route");
  assert.equal(notFoundRes.response.status, 404);
  assert.equal(notFoundRes.payload.success, false);
  assert.equal(notFoundRes.payload.message, "Route not found");
  console.log("✔ 404 handler returned proper JSON.");

  // 3. Security Headers
  console.log("\n[Test 3] Security headers (Helmet)...");
  assert.ok(healthRes.response.headers.get("x-content-type-options"));
  console.log("✔ Security headers present.");

  // 4. Role tampering test in registration
  console.log("\n[Test 4] Registration role tampering prevention...");
  const uniqueId = randomUUID().slice(0, 8);
  const testEmail = `user-${uniqueId}@example.com`;
  const testPassword = `Pass1234-${uniqueId}`;

  const regRes = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Role Test",
      email: testEmail,
      password: testPassword,
      role: "admin", // attempt role tampering
      preferences: {
        theme: "dark",
        dailyTaskGoal: 8,
      },
    },
  });
  assert.equal(regRes.response.status, 201);
  assert.equal(regRes.payload.data.user.role, "user");
  assert.equal(regRes.payload.data.user.preferences.theme, "dark");
  assert.equal(regRes.payload.data.user.preferences.dailyTaskGoal, 8);

  // Direct DB check
  const dbUser = await User.findOne({ email: testEmail }).select("+refreshToken");
  assert.equal(dbUser.role, "user");
  assert.notEqual(dbUser.refreshToken, regRes.payload.data.refreshToken); // refreshToken must be hashed in DB!
  console.log("✔ Role forced to 'user', preferences preserved, refresh token hashed in DB.");

  // 5. Duplicate email test (Race condition / unique constraint)
  console.log("\n[Test 5] Duplicate email registration...");
  const dupRes = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Duplicate User",
      email: testEmail,
      password: testPassword,
    },
  });
  assert.equal(dupRes.response.status, 409);
  assert.equal(dupRes.payload.message, "User with this email already exists");
  console.log("✔ Duplicate registration returned 409 Conflict.");

  // 6. Password policy validation
  console.log("\n[Test 6] Password policy validation...");
  const weakPassRes1 = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Weak Pass",
      email: `weak1-${uniqueId}@example.com`,
      password: "short1", // < 8 characters
    },
  });
  assert.equal(weakPassRes1.response.status, 400);

  const weakPassRes2 = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Weak Pass",
      email: `weak2-${uniqueId}@example.com`,
      password: "allletterslongpass", // no digit
    },
  });
  assert.equal(weakPassRes2.response.status, 400);
  console.log("✔ Weak passwords correctly rejected.");

  // 7. Refresh route validation (RefreshDto)
  console.log("\n[Test 7] Refresh route validation (RefreshDto)...");
  const emptyRefreshRes = await request("/auth/refresh", {
    method: "POST",
    body: {},
  });
  assert.equal(emptyRefreshRes.response.status, 400);
  console.log("✔ Refresh endpoint without token rejected with 400.");

  // 8. Login flow & JWT enhancements (Issuer, Audience, TokenVersion)
  console.log("\n[Test 8] Login and JWT token structure...");
  const loginRes = await request("/auth/login", {
    method: "POST",
    body: {
      email: testEmail,
      password: testPassword,
    },
  });
  assert.equal(loginRes.response.status, 200);
  const { accessToken, refreshToken } = loginRes.payload.data;
  const decoded = jwt.decode(accessToken);
  assert.equal(decoded.iss, "your-app");
  assert.equal(decoded.aud, "your-client");
  assert.equal(decoded.tokenVersion, 0);
  console.log("✔ Access token contains issuer, audience, and tokenVersion.");

  // 9. Atomic Refresh Token Rotation & Replay Protection
  console.log("\n[Test 9] Atomic refresh token rotation and replay prevention...");
  const refreshRes1 = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  assert.equal(refreshRes1.response.status, 200);
  const newRefreshToken = refreshRes1.payload.data.refreshToken;
  const newAccessToken = refreshRes1.payload.data.accessToken;

  // Replay attempt with old refresh token should fail with 401
  const replayRes = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  assert.equal(replayRes.response.status, 401);
  console.log("✔ Refresh rotation atomic: old token invalidated, replay blocked with 401.");

  // 10. Access /api/auth/me with new access token
  console.log("\n[Test 10] Access profile with rotated access token...");
  const meRes = await request("/auth/me", { token: newAccessToken });
  assert.equal(meRes.response.status, 200);
  assert.equal(meRes.payload.data.email, testEmail);
  console.log("✔ Authenticated profile access succeeded.");

  // 11. Logout and token revocation
  console.log("\n[Test 11] Logout and token revocation...");
  const logoutRes = await request("/auth/logout", {
    method: "POST",
    token: newAccessToken,
  });
  assert.equal(logoutRes.response.status, 200);

  // Blacklisted token access
  const meAfterLogout = await request("/auth/me", { token: newAccessToken });
  assert.equal(meAfterLogout.response.status, 401);

  // Refresh with token after logout
  const refreshAfterLogout = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken: newRefreshToken },
  });
  assert.equal(refreshAfterLogout.response.status, 401);
  console.log("✔ Logout revokes access token and refresh token in DB.");

  // 12. Token Versioning check (password change invalidates older access tokens)
  console.log("\n[Test 12] Token versioning check...");
  const user2Email = `tv-${uniqueId}@example.com`;
  const user2Password = `Pass1234-${uniqueId}`;
  const reg2 = await request("/auth/register", {
    method: "POST",
    body: { name: "TV User", email: user2Email, password: user2Password },
  });
  const u2AccessToken = reg2.payload.data.accessToken;
  
  // Verify token works initially
  const meU2Before = await request("/auth/me", { token: u2AccessToken });
  assert.equal(meU2Before.response.status, 200);

  // Directly increment tokenVersion in DB (as would happen on password reset)
  await User.findOneAndUpdate({ email: user2Email }, { $inc: { tokenVersion: 1 } });
  
  // Verify prior token is now rejected due to tokenVersion mismatch
  const meU2After = await request("/auth/me", { token: u2AccessToken });
  assert.equal(meU2After.response.status, 401);
  assert.equal(meU2After.payload.message, "Authentication token expired or revoked");
  console.log("✔ Token version increment immediately revokes older access tokens.");

  // 13. Rate limiting test on login (5 attempts limit)
  console.log("\n[Test 13] Rate limiting on login (5 attempts limit)...");
  const rateLimitEmail = `rl-${uniqueId}@example.com`;
  const rateLimitIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  const results = [];
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": rateLimitIp,
      },
      body: JSON.stringify({
        email: rateLimitEmail,
        password: "WrongPassword123",
      }),
    });
    results.push(res.status);
  }
  console.log("Login attempt status codes:", results);
  assert.equal(results[results.length - 1], 429, "Expected 6th attempt to be 429 Too Many Requests");
  console.log("✔ Rate limiter returned 429 on 6th login attempt.");


  console.log("\n================================================");
  console.log("ALL SECURITY VERIFICATION TESTS PASSED!");
  console.log("================================================\n");

  await mongoose.disconnect();
};

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
