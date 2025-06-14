import { api, APIError, Header, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import log from "encore.dev/log";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "../shared/rateLimit";
import { getMongoCollection, User, UserRole } from "../shared/mongodb";
import bcrypt from "bcrypt";

// JWT secrets for token signing/verification
const jwtSecret = secret("JWTSecret");
const jwtRefreshSecret = secret("JWTRefreshSecret");
const mongoConnectionString = secret("MongoDBConnectionString");

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '2d'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// JWT payload interfaces
interface AccessTokenPayload {
  userId: string;
  email: string;
  role?: string;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

// Helper function to create access token
function createAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    jwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'encore-auth',
      audience: 'encore-app'
    }
  );
}

// Helper function to create refresh token
function createRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    jwtRefreshSecret(),
    {
      algorithm: 'HS256',
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'encore-auth',
      audience: 'encore-app'
    }
  );
}

// Helper function to verify access token
function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, jwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'encore-auth',
      audience: 'encore-app'
    }) as AccessTokenPayload;

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error: any) {
    throw new Error('Invalid or expired access token');
  }
}

// Helper function to verify refresh token
function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, jwtRefreshSecret(), {
      algorithms: ['HS256'],
      issuer: 'encore-auth',
      audience: 'encore-app'
    }) as RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error: any) {
    throw new Error('Invalid or expired refresh token');
  }
}

// Generate secure random token ID
function generateTokenId(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to verify user password directly
async function verifyUserPassword(email: string, password: string) {
  const users = await getMongoCollection(mongoConnectionString(), 'users');
  const user = await users.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    // Still run bcrypt to prevent timing attacks
    await bcrypt.compare("dummy_password", "$2b$12$dummy.hash.to.prevent.timing.attacks");
    return { user: null, isValid: false };
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

      return { user, isValid: true };
    } else {
      // Increment login attempts
      const loginAttempts = (user.loginAttempts || 0) + 1;
      const updateData: any = {
        loginAttempts,
        updatedAt: new Date()
      };

      // Lock account if too many attempts
      if (loginAttempts >= 5) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await users.updateOne({ _id: user._id }, { $set: updateData });

      return { user: null, isValid: false };
    }
  } catch (error) {
    log.error(error, "Error verifying password", { email });
    return { user: null, isValid: false };
  }
}

// Auth parameters - what the auth handler expects from requests
interface AuthParams {
  authorization: Header<"Authorization">;
}

// Auth data - what the auth handler provides to endpoints
interface AuthData {
  userID: string;
  email: string;
  role?: string;
}

// The enhanced authentication handler
export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const authHeader = params.authorization;

    if (!authHeader) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    // Extract Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw APIError.unauthenticated("Invalid authorization header format. Expected 'Bearer <token>'");
    }

    const token = parts[1];

    try {
      const payload = verifyAccessToken(token);

      return {
        userID: payload.userId,
        email: payload.email,
        role: payload.role
      };
    } catch (error: any) {
      log.warn("Invalid access token", { error: error.message });
      throw APIError.unauthenticated("Invalid or expired token");
    }
  }
);

// Define the API Gateway with the auth handler
export const gateway = new Gateway({
  authHandler: auth,
});

// Login endpoint with enhanced security
interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  expiresIn: string;
  message: string;
}

export const login = api.raw(
  { method: "POST", path: "/auth/login", expose: true },
  async (req, resp) => {
    try {
      // Rate limiting
      const rateLimits = await getMongoCollection(mongoConnectionString(), 'rate_limits');
      const clientId = getClientIdentifier(req);
      await checkRateLimit(rateLimits, clientId, 'auth_login', RATE_LIMIT_CONFIGS.AUTH_LOGIN);

      // Parse request body
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const { email, password, deviceInfo }: LoginRequest = JSON.parse(body);

      if (!email || !password) {
        resp.writeHead(400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "invalid_argument",
          message: "Email and password are required"
        }));
        return;
      }

      // Verify credentials
      const { user, isValid } = await verifyUserPassword(email, password);

      if (!isValid || !user) {
        resp.writeHead(401, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "unauthenticated",
          message: "Invalid credentials"
        }));
        return;
      }

      // Generate tokens
      const tokenId = generateTokenId();
      const accessToken = createAccessToken({
        userId: user._id!.toString(),
        email: user.email,
        role: user.role
      });

      const refreshToken = createRefreshToken({
        userId: user._id!.toString(),
        tokenId
      });

      // Store refresh token in user document
      const users = await getMongoCollection(mongoConnectionString(), 'users');
      const refreshTokenData = {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        deviceInfo,
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      };

      await users.updateOne(
        { _id: user._id },
        {
          $push: { "refreshTokens": refreshTokenData } as any,
          $set: { updatedAt: new Date() }
        }
      );

      const response: LoginResponse = {
        accessToken,
        refreshToken,
        user: {
          id: user._id!.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        },
        expiresIn: ACCESS_TOKEN_EXPIRY,
        message: "Login successful"
      };

      log.info("User logged in successfully", {
        userId: user._id,
        email: user.email
      });

      resp.writeHead(200, { 'Content-Type': 'application/json' });
      resp.end(JSON.stringify(response));

    } catch (error: any) {
      log.error(error, "Login error");

      if (error instanceof APIError) {
        resp.writeHead(error.code === "resource_exhausted" ? 429 : 400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: error.code,
          message: error.message
        }));
      } else {
        resp.writeHead(500, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "internal",
          message: "Internal server error"
        }));
      }
    }
  }
);

