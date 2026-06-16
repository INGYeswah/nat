import { createBrowserRouter } from "react-router";
import { Login } from "./components/auth/Login";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Inventory } from "./components/inventory/Inventory";
import { Sales } from "./components/sales/Sales";
import { Orders } from "./components/orders/Orders";
import { SupplyChainPlanning } from "./components/supply-chain-planning/SupplyChainPlanning";
import { Personnel } from "./components/personnel/Personnel";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, Component: Dashboard },
      { path: "inventario", Component: Inventory },
      { path: "ventas", Component: Sales },
      { path: "pedidos-logistica", Component: Orders },
      { path: "cadena-suministro", Component: SupplyChainPlanning },
      { path: "gestion-personal", Component: Personnel },
    ],
  },
]);
