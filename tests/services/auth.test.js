import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/userRepository.js", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  findUserById: vi.fn()
}));
vi.mock("../../src/repositories/tokenRepository.js", () => ({
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn()
}));
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn()
  }
}));

import * as userRepo from "../../src/repositories/userRepository.js";
import * as tokenRepo from "../../src/repositories/tokenRepository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as authService from "../../src/services/authService.js";

const mockUser = { id: 1, email: "test@plantvia.app", nickname: "Tester", plan: "free", passwordHash: "hashed" };
const mockSession = { accessToken: "access-token", refreshToken: "refresh-token", user: mockUser };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-jwt-secret-32-chars-minimum-ok";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-32-chars-min";
});

describe("authService.register", () => {
  it("creates user and returns session", async () => {
    userRepo.findUserByEmail.mockResolvedValue(null);
    userRepo.createUser.mockResolvedValue(mockUser);
    bcrypt.hash.mockResolvedValue("hashed");
    jwt.sign.mockReturnValue("signed-token");
    tokenRepo.createRefreshToken.mockResolvedValue();

    const result = await authService.register({ nickname: "Tester", email: "test@plantvia.app", password: "pass123" });

    expect(userRepo.findUserByEmail).toHaveBeenCalledWith("test@plantvia.app");
    expect(bcrypt.hash).toHaveBeenCalledWith("pass123", 12);
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.email).toBe("test@plantvia.app");
  });

  it("throws 409 if email already exists", async () => {
    userRepo.findUserByEmail.mockResolvedValue(mockUser);

    await expect(
      authService.register({ nickname: "Tester", email: "test@plantvia.app", password: "pass123" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("authService.login", () => {
  it("returns session on valid credentials", async () => {
    userRepo.findUserByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("signed-token");
    tokenRepo.createRefreshToken.mockResolvedValue();

    const result = await authService.login({ email: "test@plantvia.app", password: "pass123" });

    expect(result).toHaveProperty("accessToken");
    expect(result.user.id).toBe(1);
  });

  it("throws 401 when user not found", async () => {
    userRepo.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "notfound@plantvia.app", password: "pass123" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 on wrong password", async () => {
    userRepo.findUserByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: "test@plantvia.app", password: "wrong" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("authService.refresh", () => {
  it("revokes old token and returns new session", async () => {
    const tokenRecord = { userId: 1, tokenHash: "old-hash" };
    tokenRepo.findRefreshToken.mockResolvedValue(tokenRecord);
    tokenRepo.revokeRefreshToken.mockResolvedValue();
    userRepo.findUserById.mockResolvedValue(mockUser);
    jwt.sign.mockReturnValue("new-token");
    tokenRepo.createRefreshToken.mockResolvedValue();

    const result = await authService.refresh("old-refresh-token");

    expect(tokenRepo.revokeRefreshToken).toHaveBeenCalled();
    expect(result).toHaveProperty("accessToken");
  });

  it("throws 401 when refresh token not found", async () => {
    tokenRepo.findRefreshToken.mockResolvedValue(null);

    await expect(authService.refresh("invalid-token")).rejects.toMatchObject({ statusCode: 401 });
  });
});