// Register endpoint with enhanced security
interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: UserRole;
  };
  expiresIn: string;
  message: string;
}

export const register = api.raw(
  { method: "POST", path: "/auth/register", expose: true },
  async (req, resp) => {
    try {
      // Rate limiting
      const rateLimits = await getMongoCollection(mongoConnectionString(), 'rate_limits');
      const clientId = getClientIdentifier(req);
      await checkRateLimit(rateLimits, clientId, 'auth_register', RATE_LIMIT_CONFIGS.AUTH_REGISTER);

      // Parse request body
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const { name, email, phone, password, role }: RegisterRequest = JSON.parse(body);

      // Use the users service to create user (this will be a direct call for now)
      const users = await getMongoCollection(mongoConnectionString(), 'users');

      // Check if user already exists
      const existingUser = await users.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        resp.writeHead(409, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "already_exists",
          message: "User with this email already exists"
        }));
        return;
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 12);
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
      const userId = result.insertedId.toString();

      // Generate tokens
      const tokenId = generateTokenId();
      const accessToken = createAccessToken({
        userId: userId,
        email: email,
        role: role
      });

      const refreshToken = createRefreshToken({
        userId: userId,
        tokenId
      });

      // Store refresh token in user document
      const refreshTokenData = {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      };

      await users.updateOne(
        { _id: result.insertedId },
        {
          $push: { "refreshTokens": refreshTokenData } as any,
          $set: { updatedAt: new Date() }
        }
      );

      const response: RegisterResponse = {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          name,
          email,
          role
        },
        expiresIn: ACCESS_TOKEN_EXPIRY,
        message: "Registration successful"
      };

      log.info("User registered successfully", { userId, email });

      resp.writeHead(201, { 'Content-Type': 'application/json' });
      resp.end(JSON.stringify(response));

    } catch (error: any) {
      log.error(error, "Registration error");

      if (error instanceof APIError) {
        const statusCode = error.code === "already_exists" ? 409 :
                          error.code === "invalid_argument" ? 400 :
                          error.code === "resource_exhausted" ? 429 : 500;

        resp.writeHead(statusCode, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: error.code,
          message: error.message
        }));
      } else {
        resp.writeHead(500, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "internal",
          message: "Internal server error"
        }));
      }
    }
  }
);

// Refresh token endpoint
interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export const refreshToken = api.raw(
  { method: "POST", path: "/auth/refresh", expose: true },
  async (req, resp) => {
    try {
      // Rate limiting
      const rateLimits = await getMongoCollection(mongoConnectionString(), 'rate_limits');
      const clientId = getClientIdentifier(req);
      await checkRateLimit(rateLimits, clientId, 'auth_refresh', RATE_LIMIT_CONFIGS.AUTH_REFRESH);

      // Parse request body
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const { refreshToken: oldRefreshToken }: RefreshTokenRequest = JSON.parse(body);

      if (!oldRefreshToken) {
        resp.writeHead(400, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "invalid_argument",
          message: "Refresh token is required"
        }));
        return;
      }

      // Verify refresh token
      const payload = verifyRefreshToken(oldRefreshToken);

      // Get user details from database
      const users = await getMongoCollection(mongoConnectionString(), 'users');
      const user = await users.findOne({ _id: payload.userId });

      if (!user) {
        resp.writeHead(401, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "unauthenticated",
          message: "User not found"
        }));
        return;
      }

      // Check if refresh token exists in user's token list
      const hasValidToken = user.refreshTokens?.some((token: any) =>
        token.token === oldRefreshToken && token.expiresAt > new Date()
      );

      if (!hasValidToken) {
        resp.writeHead(401, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "unauthenticated",
          message: "Invalid or expired refresh token"
        }));
        return;
      }

      // Generate new tokens
      const newTokenId = generateTokenId();
      const newAccessToken = createAccessToken({
        userId: user._id!.toString(),
        email: user.email,
        role: user.role
      });

      const newRefreshToken = createRefreshToken({
        userId: user._id!.toString(),
        tokenId: newTokenId
      });

      // Remove old refresh token and add new one
      await users.updateOne(
        { _id: user._id },
        {
          $pull: { "refreshTokens": { token: oldRefreshToken } } as any,
        }
      );

      const refreshTokenData = {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      };

      await users.updateOne(
        { _id: user._id },
        {
          $push: { "refreshTokens": refreshTokenData } as any,
          $set: { updatedAt: new Date() }
        }
      );

      const response: RefreshTokenResponse = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY
      };

      resp.writeHead(200, { 'Content-Type': 'application/json' });
      resp.end(JSON.stringify(response));

    } catch (error: any) {
      log.error(error, "Token refresh error");

      if (error instanceof APIError) {
        resp.writeHead(error.code === "resource_exhausted" ? 429 : 401, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: error.code,
          message: error.message
        }));
      } else {
        resp.writeHead(401, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify({
          code: "unauthenticated",
          message: "Invalid refresh token"
        }));
      }
    }
  }
);

