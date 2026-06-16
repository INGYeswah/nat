import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Package,
  TrendingUp,
  AlertCircle,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useData } from "../../context/DataContext";

const COLORS = ["#10b981", "#22c55e", "#34d399", "#6ee7b7", "#86efac"];

export function Dashboard() {
  const { products, sales, orders, kpis, alerts, loading } = useData();
  const navigate = useNavigate();
  const [inventoryView, setInventoryView] = useState("total");
  const [distributionView, setDistributionView] = useState("category");

  const totalInventory = products.reduce((sum, p) => sum + p.stock, 0);
  const totalSales = kpis?.ingresosTotales || sales.reduce((sum, s) => sum + s.total, 0);

  const stats = [
    {
      name: "Inventario Total",
      value: `${totalInventory.toLocaleString()} uds`,
      change: kpis ? `${kpis.stockCritico} bajo mínimo` : "",
      trend: "up" as const,
      icon: Package,
      color: "green",
      route: "/inventario",
    },
    {
      name: "Ingresos Totales",
      value: `$${totalSales.toLocaleString()} COP`,
      change: `${kpis?.pedidosActivos || 0} pedidos activos`,
      trend: "up" as const,
      icon: DollarSign,
      color: "green",
      route: "/ventas",
    },
    {
      name: "Alertas Producción",
      value: String(alerts.length),
      change: "",
      trend: "none" as const,
      icon: AlertCircle,
      color: "red",
      route: "/cadena-suministro",
    },
  ];

  // Datos de inventario por producto
  const inventoryByProduct = products.map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
    stock: p.stock,
  }));

  // Datos de distribución por unidad de medida
  const distributionByUnit = products.reduce((acc: { name: string; value: number }[], product) => {
    const existing = acc.find((item) => item.name === product.unit);
    if (existing) {
      existing.value += product.stock;
    } else {
      acc.push({ name: product.unit, value: product.stock });
    }
    return acc;
  }, []);

  // Distribución por rango de precio
  const distributionByPrice = [
    {
      name: "< $30,000",
      value: products.filter((p) => p.salePrice < 30000).reduce((sum, p) => sum + p.stock, 0),
    },
    {
      name: "$30k - $60k",
      value: products.filter((p) => p.salePrice >= 30000 && p.salePrice < 60000).reduce((sum, p) => sum + p.stock, 0),
    },
    {
      name: "> $60,000",
      value: products.filter((p) => p.salePrice >= 60000).reduce((sum, p) => sum + p.stock, 0),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tablero de Control</h1>
        <p className="text-gray-600 mt-1">Resumen general del sistema Natudai - Bogotá, Colombia</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.name}
              onClick={() => navigate(stat.route)}
              className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.color === "green" ? "bg-green-100" : "bg-red-100"}`}>
                  <Icon className={`h-6 w-6 ${stat.color === "green" ? "text-green-600" : "text-red-600"}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  {stat.trend === "up" && <ArrowUp className="h-4 w-4"/>}
                  {stat.trend === "down" && <ArrowDown className="h-4 w-4"/>}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.name}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {inventoryView === "total" ? "Inventario por Producto" : "Stock por Producto (detalle)"}
            </h2>
            <div className="relative">
              <select
                value={inventoryView}
                onChange={(e) => setInventoryView(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="total">Inventario por Producto</option>
                <option value="byProduct">Stock Detallado</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryByProduct}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" fill="#10b981" name="Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {distributionView === "category" ? "Distribución por Unidad" : "Distribución por Precio"}
            </h2>
            <div className="relative">
              <select
                value={distributionView}
                onChange={(e) => setDistributionView(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="category">Por Unidad</option>
                <option value="location">Por Precio</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionView === "category" ? distributionByUnit : distributionByPrice}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(distributionView === "category" ? distributionByUnit : distributionByPrice).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h2>
        <div className="space-y-4">
          {/* Mostrar alertas de stock */}
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Alerta: Stock bajo de {alert.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Stock: {alert.stock} (mín: {alert.minStock}) — Faltan: {alert.missing}
                </p>
              </div>
            </div>
          ))}

          {/* Mostrar últimos pedidos */}
          {orders.slice(0, 4).map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Pedido {order.orderId} de {order.customer}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.product} x{order.quantity} — {order.status} — {new Date(order.orderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}

          {/* Si no hay actividad reciente */}
          {alerts.length === 0 && orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
