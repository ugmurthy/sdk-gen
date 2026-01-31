from typing import Optional, Dict, List, Any
import requests



class ApiClientConfig:
    """Configuration for ApiClient."""

    def __init__(
        self,
        base_url: str,
        token: Optional[str] = None,
        timeout: int = 30
    ):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout = timeout


class ApiClient:
    """Generated API client."""

    def __init__(self, config: ApiClientConfig):
        self._config = config
        self._session = requests.Session()
        self._session.headers["Content-Type"] = "application/json"
        if config.token:
            self._session.headers["Authorization"] = f"Bearer {config.token}"

    def set_token(self, token: str) -> None:
        """Update the authentication token."""
        self._config.token = token
        self._session.headers["Authorization"] = f"Bearer {token}"

    def get_api_v2_health(
        self,
    ) -> Dict[str, Any]:
        """Health check"""
        url = "/api/v2/health"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_health_ready(
        self,
    ) -> Dict[str, Any]:
        """Readiness check"""
        url = "/api/v2/health/ready"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_auth_me(
        self,
    ) -> Dict[str, Any]:
        """Get current user info"""
        url = "/api/v2/auth/me"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_auth_api_keys(
        self,
    ) -> Dict[str, Any]:
        """List API keys"""
        url = "/api/v2/auth/api-keys"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_auth_api_keys(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create API key"""
        url = "/api/v2/auth/api-keys"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def delete_api_v2_auth_api_keys_by_id(
        self,
        id: str,
    ) -> None:
        """Revoke API key"""
        url = "/api/v2/auth/api-keys/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.delete(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return None

    def get_api_v2_users(
        self,
    ) -> Dict[str, Any]:
        """List all users"""
        url = "/api/v2/users"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_users_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get user by ID"""
        url = "/api/v2/users/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def patch_api_v2_users_by_id(
        self,
        id: str,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update user role"""
        url = "/api/v2/users/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.patch(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def delete_api_v2_users_by_id(
        self,
        id: str,
    ) -> None:
        """Delete user"""
        url = "/api/v2/users/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.delete(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return None

    def post_api_v2_users_invite(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Invite new user"""
        url = "/api/v2/users/invite"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_agents(
        self,
        status: Optional[str] = None,
        name: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List agents"""
        url = "/api/v2/agents"

        params: Dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if name is not None:
            params["name"] = name
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_agents(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a new agent"""
        url = "/api/v2/agents"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_agents_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get agent by ID"""
        url = "/api/v2/agents/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def patch_api_v2_agents_by_id(
        self,
        id: str,
        body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Update agent"""
        url = "/api/v2/agents/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.patch(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def delete_api_v2_agents_by_id(
        self,
        id: str,
    ) -> None:
        """Delete agent"""
        url = "/api/v2/agents/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.delete(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return None

    def post_api_v2_agents_by_id_activate(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Activate agent"""
        url = "/api/v2/agents/{id}/activate"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.post(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_agents_resolve_by_name(
        self,
        name: str,
    ) -> Dict[str, Any]:
        """Resolve agent by name"""
        url = "/api/v2/agents/resolve/{name}"
        url = url.replace("{" + "name" + "}", str(name))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_dags(
        self,
        status: Optional[str] = None,
        created_after: Optional[str] = None,
        created_before: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List DAGs with filters"""
        url = "/api/v2/dags"

        params: Dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if created_after is not None:
            params["createdAfter"] = created_after
        if created_before is not None:
            params["createdBefore"] = created_before
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_dags(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create DAG from goal"""
        url = "/api/v2/dags"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_dags_scheduled(
        self,
    ) -> Dict[str, Any]:
        """List scheduled DAGs"""
        url = "/api/v2/dags/scheduled"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_dags_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get DAG by ID"""
        url = "/api/v2/dags/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def patch_api_v2_dags_by_id(
        self,
        id: str,
        body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Update DAG"""
        url = "/api/v2/dags/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.patch(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def delete_api_v2_dags_by_id(
        self,
        id: str,
    ) -> None:
        """Delete DAG"""
        url = "/api/v2/dags/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.delete(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return None

    def post_api_v2_dags_by_id_execute(
        self,
        id: str,
        body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute a DAG"""
        url = "/api/v2/dags/{id}/execute"
        url = url.replace("{" + "id" + "}", str(id))


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_dags_execute_definition(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute from definition"""
        url = "/api/v2/dags/execute-definition"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_dags_experiments(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Run experiments"""
        url = "/api/v2/dags/experiments"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_executions(
        self,
        status: Optional[str] = None,
        dag_id: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List executions"""
        url = "/api/v2/executions"

        params: Dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if dag_id is not None:
            params["dagId"] = dag_id
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_executions_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get execution by ID"""
        url = "/api/v2/executions/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def delete_api_v2_executions_by_id(
        self,
        id: str,
    ) -> None:
        """Delete execution"""
        url = "/api/v2/executions/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.delete(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return None

    def get_api_v2_executions_by_id_details(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get execution with sub-steps"""
        url = "/api/v2/executions/{id}/details"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_executions_by_id_sub_steps(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get execution sub-steps"""
        url = "/api/v2/executions/{id}/sub-steps"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_executions_by_id_events(
        self,
        id: str,
    ) -> str:
        """Stream execution events"""
        url = "/api/v2/executions/{id}/events"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_executions_by_id_resume(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Resume suspended execution"""
        url = "/api/v2/executions/{id}/resume"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.post(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_tools(
        self,
    ) -> Dict[str, Any]:
        """List available tools"""
        url = "/api/v2/tools"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_costs_executions_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get execution cost details"""
        url = "/api/v2/costs/executions/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_costs_dags_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get DAG cost details"""
        url = "/api/v2/costs/dags/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_costs_summary(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get overall cost summary"""
        url = "/api/v2/costs/summary"

        params: Dict[str, Any] = {}
        if start_date is not None:
            params["startDate"] = start_date
        if end_date is not None:
            params["endDate"] = end_date

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_billing_usage(
        self,
    ) -> Dict[str, Any]:
        """Get current billing period usage"""
        url = "/api/v2/billing/usage"


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_billing_usage_history(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Get usage history with pagination"""
        url = "/api/v2/billing/usage/history"

        params: Dict[str, Any] = {}
        if start_date is not None:
            params["startDate"] = start_date
        if end_date is not None:
            params["endDate"] = end_date
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_billing_invoices(
        self,
        status: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List invoices"""
        url = "/api/v2/billing/invoices"

        params: Dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_billing_invoices_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get invoice details"""
        url = "/api/v2/billing/invoices/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_admin_tenants(
        self,
        status: Optional[str] = None,
        plan: Optional[str] = None,
        limit: Optional[str] = None,
        offset: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List all tenants"""
        url = "/api/v2/admin/tenants"

        params: Dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if plan is not None:
            params["plan"] = plan
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        response = self._session.get(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def post_api_v2_admin_tenants(
        self,
        body: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create new tenant"""
        url = "/api/v2/admin/tenants"


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.post(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def get_api_v2_admin_tenants_by_id(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Get tenant by ID"""
        url = "/api/v2/admin/tenants/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        response = self._session.get(
            f"{self._config.base_url}{url}",
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def patch_api_v2_admin_tenants_by_id(
        self,
        id: str,
        body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Update tenant"""
        url = "/api/v2/admin/tenants/{id}"
        url = url.replace("{" + "id" + "}", str(id))


        json_body = body.model_dump() if hasattr(body, 'model_dump') else body
        response = self._session.patch(
            f"{self._config.base_url}{url}",
            json=json_body,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

    def delete_api_v2_admin_tenants_by_id(
        self,
        id: str,
        action: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Delete or suspend tenant"""
        url = "/api/v2/admin/tenants/{id}"
        url = url.replace("{" + "id" + "}", str(id))

        params: Dict[str, Any] = {}
        if action is not None:
            params["action"] = action

        response = self._session.delete(
            f"{self._config.base_url}{url}",
            params=params,
            timeout=self._config.timeout,
        )
        response.raise_for_status()
        return response.json()

