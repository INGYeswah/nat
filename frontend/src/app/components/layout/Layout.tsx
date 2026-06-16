import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Network,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import logoImage from "../../../imports/image.png";

// Mapa de permisos por ruta de navegación
const navigationWithPermissions = [
  { name: "Tablero de Control", href: "/", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Inventario", href: "/inventario", icon: Package, permission: "inventario" },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart, permission: "ventas" },
  { name: "Pedidos y Logística", href: "/pedidos-logistica", icon: ClipboardList, permission: "pedidos" },
  { name: "Cadena de Suministro", href: "/cadena-suministro", icon: Network, permission: "supply" },
  { name: "Gestión de Personal", href: "/gestion-personal", icon: Users, permission: "personal" },
];

export function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtrar navegación según permisos del usuario
  const navigation = navigationWithPermissions.filter((item) => {
    // Siempre mostrar dashboard si tiene permiso
    if (item.permission === "dashboard") return hasPermission("dashboard");
    return hasPermission(item.permission);
  });

  // Si no hay navegación permitida (edge case), mostrar al menos dashboard
  if (navigation.length === 0) {
    navigation.push(navigationWithPermissions[0]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
            <SidebarContent
              navigation={navigation}
              location={location}
              user={user}
              logout={logout}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent navigation={navigation} location={location} user={user} logout={logout} />
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-72">
        {/* Header móvil */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="p-2 text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Natudai" className="h-8 w-auto" />
          </div>
        </div>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navigation,
  location,
  user,
  logout,
  onClose,
}: {
  navigation: typeof navigationWithPermissions;
  location: ReturnType<typeof useLocation>;
  user: any;
  logout: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Natudai" className="h-12 w-auto" />
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => {
            const isActive = item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                    isActive
                      ? "bg-green-50 text-green-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="font-medium text-green-700">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </div>
  );
}
