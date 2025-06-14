import { api, APIError } from "encore.dev/api";
import { getMongoCollection, User, UserRole } from "../shared/mongodb";
import { ObjectId } from "mongodb";
import { secret } from "encore.dev/config";
import bcrypt from "bcrypt";
import log from "encore.dev/log";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "../shared/rateLimit";

// MongoDB connection string secret - must be defined within a service
const mongoConnectionString = secret("MongoDBConnectionString");
const mongoCollectionName = 'users';

// Security constants
const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Email validation helper function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation helper function
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
}

// Password validation helper function
function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}

interface CreateUserResponse {
  id: string;
  message: string;
}

interface GetUserResponse {
  user: Omit<User, 'passwordHash' | 'refreshTokens' | 'loginAttempts' | 'lockoutUntil'>;
}

interface ListUsersResponse {
  users: Omit<User, 'passwordHash' | 'refreshTokens' | 'loginAttempts' | 'lockoutUntil'>[];
}

interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface VerifyPasswordRequest {
  email: string;
  password: string;
}

interface VerifyPasswordResponse {
  user: Omit<User, 'passwordHash' | 'refreshTokens'>;
  isValid: boolean;
}

// Helper function to clean user data for responses
function cleanUserData(user: any): Omit<User, 'passwordHash' | 'refreshTokens' | 'loginAttempts' | 'lockoutUntil'> {
  const { passwordHash, refreshTokens, loginAttempts, lockoutUntil, ...cleanUser } = user;
  return {
    ...cleanUser,
    _id: user._id?.toString(),
  };
}

// Create a new user with password hashing
export const createUser = api.raw(
  { method: "POST", path: "/users", expose: true },
  async (req, resp) => {
    try {
      // Rate limiting
      const rateLimits = await getMongoCollection(mongoConnectionString(), 'rate_limits');
      const clientId = getClientIdentifier(req);
      await checkRateLimit(rateLimits, 'registration', 'create_user', RATE_LIMIT_CONFIGS.AUTH_REGISTER);

      // Parse request body
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const { name, email, phone, password, role }: CreateUserRequest = JSON.parse(body);

      // Validate email format
      if (!isValidEmail(email)) {
        resp.writeHead(400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "invalid_argument",
          message: "Invalid email format"
        }));
        return;
      }

      // Validate phone format
      if (!isValidPhone(phone)) {
        resp.writeHead(400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "invalid_argument",
          message: "Invalid phone format. Phone must be 10 digits."
        }));
        return;
      }

      // Validate name is not empty
      if (!name || name.trim().length === 0) {
        resp.writeHead(400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "invalid_argument",
          message: "Name cannot be empty"
        }));
        return;
      }

      // Validate password strength
      if (!isValidPassword(password)) {
        resp.writeHead(400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "invalid_argument",
          message: "Password must be at least 8 characters long and contain at least one uppercase letter, " +
                  "one lowercase letter, one number, and one special character"
        }));
        return;
      }

      const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

      // Check if user with email already exists
      const existingUser = await users.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        resp.writeHead(409, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "already_exists",
          message: "User with this email already exists"
        }));
        return;
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        passwordHash,
        refreshTokens: [],
        loginAttempts: 0,
        isActive: true,
        role: role || UserRole.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await users.insertOne(newUser);

      log.info("New user created successfully", {
        userId: result.insertedId.toString(),
        email: newUser.email
      });

      const response: CreateUserResponse = {
        id: result.insertedId.toString(),
        message: "User created successfully",
      };

      resp.writeHead(201, { 'Content-Type': 'application/json' });
      resp.end(JSON.stringify(response));

    } catch (error: any) {
      log.error(error, "Error creating user");

      if (error instanceof APIError) {
        const statusCode = error.code === "resource_exhausted" ? 429 : 400;
        resp.writeHead(statusCode, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: error.code,
          message: error.message
        }));
      } else {
        resp.writeHead(500, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "internal",
          message: "Failed to create user"
        }));
      }
    }
  }
);

// Verify user password (used by auth service)
export const verifyPassword = api(
  { method: "POST", path: "/users/verify-password", expose: false }, // Internal API
  async ({ email, password }: VerifyPasswordRequest): Promise<VerifyPasswordResponse> => {
    if (!isValidEmail(email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);
    const user = await users.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Still run bcrypt to prevent timing attacks
      await bcrypt.compare("dummy_password", "$2b$12$dummy.hash.to.prevent.timing.attacks");
      return { user: {} as any, isValid: false };
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw APIError.permissionDenied("Account is temporarily locked due to too many failed login attempts");
    }

    // Check if account is active
    if (user.isActive === false) {
      throw APIError.permissionDenied("Account is deactivated");
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');

      if (isPasswordValid) {
        // Reset login attempts on successful verification
        await users.updateOne(
          { _id: user._id },
          {
            $unset: { loginAttempts: "", lockoutUntil: "" },
            $set: { lastLoginAt: new Date(), updatedAt: new Date() }
          }
        );

        const cleanUser = cleanUserData(user);
        return { user: cleanUser, isValid: true };
      } else {
        // Increment login attempts
        const loginAttempts = (user.loginAttempts || 0) + 1;
        const updateData: any = {
          loginAttempts,
          updatedAt: new Date()
        };

        // Lock account if too many attempts
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_TIME);
          log.warn("Account locked due to too many failed login attempts", {
            email,
            loginAttempts
          });
        }

        await users.updateOne({ _id: user._id }, { $set: updateData });

        return { user: {} as any, isValid: false };
      }
    } catch (error) {
      log.error(error, "Error verifying password", { email });
      return { user: {} as any, isValid: false };
    }
  }
);

