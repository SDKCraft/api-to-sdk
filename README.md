# api-to-sdk ⚡

> Generate production-ready SDKs from any OpenAPI spec in seconds.

Supports **TypeScript**, **Python**, and **Dart/Flutter** out of the box.

---

## ✨ Features

- 📄 Supports OpenAPI 3.0 (JSON & YAML)
- 🔐 Authentication: API Key & Bearer Token
- 🌍 Multi-language: TypeScript, Python, Dart/Flutter
- ⚡ Fast: Generate a full SDK in under a second
- 🛡️ Error handling built-in
- 🔧 CLI-based workflow

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
import { setApiKey, getUsers, createUser } from "./sdk";

setApiKey("your-api-key");

const users = await getUsers({ limit: 10 });
const newUser = await createUser({ name: "John", email: "john@example.com" });
```

### Python
```python
from sdk import get_users, create_user

users = get_users(params={"limit": 10})
new_user = create_user(body={"name": "John", "email": "john@example.com"})
```

### Dart/Flutter
```dart
setApiKey("your-api-key");

final users = await getUsers(params: {"limit": "10"});
final newUser = await createUser(body: {"name": "John"});
```

---

## 🏗 Project Structure

```
api-to-sdk/
├── parsers/          # OpenAPI parser (JSON & YAML)
├── generators/       # SDK generators per language
│   ├── typescript-generator.ts
│   ├── python-generator.ts
│   └── dart-generator.ts
├── examples/         # Example OpenAPI specs
├── output/           # Generated SDKs
└── cli.ts            # CLI interface
```
└── cli.ts            # CLI interface
```

---
## 🗺️ Roadmap

- [x] TypeScript SDK
- [x] Python SDK
- [x] Dart/Flutter SDK
- [x] YAML support
- [x] Authentication support
- [ ] Go SDK
- [ ] Java SDK
- [ ] Web UI (drag & drop)
- [ ] Auto-generated Tests

---

## 📄 License

MIT © Ihsan Elashhab