import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services/authService";

interface User {
  username: string;
  displayName?: string;
  email?: string;
  groups?: string[];
}

interface LoginResult {
  success: boolean;
  error?: string;
  captchaRequired?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, captchaToken: string | null) => Promise<LoginResult>;
  loginNtlm: (username: string, password: string, captchaToken: string | null) => Promise<LoginResult>;
  loginNtlmSso: () => Promise<LoginResult>;
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (from localStorage)
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, captchaToken: string | null): Promise<LoginResult> => {
    try {
      const response = await authService.login(username, password, captchaToken);
      
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        
        // Store in localStorage
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Store Power BI authentication token if provided
        if (response.powerBiToken) {
          localStorage.setItem("powerBiToken", response.powerBiToken);
        }
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error, 
        captchaRequired: response.captchaRequired 
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "An unknown error occurred." };
    }
  };

  const loginNtlm = async (username: string, password: string, captchaToken: string | null): Promise<LoginResult> => {
    try {
      const response = await authService.loginNtlm(username, password, captchaToken);
      
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        
        // Store in localStorage
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Store Power BI authentication token if provided
        if (response.powerBiToken) {
          localStorage.setItem("powerBiToken", response.powerBiToken);
        }
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error, 
        captchaRequired: response.captchaRequired 
      };
    } catch (error: any) {
      console.error("NTLM Login error:", error);
      return { success: false, error: error.message || "An unknown error occurred." };
    }
  };

  const loginNtlmSso = async (): Promise<LoginResult> => {
    try {
      const response = await authService.loginNtlmSso();
      
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        
        // Store in localStorage
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Store Power BI authentication token if provided
        if (response.powerBiToken) {
          localStorage.setItem("powerBiToken", response.powerBiToken);
        }
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error
      };
    } catch (error: any) {
      console.error("NTLM SSO Login error:", error);
      return { success: false, error: error.message || "An unknown error occurred." };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("powerBiToken");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginNtlm,
        loginNtlmSso,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

