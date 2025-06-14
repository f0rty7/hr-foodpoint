import { MongoClient, Db, Collection } from "mongodb";
import log from "encore.dev/log";

// MongoDB client instance
let client: MongoClient | null = null;
let database: Db | null = null;

/**
 * Get MongoDB database connection
 * This function lazy-loads the connection on first use
 */
export async function getMongoDatabase(connectionString: string): Promise<Db> {
  if (!database) {
    try {
      client = new MongoClient(connectionString);
      await client.connect();
      database = client.db();
      log.info("Connected to MongoDB successfully");
    } catch (error) {
      log.error(error, "Failed to connect to MongoDB");
      throw error;
    }
  }
  return database;
}

/**
 * Get a MongoDB collection with type safety
 */
export async function getMongoCollection(connectionString: string, collectionName: string): Promise<Collection<any>> {
  const db = await getMongoDatabase(connectionString);
  return db.collection(collectionName);
}

/**
 * Close MongoDB connection
 * This should be called when the application shuts down
 */
export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
    log.info("MongoDB connection closed");
  }
}

// Example interfaces for your collections
// Using string for _id to avoid ObjectId import issues with Encore parser
export interface User {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string; // Hashed password using bcrypt
  refreshTokens?: RefreshToken[]; // Array of active refresh tokens
  lastLoginAt?: Date;
  loginAttempts?: number; // For rate limiting failed attempts
  lockoutUntil?: Date; // Account lockout timestamp
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  role?: UserRole;
  isActive?: boolean; // Account status
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  deviceInfo?: string; // Optional device/browser info
  ipAddress?: string; // Optional IP address tracking
}

export enum UserRole {
  ADMIN = "admin",
  CUSTOMER = "customer",
  HR = "hr",
  JOB_SEEKER = "job_seeker",
  JOB_POSTER = "job_poster",
}

export interface Post {
  _id?: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

// Rate limiting interface for tracking API requests
export interface RateLimitEntry {
  _id?: string;
  identifier: string; // IP address or user ID
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  lastRequest: Date;
}
