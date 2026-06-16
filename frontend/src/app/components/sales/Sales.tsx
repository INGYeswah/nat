import { useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  Filter,
  Plus,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useData } from "../../context/DataContext";

export function Sales() {
  const { sales, products, clients, loading, addSale, addClient, fetchProducts } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Sale form
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Client form
  const [clientName, setClientName] = useState("");
  const [clientNit, setClientNit] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const unitPrice = selectedProductData?.salePrice || 0;
  const total = quantity * unitPrice;

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const completedSales = sales.filter((s) => s.status === "Completado");
  const avgOrderValue = sales.length > 0 ? totalSales / sales.length : 0;

  const salesByProduct = sales.reduce((acc: { product: string; total: number }[], sale) => {
    const existing = acc.find((item) => item.product === sale.product);
    if (existing) {
      existing.total += sale.total;
    } else {
      acc.push({ product: sale.product, total: sale.total });
    }
    return acc;
  }, []);

  const salesByStatus = [
    { status: "Completado", count: sales.filter((s) => s.status === "Completado").length },
    { status: "Pendiente", count: sales.filter((s) => s.status === "Pendiente").length },
    { status: "En proceso", count: sales.filter((s) => s.status === "En proceso").length },
  ];

  const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
    "Completado": { label: "Completado", bgColor: "bg-green-100", textColor: "text-green-700" },
    "Pendiente": { label: "Pendiente", bgColor: "bg-orange-100", textColor: "text-orange-700" },
    "En proceso": { label: "En Proceso", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    "Enviado": { label: "Enviado", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    "Cancelado": { label: "Cancelado", bgColor: "bg-red-100", textColor: "text-red-700" },
  };

  const handleSaveSale = async () => {
    if (!selectedClient || !selectedProduct || quantity <= 0) {
      setModalError("Completa todos los campos correctamente.");
      return;
    }
    setSaving(true);
    setModalError("");
    const ok = await addSale({
      id_cliente: selectedClient,
      id_producto: selectedProduct,
      cantidad: quantity,
      precio_unitario: unitPrice,
    });
    setSaving(false);
    if (ok) {
      setShowSaleModal(false);
      setSelectedClient("");
      setSelectedProduct("");
      setQuantity(1);
    } else {
      setModalError("Error al registrar la venta. Verifica los datos.");
    }
  };

  const handleSaveClient = async () => {
    if (!clientName || !clientNit) {
      setModalError("Nombre y NIT son obligatorios.");
      return;
    }
    setSaving(true);
    setModalError("");
    const idCliente = "cli-" + Date.now();
    const ok = await addClient({
      id_cliente: idCliente,
      nombre: clientName,
      nit: clientNit,
      email: clientEmail || undefined,
    });
    setSaving(false);
    if (ok) {
      setShowClientModal(false);
      setClientName("");
      setClientNit("");
      setClientEmail("");
      // Auto-seleccionar el cliente recién creado
      setSelectedClient(idCliente);
    } else {
      setModalError("Error al crear el cliente. Verifica que el NIT no esté repetido.");
    }
  };

  const resetSaleModal = () => {
    setShowSaleModal(false);
    setSelectedClient("");
    setSelectedProduct("");
    setQuantity(1);
    setModalError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-1">Seguimiento de ventas completadas</p>
        </div>
        <button
          onClick={() => setShowSaleModal(true)}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${totalSales.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">Ventas Totales (COP)</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{sales.length}</p>
          <p className="text-sm text-gray-600 mt-1">Total Ventas</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-600 mt-1">Valor Promedio</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{completedSales.length}</p>
          <p className="text-sm text-gray-600 mt-1">Ventas Completadas</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Producto
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByProduct}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" angle={-30} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Bar dataKey="total" fill="#10b981" name="Ventas (COP)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Estado
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por orden, cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Completado">Completado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En Proceso</option>
              <option value="Enviado">Enviado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((sale) => {
                const conf = statusConfig[sale.status] || statusConfig["Pendiente"];
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{sale.orderId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.product}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ${sale.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conf.bgColor} ${conf.textColor}`}>
                        {conf.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            No hay ventas registradas. Haz clic en "Nueva Venta" para registrar una.
          </div>
        )}
      </div>

      {/* ═══ MODAL: Nueva Venta ═══ */}
      {showSaleModal && !showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Nueva Venta</h2>
              <button onClick={resetSaleModal} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <div className="flex gap-2">
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.nit})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setShowClientModal(true); setModalError(""); }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    <Plus className="h-4 w-4" /> Nuevo
                  </button>
                </div>
                {clients.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No hay clientes. Haz clic en "Nuevo" para agregar uno.
                  </p>
                )}
              </div>

              {/* Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.salePrice.toLocaleString()}/{p.unit} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={selectedProductData?.stock || 9999}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                {selectedProductData && (
                  <p className="text-xs text-gray-500 mt-1">
                    Stock disponible: {selectedProductData.stock} {selectedProductData.unit}
                  </p>
                )}
              </div>

              {/* Resumen */}
              {selectedProductData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio unitario:</span>
                    <span className="font-medium">${unitPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="border-t border-green-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-700 text-lg">${total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {modalError}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={resetSaleModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSale}
                disabled={saving || !selectedClient || !selectedProduct}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Registrar Venta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Nuevo Cliente ═══ */}
      {showClientModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setShowClientModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Cliente</h2>
              <button onClick={() => setShowClientModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Distribuidora Los Andes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT *</label>
                <input
                  type="text"
                  value={clientNit}
                  onChange={(e) => setClientNit(e.target.value)}
                  placeholder="Ej: 900.123.456-2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Ej: contacto@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {modalError}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowClientModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClient}
                disabled={saving || !clientName || !clientNit}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Crear Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
