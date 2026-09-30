import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../backend/src/app";
import { resetTestDatabase, closeTestDatabasePool } from "../helpers/db-test-helper";
import { insertUser, findUserByEmail, modifyUser } from "../../backend/src/repositories/user.repository";

describe("Auth HTTP API Integration Tests (Real DB)", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabasePool();
  });

  it("should register a new user successfully via HTTP POST /api/auth/register", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "newuser@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.message).toBeDefined();

    const createdInDb = await findUserByEmail("newuser@example.com");
    expect(createdInDb).not.toBeNull();
  });

  it("should fail login with wrong password via HTTP POST /api/auth/login", async () => {
    const user = await insertUser({
      email: "testuser@example.com",
      password_hash: "$2b$10$e8w.x.sXkKzV.u.1u5Q58uLz0X5502x.o.aZ",
      email_verified: true,
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "wrongpassword",
    });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.status).toBe("error");
  });

  it("should login successfully and access protected /api/profil route", async () => {
    const regRes = await request(app).post("/api/auth/register").send({
      email: "authed@example.com",
      password: "password123",
    });
    expect(regRes.status).toBe(200);

    const user = await findUserByEmail("authed@example.com");
    expect(user).not.toBeNull();
    await modifyUser(user!.id, { email_verified: true });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "authed@example.com",
      password: "password123",
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.accessToken;
    expect(token).toBeDefined();

    const profilRes = await request(app).get("/api/profil").set("Authorization", `Bearer ${token}`);

    expect(profilRes.status).toBe(200);
    expect(profilRes.body.data.email).toBe("authed@example.com");
  });
});
