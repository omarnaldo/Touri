import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  phoneNumber?: string;
  role: 'traveler' | 'guide' | 'admin';
  profileImageUrl?: string;
  isVerified?: boolean;
  createdAt?: string;
  guideProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (payload: Parameters<typeof authService.signup>[0]) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // On mount, validate the existing token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
        setToken(storedToken);
      } catch {
        // Token is invalid or expired — clear it
        authService.logout();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signin = async (email: string, password: string) => {
    const data = await authService.signin(email, password);
    setUser(data.user);
    setToken(data.token);
  };

  const signup = async (payload: Parameters<typeof authService.signup>[0]) => {
    const data = await authService.signup(payload);
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        signin,
        signup,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
