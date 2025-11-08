const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;
// Use mock auth by default if API_BASE_URL is not set or explicitly enabled
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true" || !import.meta.env.VITE_API_BASE_URL;

// Mock credentials for development (remove in production)
const MOCK_CREDENTIALS: Record<string, string> = {
  // Add mock users here for development
  // Example: "user@espandarco.com": "password",
};

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    username: string;
    displayName?: string;
    email?: string;
    groups?: string[];
  };
  powerBiToken?: string;
  error?: string;
  captchaRequired?: boolean;
}

export const authService = {
  /**
   * Authenticate user against Active Directory
   * This should call your backend API that validates against AD
   */
  async login(username: string, password: string, captchaToken: string | null): Promise<LoginResponse> {
    // Development mode: Mock authentication
    console.log("Auth Service Debug:", {
      USE_MOCK_AUTH,
      API_BASE_URL,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_USE_MOCK_AUTH: import.meta.env.VITE_USE_MOCK_AUTH,
    });
    
    if (USE_MOCK_AUTH) {
      console.log("⚠️ Using mock authentication (development mode)");
      console.log("💡 To use real AD authentication, create .env file with:");
      console.log("   VITE_API_BASE_URL=http://localhost:3000/api");
      console.log("   VITE_USE_MOCK_AUTH=false");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Normalize username (case-insensitive)
      const normalizedUsername = username.trim().toLowerCase();
      
      // Check mock credentials
      const correctPassword = MOCK_CREDENTIALS[normalizedUsername];
      if (correctPassword && correctPassword === password) {
        // Extract display name from email
        const emailPart = username.split("@")[0];
        const nameParts = emailPart.split(".");
        const displayName = nameParts
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
        
        return {
          success: true,
          token: `mock-jwt-token-${Date.now()}`,
          user: {
            username: username,
            displayName: displayName,
            email: username,
            groups: ["Users"],
          },
          powerBiToken: `mock-powerbi-token-${Date.now()}`,
        };
      }
      
      return {
        success: false,
        error: "Invalid username or password",
      };
    }

    // Production mode: Call actual backend API
    try {
      console.log(`Making request to: ${API_BASE_URL}/auth/login`);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          captchaToken,
        }),
      });
      
      console.log(`Response status: ${response.status}`);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Authentication failed (${response.status})`,
          captchaRequired: data.captchaRequired || false,
        };
      }
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        powerBiToken: data.powerBiToken, // Power BI SSO token
      };
    } catch (error: any) {
      console.error("Auth service error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // If it's a network error (backend not running), suggest mock mode
      if (error.message?.includes("Failed to fetch") || 
          error.message?.includes("NetworkError") || 
          error.message?.includes("Network request failed") ||
          error.name === "TypeError") {
        return {
          success: false,
          error: `Cannot connect to authentication server at ${API_BASE_URL}/auth/login. Make sure the backend is running on port 3000.`,
        };
      }
      
      return {
        success: false,
        error: `Network error: ${error.message || "Unknown error"}. Please try again.`,
      };
    }
  },

  /**
   * Authenticate user with NTLM/Active Directory credentials
   * This validates credentials through the same LDAP backend but uses the NTLM endpoint
   */
  async loginNtlm(username: string, password: string, captchaToken: string | null): Promise<LoginResponse> {
    console.log("NTLM Auth Service: Attempting NTLM authentication");
    
    if (USE_MOCK_AUTH) {
      console.log("⚠️ Using mock NTLM authentication (development mode)");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Normalize username (case-insensitive)
      const normalizedUsername = username.trim().toLowerCase();
      
      // Check mock credentials
      const correctPassword = MOCK_CREDENTIALS[normalizedUsername];
      if (correctPassword && correctPassword === password) {
        // Extract display name from email
        const emailPart = username.split("@")[0];
        const nameParts = emailPart.split(".");
        const displayName = nameParts
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
        
        return {
          success: true,
          token: `mock-ntlm-jwt-token-${Date.now()}`,
          user: {
            username: username,
            displayName: displayName,
            email: username,
            groups: ["Users"],
          },
          powerBiToken: `mock-powerbi-token-${Date.now()}`,
        };
      }
      
      return {
        success: false,
        error: "Invalid NTLM credentials",
      };
    }

    // Production mode: Call NTLM authentication endpoint
    try {
      console.log(`Making NTLM request to: ${API_BASE_URL}/auth/login/ntlm`);
      const response = await fetch(`${API_BASE_URL}/auth/login/ntlm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials for NTLM
        body: JSON.stringify({
          username,
          password,
          captchaToken,
        }),
      });
      
      console.log(`NTLM Response status: ${response.status}`);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `NTLM authentication failed (${response.status})`,
          captchaRequired: data.captchaRequired || false,
        };
      }
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        powerBiToken: data.powerBiToken,
      };
    } catch (error: any) {
      console.error("NTLM Auth service error:", error);
      
      // If it's a network error (backend not running), suggest mock mode
      if (error.message?.includes("Failed to fetch") || 
          error.message?.includes("NetworkError") || 
          error.message?.includes("Network request failed") ||
          error.name === "TypeError") {
        return {
          success: false,
          error: `Cannot connect to authentication server at ${API_BASE_URL}/auth/login/ntlm. Make sure the backend is running on port 3000.`,
        };
      }
      
      return {
        success: false,
        error: `Network error: ${error.message || "Unknown error"}. Please try again.`,
      };
    }
  },

  /**
   * Automatic NTLM SSO - uses Windows logged-in user credentials
   * No username/password required - browser handles authentication automatically
   * This only works on Windows domain networks
   */
  async loginNtlmSso(): Promise<LoginResponse> {
    console.log("NTLM SSO Auth Service: Attempting automatic NTLM SSO");
    
    if (USE_MOCK_AUTH) {
      console.log("⚠️ Using mock NTLM SSO authentication (development mode)");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For mock, return a default user
      return {
        success: true,
        token: `mock-ntlm-sso-jwt-token-${Date.now()}`,
        user: {
          username: "windows.user@espandarco.com",
          displayName: "Windows User",
          email: "windows.user@espandarco.com",
          groups: ["Users"],
        },
        powerBiToken: `mock-powerbi-token-${Date.now()}`,
      };
    }

    // Production mode: Call NTLM SSO endpoint
    // The browser will automatically send NTLM credentials
    try {
      console.log(`Making NTLM SSO request to: ${API_BASE_URL}/auth/login/ntlm/sso`);
      const response = await fetch(`${API_BASE_URL}/auth/login/ntlm/sso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Critical: Include credentials for NTLM negotiation
      });
      
      console.log(`NTLM SSO Response status: ${response.status}`);

      // Handle NTLM negotiation - browser may require multiple requests
      if (response.status === 401) {
        // First request - NTLM negotiation initiated
        // Browser should automatically retry with NTLM credentials
        console.log("NTLM SSO: Negotiation initiated, browser should retry with credentials");
        return {
          success: false,
          error: "NTLM negotiation in progress. Please ensure you are on a Windows domain network.",
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `NTLM SSO authentication failed (${response.status})`,
        };
      }
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        powerBiToken: data.powerBiToken,
      };
    } catch (error: any) {
      console.error("NTLM SSO Auth service error:", error);
      
      // If it's a network error (backend not running), suggest mock mode
      if (error.message?.includes("Failed to fetch") || 
          error.message?.includes("NetworkError") || 
          error.message?.includes("Network request failed") ||
          error.name === "TypeError") {
        return {
          success: false,
          error: `Cannot connect to authentication server at ${API_BASE_URL}/auth/login/ntlm/sso. Make sure the backend is running on port 3000.`,
        };
      }
      
      return {
        success: false,
        error: `Network error: ${error.message || "Unknown error"}. Please ensure you are on a Windows domain network and try again.`,
      };
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const token = localStorage.getItem("authToken");
    
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  /**
   * Verify if current token is still valid
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  },

  /**
   * Get Power BI access token for SSO
   */
  async getPowerBiToken(): Promise<string | null> {
    const storedToken = localStorage.getItem("powerBiToken");
    if (storedToken) {
      return storedToken;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/powerbi-token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem("powerBiToken", data.token);
          return data.token;
        }
      }
    } catch (error) {
      console.error("Power BI token error:", error);
    }

    return null;
  },
};

