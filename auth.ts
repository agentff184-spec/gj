import { queryClient } from "./queryClient";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("auth_token");
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  logout(): void {
    this.removeToken();
    queryClient.clear();
    window.location.href = "/login";
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.token) return {};
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

export const authService = new AuthService();

// Helper function to get authenticated fetch headers
export function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...authService.getAuthHeaders(),
  };
}
