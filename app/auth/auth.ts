import { api, APIError, Header, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import { users } from "~encore/clients";

// JWT secret for token signing/verification
const jwtSecret = secret("JWTSecret");

// Simple JWT implementation (in production, use a proper JWT library like jsonwebtoken)
interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

// Helper function to create a simple JWT
function createJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours expiry
  };

  // Simple base64 encoding (in production, use proper JWT signing)
  const header64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64');
  const payload64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64');

  // Simple signature (in production, use proper HMAC signing)
  const signature = Buffer.from(`${header64}.${payload64}.${jwtSecret()}`).toString('base64');

  return `${header64}.${payload64}.${signature}`;
}

// Helper function to verify and decode JWT
function verifyJWT(token: string): JWTPayload {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [header64, payload64, signature] = parts;

    // Verify signature (in production, use proper HMAC verification)
    const expectedSignature = Buffer.from(`${header64}.${payload64}.${jwtSecret()}`).toString('base64');
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Buffer.from(payload64, 'base64').toString());

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Auth parameters - what the auth handler expects from requests
interface AuthParams {
  authorization: Header<"Authorization">;
}

// Auth data - what the auth handler provides to endpoints
// Note: Encore requires userID property specifically
interface AuthData {
  userID: string;
  email: string;
}

// The authentication handler
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
      const payload = verifyJWT(token);

      return {
        userID: payload.userId, // Note: using userID as required by Encore
        email: payload.email
      };
    } catch (error) {
      throw APIError.unauthenticated("Invalid or expired token");
    }
  }
);

// Define the API Gateway with the auth handler
export const gateway = new Gateway({
  authHandler: auth,
});

// Login endpoint
interface LoginRequest {
  email: string;
  password?: string; // Optional for now
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message: string;
}

export const login = api(
  { method: "POST", path: "/auth/login", expose: true },
  async ({ email, password }: LoginRequest): Promise<LoginResponse> => {
    try {
      // Get user by email from users service
      const { user } = await users.getUserByEmail({ email });

      // In a real app, you'd verify the password here
      // For now, we'll just check if the user exists
      if (!user) {
        throw APIError.unauthenticated("Invalid credentials");
      }

      // Create JWT token
      const token = createJWT({
        userId: user._id!,
        email: user.email
      });

      return {
        token,
        user: {
          id: user._id!,
          name: user.name,
          email: user.email
        },
        message: "Login successful"
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.unauthenticated("Invalid credentials");
    }
  }
);

// Register endpoint
interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password?: string; // Optional for now
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message: string;
}

export const register = api(
  { method: "POST", path: "/auth/register", expose: true },
  async ({ name, email, phone, password }: RegisterRequest): Promise<RegisterResponse> => {
    try {
      // Create user via users service
      const { id } = await users.createUser({ name, email, phone });

      // Create JWT token
      const token = createJWT({
        userId: id,
        email: email
      });

      return {
        token,
        user: {
          id,
          name,
          email
        },
        message: "Registration successful"
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Registration failed");
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
      // Get full user details from users service
      const { user } = await users.getUser({ id: authData.userID });

      return {
        user: {
          id: user._id!,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      throw APIError.notFound("User not found");
    }
  }
);

// Logout endpoint (mainly for documentation, JWT is stateless)
export const logout = api(
  { method: "POST", path: "/auth/logout", expose: true, auth: true },
  async (): Promise<{ message: string }> => {
    // Since JWT is stateless, we can't invalidate it server-side
    // In a real app, you might maintain a blacklist of tokens
    return {
      message: "Logged out successfully. Please discard your token on the client side."
    };
  }
);
