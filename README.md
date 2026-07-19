# api-to-sdk ⚡

> Generate production-ready SDKs from any OpenAPI spec in seconds.

Supports **8 languages** out of the box: **TypeScript, Python, Go, Java, C#, Kotlin, Swift, and Dart**.

---

## ✨ Features

- 📄 Supports OpenAPI 3.0 (JSON & YAML)
- 🔐 Authentication: API Key & Bearer Token
- 🌍 Multi-language: TypeScript, Python, Go, Java, C#, Kotlin, Swift, Dart
- 🧱 Typed models/structs/classes in every language (no `dynamic`, no raw `Map`)
- 🛡️ Structured errors (`SDKError`/`SDKException`) with status code and response body
- 🔁 Smart retry logic (idempotent GET requests only, on 429/5xx/network errors)
- ⏱️ Request timeouts built in
- 🎭 **MockClient** in every language — same interface as the real client, returns realistic fake data, for offline frontend development and testing without a live backend (under building)
- ⚡ Fast: generate a full SDK in under a second
- 🔧 CLI-based workflow, also available as a web app

---

## 🚀 Quick Start

### Install
```bash
npm install -g api-to-sdk
```

### Generate SDK
```bash
# TypeScript
api-to-sdk --input ./openapi.json --lang typescript --output ./sdk

# Python
api-to-sdk --input ./openapi.yaml --lang python --output ./sdk

# All languages at once
api-to-sdk --input ./openapi.json --lang all --output ./sdk
```

---

## 📦 Generated SDK Example

### TypeScript
```typescript
import { Client } from "./sdk";

const client = new Client({ apiKey: "your-api-key" });
const users = await client.getUsers({ limit: "10" });
const newUser = await client.createUser({ name: "John", email: "john@example.com" });

// Or use MockClient for offline development — same interface, no network calls:
import { MockClient } from "./sdk";
const mockClient = new MockClient();
const fakeUsers = await mockClient.getUsers();
```

### Python
```python
from sdk import Client

client = Client(api_key="your-api-key")
users = client.get_users(params={"limit": "10"})
new_user = client.create_user(body={"name": "John", "email": "john@example.com"})
```

### Go
```go
client := sdk.NewClient(sdk.ClientOptions{APIKey: "your-api-key"})
users, err := client.GetUsers(ctx, nil)
```

---

## 🏗 Project Structure

api-to-sdk/
├── parsers/                    # OpenAPI parser (JSON & YAML)
├── generators/                 # SDK generators per language
│   ├── typescript-generator.ts (+ typescript/generators/)
│   ├── python-generator.ts     (+ python/generators/)
│   ├── go-generator.ts         (+ go/generators/)
│   ├── java-generator.ts       (+ java/generators/)
│   ├── csharp-generator.ts     (+ csharp/generators/)
│   ├── kotlin-generator.ts     (+ kotlin/generators/)
│   ├── swift-generator.ts      (+ swift/generators/)
│   └── dart-generator.ts       (+ dart/generators/)
├── examples/                   # Example OpenAPI specs
├── output/                     # Generated SDKs
└── cli.ts                      # CLI interface
---

## 🗺️ Roadmap

- [x] TypeScript SDK (Client class, typed models, MockClient)
- [x] Python SDK (Client class, Pydantic models, MockClient)
- [x] Go SDK (typed structs, context.Context, MockClient)
- [x] Java SDK (Jackson POJOs, MockClient)
- [x] C# SDK (async/await, typed classes, MockClient)
- [x] Kotlin SDK (kotlinx.serialization, coroutines, MockClient)
- [x] Swift SDK (async/await, Codable, MockClient)
- [x] Dart SDK (typed classes, MockClient)
- [x] YAML support
- [x] Authentication support
- [x] Web UI (SDKCraft Web)
- [ ] Auto-generated tests

---

## 📄 License

MIT © SDKCraft