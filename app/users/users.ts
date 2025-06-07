import { api, APIError } from "encore.dev/api";
import { getMongoCollection, User } from "../shared/mongodb";
import { ObjectId } from "mongodb";
import { secret } from "encore.dev/config";

// MongoDB connection string secret - must be defined within a service
const mongoConnectionString = secret("MongoDBConnectionString");
const mongoCollectionName = 'users';

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

interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
}

interface CreateUserResponse {
  id: string;
  message: string;
}

interface GetUserResponse {
  user: User;
}

interface ListUsersResponse {
  users: User[];
}

// Create a new user
export const createUser = api(
  { method: "POST", path: "/users", expose: true },
  async ({ name, email, phone }: CreateUserRequest): Promise<CreateUserResponse> => {
    // Validate email format
    if (!isValidEmail(email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      throw APIError.invalidArgument("Invalid phone format. Phone must be 10 digits.");
    }
    
    // Validate name is not empty
    if (!name || name.trim().length === 0) {
      throw APIError.invalidArgument("Name cannot be empty");
    }
    
    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);
    
    // Check if user with email already exists
    const existingUser = await users.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw APIError.alreadyExists("User with this email already exists");
    }
    
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await users.insertOne(newUser);
    
    return {
      id: result.insertedId.toString(),
      message: "User created successfully",
    };
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
    
    // Convert MongoDB document to plain object
    const plainUser: User = {
      _id: user._id?.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return { user: plainUser };
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
    
    // Convert MongoDB document to plain object
    const plainUser: User = {
      _id: user._id?.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return { user: plainUser };
  }
);

// List all users
export const listUsers = api(
  { method: "GET", path: "/users", expose: true },
  async (): Promise<ListUsersResponse> => {
    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);
    
    const userList = await users.find({}).toArray();
    
    // Convert MongoDB documents to plain objects
    const plainUsers: User[] = userList.map(user => ({
      _id: user._id?.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    
    return { users: plainUsers };
  }
);

// Update a user
export const updateUser = api(
  { method: "PUT", path: "/users/:id", expose: true },
  async ({ id, name, email, phone }: { id: string; name?: string; email?: string; phone?: string }): Promise<{ message: string }> => {
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
    
    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);
    
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
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.trim();

    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw APIError.notFound("User not found");
    }
    
    return { message: "User updated successfully" };
  }
);

// Delete a user
export const deleteUser = api(
  { method: "DELETE", path: "/users/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ message: string }> => {
    const users = await getMongoCollection(mongoConnectionString(), mongoCollectionName);
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw APIError.invalidArgument("Invalid user ID format");
    }
    
    const result = await users.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      throw APIError.notFound("User not found");
    }
    
    return { message: "User deleted successfully" };
  }
); 