// Get a user by ID
export const getUser = api(
  { method: "GET", path: "/users/:id", expose: true },
  async ({ id }: { id: string }): Promise<GetUserResponse> => {
    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw APIError.invalidArgument("Invalid user ID format");
    }

    const user = await users.findOne({ _id: new ObjectId(id) });

    if (!user) {
      throw APIError.notFound("User not found");
    }

    return { user: cleanUserData(user) };
  }
);

// Get a user by email
export const getUserByEmail = api(
  { method: "GET", path: "/users/by-email/:email", expose: true },
  async ({ email }: { email: string }): Promise<GetUserResponse> => {
    // Validate email format
    if (!isValidEmail(email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    const user = await users.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      throw APIError.notFound("User not found");
    }

    return { user: cleanUserData(user) };
  }
);

// List all users
export const listUsers = api(
  { method: "GET", path: "/users", expose: true },
  async (): Promise<ListUsersResponse> => {
    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    const userList = await users.find({ isActive: { $ne: false } }).toArray();

    const cleanUsers = userList.map(user => cleanUserData(user));

    return { users: cleanUsers };
  }
);

// Update a user
export const updateUser = api(
  { method: "PUT", path: "/users/:id", expose: true },
  async ({ id, name, email, phone, currentPassword, newPassword, role, isActive }: UpdateUserRequest): Promise<{ message: string }> => {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw APIError.invalidArgument("Invalid user ID format");
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    // Validate phone format if provided
    if (phone && !isValidPhone(phone)) {
      throw APIError.invalidArgument("Invalid phone format. Phone must be 10 digits.");
    }

    // Validate name if provided
    if (name && name.trim().length === 0) {
      throw APIError.invalidArgument("Name cannot be empty");
    }

    // Validate new password if provided
    if (newPassword && !isValidPassword(newPassword)) {
      throw APIError.invalidArgument(
        "Password must be at least 8 characters long and contain at least one uppercase letter, " +
        "one lowercase letter, one number, and one special character"
      );
    }

    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    // Get current user
    const currentUser = await users.findOne({ _id: new ObjectId(id) });
    if (!currentUser) {
      throw APIError.notFound("User not found");
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        throw APIError.invalidArgument("Current password is required to set a new password");
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash || '');
      if (!isCurrentPasswordValid) {
        throw APIError.unauthenticated("Current password is incorrect");
      }
    }

    // If email is being updated, check if it already exists
    if (email) {
      const existingUser = await users.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: new ObjectId(id) }
      });

      if (existingUser) {
        throw APIError.alreadyExists("User with this email already exists");
      }
    }

    try {
      const updateData: any = {
        updatedAt: new Date()
      };

      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (phone) updateData.phone = phone.trim();
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      // Hash new password if provided
      if (newPassword) {
        updateData.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        // Clear all refresh tokens when password changes
        updateData.refreshTokens = [];
      }

      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw APIError.notFound("User not found");
      }

      log.info("User updated successfully", { userId: id, updatedFields: Object.keys(updateData) });

      return { message: "User updated successfully" };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      log.error(error, "Error updating user", { userId: id });
      throw APIError.internal("Failed to update user");
    }
  }
);

// Delete/deactivate a user
export const deleteUser = api(
  { method: "DELETE", path: "/users/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ message: string }> => {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw APIError.invalidArgument("Invalid user ID format");
    }

    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    // Soft delete by setting isActive to false
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: false,
          refreshTokens: [], // Clear all refresh tokens
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      throw APIError.notFound("User not found");
    }

    log.info("User deactivated successfully", { userId: id });

    return { message: "User deactivated successfully" };
  }
);

// Add refresh token to user
export const addRefreshToken = api(
  { method: "POST", path: "/users/:id/refresh-tokens", expose: false }, // Internal API
  async ({ id, token, expiresAt, deviceInfo, ipAddress }: {
    id: string;
    token: string;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
  }): Promise<{ message: string }> => {
    if (!ObjectId.isValid(id)) {
      throw APIError.invalidArgument("Invalid user ID format");
    }

    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    const refreshToken = {
      token,
      expiresAt,
      createdAt: new Date(),
      deviceInfo,
      ipAddress
    };

    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { "refreshTokens": refreshToken } as any,
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      throw APIError.notFound("User not found");
    }

    return { message: "Refresh token added successfully" };
  }
);

// Remove refresh token from user
export const removeRefreshToken = api(
  { method: "DELETE", path: "/users/:id/refresh-tokens", expose: false }, // Internal API
  async ({ id, token }: { id: string; token: string }): Promise<{ message: string }> => {
    if (!ObjectId.isValid(id)) {
      throw APIError.invalidArgument("Invalid user ID format");
    }

    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);

    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { "refreshTokens": { token } } as any,
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      throw APIError.notFound("User not found");
    }

    return { message: "Refresh token removed successfully" };
  }
);
