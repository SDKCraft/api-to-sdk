This document provides comprehensive technical documentation for the Demo API, covering its purpose, available endpoints, and how to interact with them.

---

# Demo API Documentation

## 1. Overview

The Demo API is a simple RESTful interface designed to manage users and products. It provides basic functionalities such as retrieving lists of users and products, fetching a user by their ID, and creating new user records.

**API Version:** `1.0.0`

## 2. Authentication

This API does **not** currently require authentication for any of its endpoints. All resources are publicly accessible.

## 3. Endpoints

This section details all available API endpoints, including their methods, routes, parameters, request bodies (where applicable), and response structures.

---

### Get all users

`GET /users`

Retrieves a list of all users registered in the system.

#### Parameters

| Name    | In      | Type      | Required | Description                        |
| :------ | :------ | :-------- | :------- | :--------------------------------- |
| `limit` | `query` | `integer` | `false`  | The maximum number of users to return. |

#### Responses

**`200 OK` - Success**
A list of user objects.

```json
[
  {
    "id": "user1",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  {
    "id": "user2",
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  }
]
```

---

### Create a new user

`POST /users`

Creates a new user record in the system.

#### Request Body

The request body should be a JSON object containing the user's `name` and `email`.

**Content Type:** `application/json`

**Schema:**

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the user."
    },
    "email": {
      "type": "string",
      "description": "The email address of the user. Must be unique."
    }
  },
  "required": [
    "name",
    "email"
  ]
}
```

**Example Request Body:**

```json
{
  "name": "Alice Wonderland",
  "email": "alice.w@example.com"
}
```

#### Responses

**`201 Created` - User successfully created**
The newly created user object, including its assigned ID.

```json
{
  "id": "user3",
  "name": "Alice Wonderland",
  "email": "alice.w@example.com"
}
```

---

### Get user by ID

`GET /users/{id}`

Retrieves a single user by their unique identifier.

#### Parameters

| Name | In     | Type     | Required | Description                       |
| :--- | :----- | :------- | :------- | :-------------------------------- |
| `id` | `path` | `string` | `true`   | The unique ID of the user to retrieve. |

#### Responses

**`200 OK` - User found**
The user object matching the provided ID.

```json
{
  "id": "user1",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

**`404 Not Found` - User not found**
Indicates that no user with the specified `id` exists.

```json
{
  "message": "User not found"
}
```

---

### Get all products

`GET /products`

Retrieves a list of all products available in the system.

#### Responses

**`200 OK` - Success**
A list of product objects.

```json
[
  {
    "id": "prod1",
    "name": "Laptop",
    "price": 1200.00
  },
  {
    "id": "prod2",
    "name": "Mouse",
    "price": 25.00
  }
]
```

---

## 4. Quick Start (TypeScript)

This quick start guide demonstrates how to make a simple API call to the Demo API using TypeScript and the `fetch` API.

First, ensure you have a TypeScript environment set up. You can use `node-fetch` for Node.js environments or `fetch` directly in browsers.

```typescript
// Assuming a base URL for the API
const API_BASE_URL = "https://api.example.com"; // Replace with your actual API base URL

/**
 * Fetches all users from the Demo API.
 * @param limit Optional: The maximum number of users to retrieve.
 * @returns A promise that resolves to an array of user objects.
 */
async function getAllUsers(limit?: number): Promise<any[]> {
  try {
    let url = `${API_BASE_URL}/users`;
    if (limit !== undefined) {
      url += `?limit=${limit}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      // Handle HTTP errors
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const users = await response.json();
    console.log("Successfully fetched users:", users);
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error; // Re-throw to allow further error handling up the call stack
  }
}

/**
 * Creates a new user in the Demo API.
 * @param name The name of the new user.
 * @param email The email of the new user.
 * @returns A promise that resolves to the created user object.
 */
async function createNewUser(name: string, email: string): Promise<any> {
  try {
    const url = `${API_BASE_URL}/users`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const newUser = await response.json();
    console.log("Successfully created user:", newUser);
    return newUser;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
}

// --- Example Usage ---
(async () => {
  console.log("--- Fetching all users (no limit) ---");
  await getAllUsers();

  console.log("\n--- Fetching users with a limit of 1 ---");
  await getAllUsers(1);

  console.log("\n--- Creating a new user ---");
  const newUser = await createNewUser("Chaitanya Kumar", "chaitanya.k@example.com");
  console.log("New user created with ID:", newUser.id);
})();
```