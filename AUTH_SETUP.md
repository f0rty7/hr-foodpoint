# Authentication Setup for Encore.ts Backend

This guide explains how to set up and use authentication in your Encore.ts backend application.

## Overview

The authentication system uses JWT (JSON Web Tokens) with a Bearer token approach. It includes:

- User registration and login
- JWT token generation and verification
- Protected endpoints that require authentication
- Auth data propagation to authenticated endpoints

## Setup

### 1. Set JWT Secret

First, set up the JWT secret for token signing:

```bash
# For local development
encore secret set --type local JWTSecret

# For production
encore secret set --type prod JWTSecret
```

When prompted, enter a secure random string (at least 32 characters).

### 2. MongoDB Connection

Make sure your MongoDB connection string is configured:

```bash
# For local development
encore secret set --type local MongoDBConnectionString

# For production  
encore secret set --type prod MongoDBConnectionString
```

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "Registration successful"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "Login successful"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Protected User Endpoints

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Update User Profile
```http
PUT /users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "9876543210"
}
```

#### Delete User (Admin operation)
```http
DELETE /users/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## How It Works

### 1. Authentication Handler

The auth handler is defined in `app/auth/auth.ts`:

```typescript
export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const authHeader = params.authorization;
    
    if (!authHeader) {
      throw APIError.unauthenticated("Missing authorization header");
    }
    
    // Extract Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw APIError.unauthenticated("Invalid authorization header format");
    }
    
    const token = parts[1];
    
    try {
      const payload = verifyJWT(token);
      
      return {
        userID: payload.userId,
        email: payload.email
      };
    } catch (error) {
      throw APIError.unauthenticated("Invalid or expired token");
    }
  }
);
```

### 2. API Gateway

The API Gateway is configured with the auth handler:

```typescript
export const gateway = new Gateway({
  authHandler: auth,
});
```

### 3. Protected Endpoints

To protect an endpoint, add `auth: true` to the API options:

```typescript
export const protectedEndpoint = api(
  { method: "GET", path: "/protected", expose: true, auth: true },
  async (): Promise<Response> => {
    // Get auth data from the request
    const { getAuthData } = await import("~encore/auth");
    const authData = getAuthData()!;
    
    // Use authData.userID and authData.email
    return { message: `Hello user ${authData.userID}` };
  }
);
```

## JWT Token Structure

The JWT tokens contain:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "iat": 1640995200,
  "exp": 1641081600
}
```

- `userId`: MongoDB ObjectId of the user
- `email`: User's email address
- `iat`: Token issued at timestamp
- `exp`: Token expiration timestamp (24 hours from issue)

## Security Considerations

⚠️ **Important**: This implementation uses a simplified JWT approach for demonstration. For production use:

1. **Use a proper JWT library** like `jsonwebtoken`
2. **Implement proper HMAC signing** instead of simple concatenation
3. **Add password hashing** with bcrypt or similar
4. **Implement token refresh mechanism**
5. **Add rate limiting** for auth endpoints
6. **Use HTTPS** in production
7. **Implement proper error handling** and logging

## Testing

Run the auth tests:

```bash
npm test app/auth/auth.test.ts
```

## Client Usage Example

### JavaScript/TypeScript Client

```typescript
class AuthClient {
  private token: string | null = null;
  private baseUrl = 'http://localhost:4000';

  async register(userData: { name: string; email: string; phone: string }) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', this.token);
    }
    return data;
  }

  async login(email: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', this.token);
    }
    return data;
  }

  async getProfile() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    return response.json();
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }
}
```

### cURL Examples

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"1234567890"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer TOKEN"

# Update profile
curl -X PUT http://localhost:4000/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith"}'
```

## Next Steps

1. **Add password support** with proper hashing
2. **Implement role-based access control (RBAC)**
3. **Add token refresh mechanism**
4. **Implement proper JWT library**
5. **Add email verification**
6. **Implement OAuth2 providers** (Google, GitHub, etc.)
7. **Add audit logging** for authentication events

## Production Deployment

Make sure to:

1. Set production secrets using `encore secret set --type prod`
2. Use environment-specific MongoDB connections
3. Enable HTTPS in production
4. Monitor authentication events
5. Set up proper logging and alerting 
