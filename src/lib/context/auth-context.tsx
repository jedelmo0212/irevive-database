import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase, USERS_TABLE } from '../supabase';
import { initializeDatabase } from '../initialize-db';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize database and check for stored session
    const initApp = async () => {
      try {
        // Initialize database with tables and default data
        await initializeDatabase();
        
        // Check for existing session on component mount
        const storedUser = localStorage.getItem('irevive_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        toast.error("Failed to initialize application. Please refresh the page.");
        
        // Fall back to local storage for user session
        const storedUser = localStorage.getItem('irevive_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
        
        setIsInitialized(true);
      }
    };
    
    initApp();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Query Supabase for the user
      const { data, error } = await supabase
        .from(USERS_TABLE)
        .select('id, name, role, password')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('Error during login:', error);
        
        // Fall back to local authentication if Supabase fails
        return fallbackLogin(username, password);
      }
      
      if (data && data.password === password) {
        const loggedInUser: User = {
          id: data.id,
          username,
          name: data.name,
          role: data.role as UserRole,
        };
        
        setUser(loggedInUser);
        setIsAuthenticated(true);
        localStorage.setItem('irevive_user', JSON.stringify(loggedInUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Fall back to local authentication if Supabase fails
      return fallbackLogin(username, password);
    }
  };
  
  // Fallback to local storage if Supabase is unavailable
  const fallbackLogin = (username: string, password: string): boolean => {
    // For demo, we have hardcoded the admin credentials
    const adminCredentials = {
      username: 'admin',
      password: 'admin121890',
    };
    
    // Check admin credentials first
    if (username === adminCredentials.username && password === adminCredentials.password) {
      const adminUser: User = {
        id: 'admin',
        username: 'admin',
        role: 'admin' as UserRole,
        name: 'Administrator'
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('irevive_user', JSON.stringify(adminUser));
      return true;
    }
    
    // Check other users from localStorage
    const storedUsers = localStorage.getItem('irevive_users');
    const additionalUsers = storedUsers ? JSON.parse(storedUsers) : {};
    
    if (additionalUsers[username] && additionalUsers[username].password === password) {
      const currentUser = {
        id: additionalUsers[username].id,
        username,
        role: additionalUsers[username].role as UserRole,
        name: additionalUsers[username].name
      };
      
      setUser(currentUser);
      setIsAuthenticated(true);
      localStorage.setItem('irevive_user', JSON.stringify(currentUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('irevive_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};