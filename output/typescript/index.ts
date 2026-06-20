// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

const BASE_URL = "https://api.example.com/v1";

let _apiKey: string | null = null;
let _bearerToken: string | null = null;

export function setApiKey(key: string): void {
  _apiKey = key;
}

export function setBearerToken(token: string): void {
  _bearerToken = token;
}

// ---- Models ----

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number | null;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  inStock?: boolean;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request<T>(method: string, path: string, body?: Record<string, unknown>, params?: Record<string, string>, retries = 3): Promise<T> {
  let url = BASE_URL + path;
  if (params) {
    const query = new URLSearchParams(params).toString();
    if (query) url += "?" + query;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_apiKey) headers["X-API-Key"] = _apiKey;
  if (_bearerToken) headers["Authorization"] = "Bearer " + _bearerToken;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) { await sleep(attempt * 1000); continue; }
      }
      if (!res.ok) throw new Error(`API Error ${res.status}: ${res.statusText}`);
      return res.json() as Promise<T>;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 1000);
    }
  }
  throw new Error("Request failed after " + retries + " retries");
}

/** Fetch all pages automatically */
export async function paginate<T>(fn: (page: number) => Promise<T[]>, maxPages = 10): Promise<T[]> {
  const results: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await fn(page);
    if (!data || data.length === 0) break;
    results.push(...data);
  }
  return results;
}

/** Get all users */
export async function getUsers(params?: Record<string, string>): Promise<User[]> {
  return request<User[]>("GET", `/users`, undefined, params);
}

/** Create a new user */
export async function createUser(body?: CreateUserRequest): Promise<User> {
  return request<User>("POST", `/users`, body as unknown as Record<string, unknown>);
}

/** Get user by ID */
export async function getUserById(id: string): Promise<User> {
  return request<User>("GET", `/users/${id}`);
}

/** Get all products */
export async function getProducts(): Promise<Product[]> {
  return request<Product[]>("GET", `/products`);
}
