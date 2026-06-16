import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  api,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  type LoginResponse,
  type UserProfile,
} from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  cedula: string;
  role: string;
  permisos: string[]; // permisos normalizados sin "/" ej: ["dashboard", "inventario"]
}

interface AuthContextType {
  user: User | null;
  login: (cedula: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (module: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normalizar permisos: quitar "/" inicial para comparación consistente
function normalizePermissions(permisos: string[]): string[] {
  return permisos.map((p) => p.replace(/^\//, ""));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar, verificar si hay token y restaurar sesión
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      // Restaurar sesión desde localStorage
      setUser(storedUser);

      // Validar que el token sigue siendo válido obteniendo el perfil
      api.get<UserProfile>("/auth/profile")
        .then((profile) => {
          const restoredUser: User = {
            id: profile.id_usuario,
            name: profile.nombre_completo,
            email: profile.email,
            cedula: profile.cedula,
            role: profile.rol,
            permisos: normalizePermissions(profile.permisos),
          };
          setUser(restoredUser);
          setStoredUser(restoredUser);
        })
        .catch(() => {
          // Token expirado o inválido
          removeToken();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (cedula: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        cedula,
        password,
      });

      // Guardar token y datos del usuario
      setToken(response.token);

      const loggedUser: User = {
        id: "", // se completará al obtener el perfil
        name: response.usuario.nombre,
        email: "",
        cedula: cedula,
        role: response.usuario.rol,
        permisos: normalizePermissions(response.usuario.permisos),
      };

      setUser(loggedUser);
      setStoredUser(loggedUser);

      // Obtener perfil completo para tener email e id
      api.get<UserProfile>("/auth/profile").then((profile) => {
        const fullUser: User = {
          id: profile.id_usuario,
          name: profile.nombre_completo,
          email: profile.email,
          cedula: profile.cedula,
          role: profile.rol,
          permisos: normalizePermissions(profile.permisos),
        };
        setUser(fullUser);
        setStoredUser(fullUser);
      });

      return true;
    } catch (error: any) {
      console.error("Error de login:", error.message);
      return false;
    }
  };

  const logout = () => {
    // Llamar al endpoint de logout (opcional, JWT es stateless)
    api.post("/auth/logout").catch(() => {
      // Ignorar errores, el logout es client-side
    });
    removeToken();
    setUser(null);
  };

  const hasPermission = (module: string): boolean => {
    if (!user?.permisos) return false;
    return user.permisos.includes(module);
  };

  // Mientras se verifica el token inicial, no renderizar la app
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
