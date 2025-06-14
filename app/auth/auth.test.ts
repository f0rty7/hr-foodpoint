import { describe, expect, test, beforeAll, vi } from "vitest";
import { login, register, me, logout } from "./auth";
import { users } from "~encore/clients";

// Mock the users service
vi.mock("~encore/clients", () => ({
  users: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Mock the auth module
vi.mock("~encore/auth", () => ({
  getAuthData: vi.fn(),
}));

describe("Auth service", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "1234567890",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("should register a new user successfully", async () => {
    // Mock users.createUser to return a user ID
    (users.createUser as any).mockResolvedValue({ id: mockUser._id, message: "User created successfully" });

    const result = await register({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
    });

    expect(result.message).toBe("Registration successful");
    expect(result.token).toBeDefined();
    expect(result.user.name).toBe("John Doe");
    expect(result.user.email).toBe("john.doe@example.com");
  });

  test("should login existing user successfully", async () => {
    // Mock users.getUserByEmail to return a user
    (users.getUserByEmail as any).mockResolvedValue({ user: mockUser });

    const result = await login({
      email: "john.doe@example.com",
    });

    expect(result.message).toBe("Login successful");
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("john.doe@example.com");
  });

  test("should fail login for non-existent user", async () => {
    // Mock users.getUserByEmail to throw an error
    (users.getUserByEmail as any).mockRejectedValue(new Error("User not found"));

    await expect(login({ email: "nonexistent@example.com" })).rejects.toThrow();
  });

  test("should get current user info when authenticated", async () => {
    // Mock getAuthData to return auth data
    const { getAuthData } = await import("~encore/auth");
    (getAuthData as any).mockReturnValue({ userID: mockUser._id, email: mockUser.email });

    // Mock users.getUser to return the user
    (users.getUser as any).mockResolvedValue({ user: mockUser });

    const result = await me();

    expect(result.user.id).toBe(mockUser._id);
    expect(result.user.email).toBe(mockUser.email);
  });

  test("should logout successfully", async () => {
    const result = await logout();

    expect(result.message).toContain("Logged out successfully");
  });
});
