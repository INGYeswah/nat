import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

// Mapa de rutas a permisos requeridos
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/": "dashboard",
  "/inventario": "inventario",
  "/ventas": "ventas",
  "/pedidos-logistica": "pedidos",
  "/cadena-suministro": "supply",
  "/gestion-personal": "personal",
};

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permiso para la ruta actual
  const requiredPermission = ROUTE_PERMISSIONS[location.pathname];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Si no tiene permiso, redirigir a la primera ruta permitida
    // Buscar la primera ruta para la que sí tiene permiso
    const firstAllowedRoute = Object.entries(ROUTE_PERMISSIONS).find(
      ([_, perm]) => hasPermission(perm)
    );
    if (firstAllowedRoute) {
      return <Navigate to={firstAllowedRoute[0]} replace />;
    }
    // Si no tiene ningún permiso, cerrar sesión
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
