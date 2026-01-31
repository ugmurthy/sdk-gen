import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
  timeout?: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private token?: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.token = config.token;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((reqConfig) => {
      if (this.token) {
        reqConfig.headers.Authorization = `Bearer ${this.token}`;
      }
      return reqConfig;
    });
  }

  setToken(token: string): void {
    this.token = token;
  }

  /** Health check */
  async getApiV2Health(): Promise<Record<string, unknown>> {
    let url = '/api/v2/health';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Readiness check */
  async getApiV2HealthReady(): Promise<Record<string, unknown>> {
    let url = '/api/v2/health/ready';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get current user info */
  async getApiV2AuthMe(): Promise<Record<string, unknown>> {
    let url = '/api/v2/auth/me';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** List API keys */
  async getApiV2AuthApiKeys(): Promise<Record<string, unknown>> {
    let url = '/api/v2/auth/api-keys';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Create API key */
  async postApiV2AuthApiKeys(params: {
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/auth/api-keys';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Revoke API key */
  async deleteApiV2AuthApiKeysById(params: { id: string }): Promise<void> {
    let url = '/api/v2/auth/api-keys/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.delete<void>(url, config);
    return response.data;
  }

  /** List all users */
  async getApiV2Users(): Promise<Record<string, unknown>> {
    let url = '/api/v2/users';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get user by ID */
  async getApiV2UsersById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/users/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Update user role */
  async patchApiV2UsersById(params: {
    id: string;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/users/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.patch<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Delete user */
  async deleteApiV2UsersById(params: { id: string }): Promise<void> {
    let url = '/api/v2/users/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.delete<void>(url, config);
    return response.data;
  }

  /** Invite new user */
  async postApiV2UsersInvite(params: {
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/users/invite';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** List agents */
  async getApiV2Agents(params: {
    status?: 'active' | 'inactive';
    name?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/agents';

    const config: AxiosRequestConfig = {
      params: {
        status: params.status,
        name: params.name,
        limit: params.limit,
        offset: params.offset,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Create a new agent */
  async postApiV2Agents(params: {
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/agents';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Get agent by ID */
  async getApiV2AgentsById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/agents/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Update agent */
  async patchApiV2AgentsById(params: {
    id: string;
    body?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/agents/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.patch<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Delete agent */
  async deleteApiV2AgentsById(params: { id: string }): Promise<void> {
    let url = '/api/v2/agents/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.delete<void>(url, config);
    return response.data;
  }

  /** Activate agent */
  async postApiV2AgentsByIdActivate(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/agents/{id}/activate';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Resolve agent by name */
  async getApiV2AgentsResolveByName(params: { name: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/agents/resolve/{name}';
    url = url.replace('{' + 'name' + '}', encodeURIComponent(String(params.name)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** List DAGs with filters */
  async getApiV2Dags(params: {
    status?: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
    createdAfter?: string;
    createdBefore?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags';

    const config: AxiosRequestConfig = {
      params: {
        status: params.status,
        createdAfter: params.createdAfter,
        createdBefore: params.createdBefore,
        limit: params.limit,
        offset: params.offset,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Create DAG from goal */
  async postApiV2Dags(params: { body: Record<string, unknown> }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** List scheduled DAGs */
  async getApiV2DagsScheduled(): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags/scheduled';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get DAG by ID */
  async getApiV2DagsById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Update DAG */
  async patchApiV2DagsById(params: {
    id: string;
    body?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.patch<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Delete DAG */
  async deleteApiV2DagsById(params: { id: string }): Promise<void> {
    let url = '/api/v2/dags/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.delete<void>(url, config);
    return response.data;
  }

  /** Execute a DAG */
  async postApiV2DagsByIdExecute(params: {
    id: string;
    body?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags/{id}/execute';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Execute from definition */
  async postApiV2DagsExecuteDefinition(params: {
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags/execute-definition';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Run experiments */
  async postApiV2DagsExperiments(params: {
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/dags/experiments';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** List executions */
  async getApiV2Executions(params: {
    status?: 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'partial' | 'suspended';
    dagId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/executions';

    const config: AxiosRequestConfig = {
      params: {
        status: params.status,
        dagId: params.dagId,
        limit: params.limit,
        offset: params.offset,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get execution by ID */
  async getApiV2ExecutionsById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/executions/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Delete execution */
  async deleteApiV2ExecutionsById(params: { id: string }): Promise<void> {
    let url = '/api/v2/executions/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.delete<void>(url, config);
    return response.data;
  }

  /** Get execution with sub-steps */
  async getApiV2ExecutionsByIdDetails(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/executions/{id}/details';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get execution sub-steps */
  async getApiV2ExecutionsByIdSubSteps(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/executions/{id}/sub-steps';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Stream execution events */
  async getApiV2ExecutionsByIdEvents(params: { id: string }): Promise<string> {
    let url = '/api/v2/executions/{id}/events';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<string>(url, config);
    return response.data;
  }

  /** Resume suspended execution */
  async postApiV2ExecutionsByIdResume(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/executions/{id}/resume';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** List available tools */
  async getApiV2Tools(): Promise<Record<string, unknown>> {
    let url = '/api/v2/tools';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get execution cost details */
  async getApiV2CostsExecutionsById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/costs/executions/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get DAG cost details */
  async getApiV2CostsDagsById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/costs/dags/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get overall cost summary */
  async getApiV2CostsSummary(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/costs/summary';

    const config: AxiosRequestConfig = {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get current billing period usage */
  async getApiV2BillingUsage(): Promise<Record<string, unknown>> {
    let url = '/api/v2/billing/usage';

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get usage history with pagination */
  async getApiV2BillingUsageHistory(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/billing/usage/history';

    const config: AxiosRequestConfig = {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit,
        offset: params.offset,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** List invoices */
  async getApiV2BillingInvoices(params: {
    status?: 'draft' | 'pending' | 'paid' | 'cancelled';
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/billing/invoices';

    const config: AxiosRequestConfig = {
      params: {
        status: params.status,
        limit: params.limit,
        offset: params.offset,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Get invoice details */
  async getApiV2BillingInvoicesById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/billing/invoices/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** List all tenants */
  async getApiV2AdminTenants(params: {
    status?: 'active' | 'suspended' | 'pending';
    plan?: 'free' | 'pro' | 'enterprise';
    limit?: string;
    offset?: string;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/admin/tenants';

    const config: AxiosRequestConfig = {
      params: {
        status: params.status,
        plan: params.plan,
        limit: params.limit,
        offset: params.offset,
      },
    };

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Create new tenant */
  async postApiV2AdminTenants(params: {
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/admin/tenants';

    const config: AxiosRequestConfig = {};

    const response = await this.client.post<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Get tenant by ID */
  async getApiV2AdminTenantsById(params: { id: string }): Promise<Record<string, unknown>> {
    let url = '/api/v2/admin/tenants/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.get<Record<string, unknown>>(url, config);
    return response.data;
  }

  /** Update tenant */
  async patchApiV2AdminTenantsById(params: {
    id: string;
    body?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/admin/tenants/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {};

    const response = await this.client.patch<Record<string, unknown>>(url, params.body, config);
    return response.data;
  }

  /** Delete or suspend tenant */
  async deleteApiV2AdminTenantsById(params: {
    id: string;
    action?: 'suspend' | 'delete';
  }): Promise<Record<string, unknown>> {
    let url = '/api/v2/admin/tenants/{id}';
    url = url.replace('{' + 'id' + '}', encodeURIComponent(String(params.id)));

    const config: AxiosRequestConfig = {
      params: {
        action: params.action,
      },
    };

    const response = await this.client.delete<Record<string, unknown>>(url, config);
    return response.data;
  }
}
