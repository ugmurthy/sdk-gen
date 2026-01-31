# test-sdk

SDK client for desiBackend API

## Installation

```bash
npm install test-sdk
```

## Usage

```typescript
import { ApiClient } from 'test-sdk';

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  token: 'your-api-token', // Optional
});

// Example API call
const response = await client._default.getApiV2Health(/* params */);
```

## API Methods

### _default

- `_default.getApiV2Health()`
- `_default.getApiV2HealthReady()`
- `_default.getApiV2Tools()`

### auth

- `auth.me()`
- `auth.apiKeys()`
- `auth.createApiKey(body)`
- `auth.deleteApiKey(id)`

### users

- `users.list()`
- `users.get(id)`
- `users.update(id, body)`
- `users.delete(id)`
- `users.invite(body)`

### agents

- `agents.list(options?)`
- `agents.create(body)`
- `agents.get(id)`
- `agents.update(id, body)`
- `agents.delete(id)`
- `agents.activate(id)`
- `agents.resolveByName(name)`

### dags

- `dags.list(options?)`
- `dags.create(body)`
- `dags.listScheduled()`
- `dags.get(id)`
- `dags.update(id, body)`
- `dags.delete(id)`
- `dags.execute(id, body)`
- `dags.executeDefinition(body)`
- `dags.experiments(body)`

### executions

- `executions.list(options?)`
- `executions.get(id)`
- `executions.delete(id)`
- `executions.getDetails(id)`
- `executions.getSubSteps(id)`
- `executions.getEvents(id)`
- `executions.resume(id)`

### costs

- `costs.getExecution(id)`
- `costs.getDag(id)`
- `costs.getSummary(options?)`

### billing

- `billing.usage()`
- `billing.usageHistory(options?)`
- `billing.invoices(options?)`
- `billing.getInvoice(id)`

### admin

- `admin.listTenants(options?)`
- `admin.createTenant(body)`
- `admin.getTenant(id)`
- `admin.updateTenant(id, body)`
- `admin.deleteTenant(id, options?)`


## License

MIT