// Get current user info (requires authentication)
interface CurrentUserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role?: string;
    lastLoginAt?: Date;
    createdAt: Date;
  };
}

export const me = api(
  { method: "GET", path: "/auth/me", expose: true, auth: true },
  async (): Promise<CurrentUserResponse> => {
    // Get auth data from the request
    const { getAuthData } = await import("~encore/auth");
    const authData = getAuthData()!;

    try {
      // Get full user details from database
      const users = await getMongoCollection(mongoConnectionString(), 'users');
      const user = await users.findOne({ _id: authData.userID });

      if (!user) {
        throw APIError.notFound("User not found");
      }

      return {
        user: {
          id: user._id!.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      throw APIError.notFound("User not found");
    }
  }
);

// Logout endpoint (revokes refresh token)
interface LogoutRequest {
  refreshToken?: string;
  allDevices?: boolean;
}

export const logout = api.raw(
  { method: "POST", path: "/auth/logout", expose: true, auth: true },
  async (req, resp) => {
    try {
      // Get auth data from the request
      const { getAuthData } = await import("~encore/auth");
      const authData = getAuthData()!;

      // Parse request body
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      let refreshTokenToRevoke: string | undefined;
      let allDevices = false;

      if (body) {
        const { refreshToken, allDevices: logoutAllDevices }: LogoutRequest = JSON.parse(body);
        refreshTokenToRevoke = refreshToken;
        allDevices = logoutAllDevices || false;
      }

      const users = await getMongoCollection(mongoConnectionString(), 'users');

      if (allDevices) {
        // Clear all refresh tokens (logout from all devices)
        await users.updateOne(
          { _id: authData.userID },
          {
            $set: { refreshTokens: [], updatedAt: new Date() }
          }
        );
      } else if (refreshTokenToRevoke) {
        // Remove specific refresh token
        await users.updateOne(
          { _id: authData.userID },
          {
            $pull: { "refreshTokens": { token: refreshTokenToRevoke } } as any,
            $set: { updatedAt: new Date() }
          }
        );
      }

      log.info("User logged out", {
        userId: authData.userID,
        allDevices
      });

      resp.writeHead(200, { 'Content-Type': 'application/json' });
      resp.end(JSON.stringify({
        message: allDevices ?
          "Logged out from all devices successfully" :
          "Logged out successfully"
      }));

    } catch (error: any) {
      log.error(error, "Logout error");
      resp.writeHead(500, { 'Content-Type': 'application/json' });
      resp.end(JSON.stringify({
        code: "internal",
        message: "Logout failed"
      }));
    }
  }
);

// Change password endpoint
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = api(
  { method: "POST", path: "/auth/change-password", expose: true, auth: true },
  async ({ currentPassword, newPassword }: ChangePasswordRequest): Promise<{ message: string }> => {
    // Get auth data from the request
    const { getAuthData } = await import("~encore/auth");
    const authData = getAuthData()!;

    try {
      const users = await getMongoCollection(mongoConnectionString(), 'users');
      const user = await users.findOne({ _id: authData.userID });

      if (!user) {
        throw APIError.notFound("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
      if (!isCurrentPasswordValid) {
        throw APIError.unauthenticated("Current password is incorrect");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password and clear all refresh tokens
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordHash: newPasswordHash,
            refreshTokens: [], // Clear all refresh tokens
            updatedAt: new Date()
          }
        }
      );

      log.info("Password changed successfully", { userId: authData.userID });

      return {
        message: "Password changed successfully. Please log in again on all devices."
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to change password");
    }
  }
);
