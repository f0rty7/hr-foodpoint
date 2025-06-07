# MongoDB Integration with Encore.ts

This guide explains how to integrate MongoDB with your Encore.ts application.

## Prerequisites

1. MongoDB installed and running locally (or access to a MongoDB instance)
2. Encore CLI installed
3. Node.js and npm

## Setup Instructions

### 1. Install MongoDB Driver

```bash
npm install mongodb
npm install --save-dev @types/mongodb
```

### 2. Configure MongoDB Connection

#### Local Development
Create a `.secrets.local.cue` file in your project root:

```cue
MongoDBConnectionString: "mongodb://localhost:27017/encore-starter"
```

#### Production/Cloud
Use Encore Cloud dashboard or CLI to set the secret:

```bash
encore secret set --type production MongoDBConnectionString
```

### 3. Start MongoDB

#### Using Docker (Recommended for local development)
```bash
docker run --name encore-mongo -p 27017:27017 -d mongo:latest
```

#### Or install MongoDB locally
Follow the official MongoDB installation guide for your OS.

### 4. Run Your Application

```bash
encore run
```

## Project Structure

```
app/
├── shared/
│   └── mongodb.ts          # MongoDB connection module
└── users/
    ├── encore.service.ts   # Service definition
    ├── users.ts           # API endpoints
    └── users.test.ts      # Tests
```

## Available API Endpoints

### Users Service

- `POST /users` - Create a new user
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Example Usage

### Create a User
```bash
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Get All Users
```bash
curl http://localhost:4000/users
```

### Get User by ID
```bash
curl http://localhost:4000/users/[USER_ID]
```

## Testing

Run tests with:
```bash
encore test app/users
```

## Key Features

1. **Type Safety**: Full TypeScript support with proper MongoDB types
2. **Error Handling**: Proper API errors for different scenarios
3. **Connection Management**: Lazy-loaded MongoDB connections
4. **Validation**: ObjectId validation and duplicate email prevention
5. **Testing**: Comprehensive test suite included

## MongoDB Connection Management

The connection is managed through the `shared/mongodb.ts` module:

- **Lazy Connection**: Database connection is created only when first needed
- **Singleton Pattern**: Reuses the same connection across requests
- **Error Handling**: Proper error logging and handling
- **Type Safety**: Generic collection types for type-safe operations

## Environment Configuration

### Local Development
```cue
MongoDBConnectionString: "mongodb://localhost:27017/encore-starter"
```

### Production with Authentication
```cue
MongoDBConnectionString: "mongodb://username:password@host:port/database?authSource=admin"
```

### MongoDB Atlas
```cue
MongoDBConnectionString: "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
```

## Best Practices

1. **Use Indexes**: Create indexes on frequently queried fields
2. **Connection Pooling**: MongoDB driver handles connection pooling automatically
3. **Error Handling**: Always handle MongoDB operation errors appropriately
4. **Type Safety**: Define proper interfaces for your collections
5. **Secrets Management**: Never commit connection strings to version control

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure MongoDB is running on the specified port
2. **Authentication Failed**: Check username/password in connection string
3. **Type Errors**: Ensure your interfaces extend MongoDB's Document type

### Debug Connection Issues

Add logging to your MongoDB connection:

```typescript
// In mongodb.ts
log.info("Attempting to connect to MongoDB", { connectionString: mongoConnectionString() });
```

## Performance Considerations

1. **Connection Reuse**: The module reuses connections for better performance
2. **Indexes**: Create appropriate indexes for your queries
3. **Projection**: Only fetch fields you need
4. **Pagination**: Implement pagination for large datasets

## Production Deployment

1. Set up MongoDB connection string as a secret in Encore Cloud
2. Ensure your MongoDB instance allows connections from your Encore app
3. Consider using MongoDB Atlas for managed hosting
4. Set up monitoring and logging for your MongoDB operations 