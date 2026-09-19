const API_BASE_URL = "http://localhost:8000/api/v1";

class ApiClient {
  private getHeaders(isMultipart = false): HeadersInit {
    const token = localStorage.getItem("cloudoptix_token");
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(options.body instanceof FormData),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Clear token on unauthorized
        localStorage.removeItem("cloudoptix_token");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error occurred" }));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }

      // Handle 204 or empty response
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const data = await this.request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    localStorage.setItem("cloudoptix_token", data.access_token);
    return data;
  }

  async register(email: string, password: string): Promise<any> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  logout(): void {
    localStorage.removeItem("cloudoptix_token");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("cloudoptix_token");
  }

  async getMe(): Promise<any> {
    return this.request("/auth/me");
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    return this.request("/dashboard/stats");
  }

  // Resources
  async getResources(filters: {
    type?: string;
    status?: string;
    efficiency_band?: string;
    search?: string;
  } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.efficiency_band) params.append("efficiency_band", filters.efficiency_band);
    if (filters.search) params.append("search", filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/resources/${queryStr}`);
  }

  async getResourceDetails(id: string): Promise<any> {
    return this.request(`/resources/${id}`);
  }

  // Savings
  async getSavingsOverview(): Promise<any> {
    return this.request("/savings/overview");
  }

  // Recommendations
  async getRecommendations(): Promise<any[]> {
    return this.request("/recommendations/");
  }

  async approveRecommendation(id: number): Promise<any> {
    return this.request(`/recommendations/${id}/approve`, { method: "POST" });
  }

  async dismissRecommendation(id: number): Promise<any> {
    return this.request(`/recommendations/${id}/dismiss`, { method: "POST" });
  }

  // Alerts
  async getAlerts(): Promise<any[]> {
    return this.request("/alerts/");
  }

  async markAlertAsRead(id: number): Promise<any> {
    return this.request(`/alerts/${id}/read`, { method: "POST" });
  }

  async markAllAlertsAsRead(): Promise<any> {
    return this.request("/alerts/read-all", { method: "POST" });
  }

  // AI Assistant
  async chatWithAssistant(message: string): Promise<{ response: string }> {
    return this.request("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Demo management
  async resetDatabase(): Promise<any> {
    return this.request("/reset", { method: "POST" });
  }
}

export const api = new ApiClient();
