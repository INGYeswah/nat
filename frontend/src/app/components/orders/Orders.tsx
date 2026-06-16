import { useState } from "react";
import {
  ClipboardList,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Search,
  X,
  MessageSquare,
  Ban,
  Factory,
  Plus,
} from "lucide-react";
import { useData } from "../../context/DataContext";

const statusConfig: Record<string, { label: string; icon: any; bgColor: string; textColor: string }> = {
  "Pendiente": { label: "Pendiente", icon: Clock, bgColor: "bg-gray-100", textColor: "text-gray-700" },
  "En proceso": { label: "Procesando", icon: Package, bgColor: "bg-blue-100", textColor: "text-blue-700" },
  "Enviado": { label: "Enviado", icon: Truck, bgColor: "bg-green-100", textColor: "text-green-700" },
  "Completado": { label: "Entregado", icon: CheckCircle, bgColor: "bg-green-100", textColor: "text-green-700" },
  "Cancelado": { label: "Cancelado", icon: AlertTriangle, bgColor: "bg-red-100", textColor: "text-red-700" },
};

const lotStatusConfig: Record<string, { label: string; icon: any; bgColor: string; textColor: string }> = {
  "En Proceso": { label: "En Proceso", icon: Factory, bgColor: "bg-blue-100", textColor: "text-blue-700" },
  "Completado": { label: "Completado", icon: CheckCircle, bgColor: "bg-green-100", textColor: "text-green-700" },
  "Cancelado": { label: "Cancelado", icon: AlertTriangle, bgColor: "bg-red-100", textColor: "text-red-700" },
};

const LOT_ESTADOS_TRANSICION: Record<string, string[]> = {
  "En Proceso": ["Completado", "Cancelado"],
  "Completado": [],
  "Cancelado": [],
};

const ESTADOS_TRANSICION: Record<string, string[]> = {
  "Pendiente": ["En proceso", "Cancelado"],
  "En proceso": ["Enviado", "Cancelado"],
  "Enviado": ["Completado", "Cancelado"],
  "Completado": [],
  "Cancelado": [],
};

