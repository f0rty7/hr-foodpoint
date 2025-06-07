import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { createUser, getUser, listUsers, updateUser, deleteUser } from "./users";

describe("Users service with MongoDB", () => {
  let userId: string;

  test("should create a new user", async () => {
    const result = await createUser({
      name: "John Doe",
      email: "john.doe@example.com",
    });

    expect(result.message).toBe("User created successfully");
    expect(result.id).toBeDefined();
    userId = result.id; // Store for later tests
  });

  test("should retrieve a user by ID", async () => {
    const result = await getUser({ id: userId });
    
    expect(result.user.name).toBe("John Doe");
    expect(result.user.email).toBe("john.doe@example.com");
    expect(result.user.createdAt).toBeDefined();
  });

  test("should list all users", async () => {
    const result = await listUsers();
    
    expect(result.users.length).toBeGreaterThan(0);
    expect(result.users.some(user => user.email === "john.doe@example.com")).toBe(true);
  });

  test("should update a user", async () => {
    const result = await updateUser({
      id: userId,
      name: "Jane Doe",
    });

    expect(result.message).toBe("User updated successfully");

    // Verify the update
    const updatedUser = await getUser({ id: userId });
    expect(updatedUser.user.name).toBe("Jane Doe");
    expect(updatedUser.user.email).toBe("john.doe@example.com"); // Should remain unchanged
  });

  test("should delete a user", async () => {
    const result = await deleteUser({ id: userId });
    
    expect(result.message).toBe("User deleted successfully");

    // Verify the user is deleted
    try {
      await getUser({ id: userId });
      // If we reach this line, the test should fail
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("User not found");
    }
  });

  test("should handle non-existent user", async () => {
    try {
      await getUser({ id: "507f1f77bcf86cd799439011" }); // Valid ObjectId but non-existent
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("User not found");
    }
  });

  test("should handle invalid user ID format", async () => {
    try {
      await getUser({ id: "invalid-id" });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid user ID format");
    }
  });

  test("should prevent duplicate email creation", async () => {
    // First create a user
    await createUser({
      name: "Test User",
      email: "test@duplicate.com",
    });

    // Try to create another user with the same email
    try {
      await createUser({
        name: "Another User",
        email: "test@duplicate.com",
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("User with this email already exists");
    }
  });
}); 