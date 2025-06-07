import { api, APIError } from "encore.dev/api";
import { getMongoCollection, User } from "../shared/mongodb";
import { ObjectId } from "mongodb";
import { secret } from "encore.dev/config";

// MongoDB connection string secret - must be defined within a service
const mongoConnectionString = secret("MongoDBConnectionString");
const mongoCollectionName = 'homepage';