export function Orders() {
  const {
    orders,
    productionLots,
    updateOrderStatus,
    cancelOrder,
    updateOrderComments,
    updateLotStatus,
    addOrder,
    clients,
    products,
    loading,
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"pedidos" | "produccion">("pedidos");

  // Comment modal
  const [commentModal, setCommentModal] = useState<{ id: string; currentComment: string } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    id_cliente: "",
    id_producto: "",
    cantidad: 1,
    estado_pedido: "Pendiente",
    comentarios: "",
  });
  const selectedProduct = products.find((p) => p.id === orderForm.id_producto);

  // Cancel modal
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLots = productionLots.filter((lot) => {
    const matchesSearch =
      lot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleLotStatusChange = async (lotId: string, newStatus: string) => {
    await updateLotStatus(lotId, newStatus);
  };

  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    setSubmitting(true);
    await cancelOrder(cancelModal, cancelReason || undefined);
    setCancelModal(null);
    setCancelReason("");
    setSubmitting(false);
  };

  const handleSaveComment = async () => {
    if (!commentModal) return;
    setSubmitting(true);
    await updateOrderComments(commentModal.id, commentText);
    setCommentModal(null);
    setCommentText("");
    setSubmitting(false);
  };

  const openCommentModal = (order: { id: string; comments: string | null }) => {
    setCommentModal({ id: order.id, currentComment: order.comments || "" });
    setCommentText(order.comments || "");
  };

  const ordersByStatus = (status: string) =>
    orders.filter((o) => o.status === status).length;

  const lotsByStatus = (status: string) =>
    productionLots.filter((l) => l.status === status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos y Logística</h1>
          <p className="text-gray-600 mt-1">Gestión de pedidos, envíos y producción</p>
        </div>
        <button
          onClick={() => {
            setOrderError(null);
            setOrderForm({ id_cliente: "", id_producto: "", cantidad: 1, estado_pedido: "Pendiente", comentarios: "" });
            setIsCreateOrderOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nuevo Pedido
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("pedidos"); setStatusFilter("all"); }}
          className={`px-5 py-2.5 rounded-lg font-medium transition ${
            activeTab === "pedidos"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <ClipboardList className="h-4 w-4 inline mr-2" />
          Pedidos ({orders.length})
        </button>
        <button
          onClick={() => { setActiveTab("produccion"); setStatusFilter("all"); }}
          className={`px-5 py-2.5 rounded-lg font-medium transition ${
            activeTab === "produccion"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Factory className="h-4 w-4 inline mr-2" />
          Producción ({productionLots.length})
        </button>
      </div>

      {/* Stats - Pedidos */}
      {activeTab === "pedidos" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(statusConfig).map(([key, conf]) => {
            const Icon = conf.icon;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                className={`bg-white rounded-xl shadow p-4 hover:shadow-lg transition text-left ${
                  statusFilter === key ? "ring-2 ring-green-500" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${conf.textColor}`} />
                  <span className="text-sm font-medium text-gray-600">{conf.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{ordersByStatus(key)}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Stats - Producción */}
      {activeTab === "produccion" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(lotStatusConfig).map(([key, conf]) => {
            const Icon = conf.icon;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                className={`bg-white rounded-xl shadow p-4 hover:shadow-lg transition text-left ${
                  statusFilter === key ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${conf.textColor}`} />
                  <span className="text-sm font-medium text-gray-600">{conf.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{lotsByStatus(key)}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Pipeline visual - Pedidos */}
      {activeTab === "pedidos" && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Flujo de Pedidos</h2>
          <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
            {["Pendiente", "En proceso", "Enviado", "Completado"].map((status, idx) => {
              const conf = statusConfig[status];
              const Icon = conf.icon;
              const count = ordersByStatus(status);
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={`flex flex-col items-center px-6 py-3 rounded-lg ${conf.bgColor}`}>
                    <Icon className={`h-6 w-6 ${conf.textColor} mb-1`} />
                    <span className="text-xs font-medium text-gray-600">{conf.label}</span>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                  {idx < 3 && (
                    <div className="text-gray-300 text-2xl">&rarr;</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline visual - Producción */}
      {activeTab === "produccion" && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Flujo de Producción</h2>
          <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2">
            {["En Proceso", "Completado", "Cancelado"].map((status, idx) => {
              const conf = lotStatusConfig[status];
              const Icon = conf.icon;
              const count = lotsByStatus(status);
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={`flex flex-col items-center px-8 py-3 rounded-lg ${conf.bgColor}`}>
                    <Icon className={`h-6 w-6 ${conf.textColor} mb-1`} />
                    <span className="text-xs font-medium text-gray-600">{conf.label}</span>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                  {idx < 2 && (
                    <div className="text-gray-300 text-2xl">&rarr;</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "pedidos" ? "Buscar por orden, cliente o producto..." : "Buscar por lote, producto, máquina u operario..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ver Todos
          </button>
        </div>
      </div>

      {isCreateOrderOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !orderSubmitting && setIsCreateOrderOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Crear Pedido</h3>
              <button onClick={() => !orderSubmitting && setIsCreateOrderOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              if (orderSubmitting) return;
              if (!orderForm.id_cliente || !orderForm.id_producto || orderForm.cantidad < 1) {
                setOrderError("Selecciona cliente, producto y cantidad válida.");
                return;
              }
              setOrderSubmitting(true);
              setOrderError(null);
              const product = products.find((p) => p.id === orderForm.id_producto);
              const ok = await addOrder({
                id_cliente: orderForm.id_cliente,
                id_producto: orderForm.id_producto,
                cantidad: orderForm.cantidad,
                precio_unitario: product?.salePrice || 0,
                estado_pedido: orderForm.estado_pedido,
                comentarios: orderForm.comentarios || undefined,
              });
              setOrderSubmitting(false);
              if (ok) {
                setIsCreateOrderOpen(false);
                setOrderForm({ id_cliente: "", id_producto: "", cantidad: 1, estado_pedido: "Pendiente", comentarios: "" });
              } else {
                setOrderError("No se pudo crear el pedido. Revisa los datos e intenta de nuevo.");
              }
            }}>
              {orderError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {orderError}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <select
                    value={orderForm.id_cliente}
                    onChange={(e) => setOrderForm({ ...orderForm, id_cliente: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                  <select
                    value={orderForm.id_producto}
                    onChange={(e) => setOrderForm({ ...orderForm, id_producto: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min={1}
                    value={orderForm.cantidad}
                    onChange={(e) => setOrderForm({ ...orderForm, cantidad: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={orderForm.estado_pedido}
                    onChange={(e) => setOrderForm({ ...orderForm, estado_pedido: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    {Object.keys(statusConfig).map((estado) => (
                      <option key={estado} value={estado}>{statusConfig[estado].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedProduct ? `$${selectedProduct.salePrice.toLocaleString()}` : "-"}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                <textarea
                  value={orderForm.comentarios}
                  onChange={(e) => setOrderForm({ ...orderForm, comentarios: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Notas opcionales..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setIsCreateOrderOpen(false); setOrderError(null); }}
                  disabled={orderSubmitting}
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {orderSubmitting ? "Creando pedido..." : "Crear pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TABLA DE PEDIDOS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pedidos" && (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentarios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const conf = statusConfig[order.status] || statusConfig["Pendiente"];
                  const Icon = conf.icon;
                  const transiciones = ESTADOS_TRANSICION[order.status] || [];
                  const isPendiente = order.status === "Pendiente";

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{order.orderId}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.customer}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.product}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.quantity}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ${order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${conf.bgColor} ${conf.textColor}`}>
                          <Icon className="h-3 w-3" />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.comments ? (
                          <div className="flex items-center gap-1 max-w-[180px]">
                            <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs text-gray-600 truncate" title={order.comments}>
                              {order.comments}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin comentarios</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Status change dropdown */}
                          {transiciones.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleStatusChange(order.id, e.target.value);
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Cambiar estado</option>
                              {transiciones.map((est) => (
                                <option key={est} value={est}>
                                  {statusConfig[est]?.label || est}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Comment button */}
                          <button
                            onClick={() => openCommentModal(order)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition text-gray-500 hover:text-blue-600"
                            title="Agregar/editar comentario"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          {/* Cancel button — only for Pendiente */}
                          {isPendiente && (
                            <button
                              onClick={() => { setCancelModal(order.id); setCancelReason(""); }}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition text-gray-500 hover:text-red-600"
                              title="Cancelar pedido"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              No hay pedidos registrados
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TABLA DE LOTES DE PRODUCCIÓN (desde Cadena de Suministro)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "produccion" && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Máquina</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLots.map((lot) => {
                  const conf = lotStatusConfig[lot.status] || lotStatusConfig["En Proceso"];
                  const Icon = conf.icon;
                  const transiciones = LOT_ESTADOS_TRANSICION[lot.status] || [];

                  return (
                    <tr key={lot.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{lot.id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lot.product}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lot.targetQuantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lot.machine}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lot.operator}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(lot.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              lot.progress >= 100 ? "bg-green-500" : lot.progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, lot.progress))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{Math.round(lot.progress)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${conf.bgColor} ${conf.textColor}`}>
                          <Icon className="h-3 w-3" />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {transiciones.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleLotStatusChange(lot.id, e.target.value);
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Cambiar estado</option>
                              {transiciones.map((est) => (
                                <option key={est} value={est}>
                                  {lotStatusConfig[est]?.label || est}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredLots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              No hay lotes de producción registrados. Crea lotes desde Cadena de Suministro.
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Agregar/Editar Comentario
          ═══════════════════════════════════════════════════════════════════════ */}
      {commentModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setCommentModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Comentario del Pedido</h3>
              <button onClick={() => !submitting && setCommentModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Escribe un comentario o nota sobre este pedido..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => !submitting && setCommentModal(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveComment}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Cancelar Pedido
          ═══════════════════════════════════════════════════════════════════════ */}
      {cancelModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setCancelModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Cancelar Pedido</h3>
              <button onClick={() => !submitting && setCancelModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Solo se pueden cancelar pedidos en estado <strong>Pendiente</strong>. Esta acción cambiará el estado a <strong>Cancelado</strong>.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cancelación (opcional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Indica el motivo de la cancelación..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelModal(null); setCancelReason(""); }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  No, Volver
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Cancelando..." : "Sí, Cancelar Pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
