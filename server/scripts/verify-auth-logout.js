import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const apiUrl =
  process.env.VERIFY_API_URL ||
  `http://localhost:${process.env.PORT || 5000}/api`;
const email = `logout-check-${randomUUID()}@example.com`;
const password = `check-${randomUUID()}`;

const request = async (path, { method = "GET", body, token } = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  return { response, payload };
};

const run = async () => {
  const registration = await request("/auth/register", {
    method: "POST",
    body: { name: "Logout Check", email, password },
  });
  assert.equal(registration.response.status, 201);

  const login = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(login.response.status, 200);

  const { accessToken, refreshToken } = login.payload.data;
  const decoded = jwt.decode(accessToken);
  assert.ok(decoded?.jti);

  const meBeforeLogout = await request("/auth/me", { token: accessToken });
  assert.equal(meBeforeLogout.response.status, 200);

  const logout = await request("/auth/logout", {
    method: "POST",
    token: accessToken,
  });
  assert.equal(logout.response.status, 200);

  const meAfterLogout = await request("/auth/me", { token: accessToken });
  assert.equal(meAfterLogout.response.status, 401);

  const refresh = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  assert.equal(refresh.response.status, 401);

  console.log("Auth logout verification passed successfully.");
};

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
