import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";

const AuthContext = createContext(null);

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://safeops-backend.onrender.com/api"
).replace(/\/+$/, "");

console.log("SafeOps API base URL:", API_URL);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // Restore login after page refresh
  useEffect(() => {
    const token = localStorage.getItem("safeops_token");
    const storedUser = localStorage.getItem("safeops_user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid stored user:", error);

        localStorage.removeItem("safeops_token");
        localStorage.removeItem("safeops_user");
      }
    }

    setLoading(false);
  }, []);

  // LOGIN
  const login = async (email, password) => {
    const url = `${API_URL}/auth/login`;

    console.log("SafeOps login request:", url);

    const response = await axios.post(
      url,
      { email, password },
      { withCredentials: true }
    );

    const data = response.data;

    if (!data.success || !data.token) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("safeops_token", data.token);
    localStorage.setItem(
      "safeops_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data;
  };

  // REGISTER
  const register = async ({ name, email, phone, password }) => {
    const url = `${API_URL}/auth/register`;

    console.log("SafeOps registration request:", url);

    const response = await axios.post(
      url,
      { name, email, phone, password },
      { withCredentials: true }
    );

    const data = response.data;

    if (!data.success || !data.token) {
      throw new Error(
        data.message || "Registration failed"
      );
    }

    localStorage.setItem("safeops_token", data.token);
    localStorage.setItem(
      "safeops_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("safeops_token");
    localStorage.removeItem("safeops_user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}