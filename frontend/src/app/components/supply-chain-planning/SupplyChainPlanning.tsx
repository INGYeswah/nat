import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Factory,
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useData } from "../../context/DataContext";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  "En Proceso": { label: "En Proceso", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  "Completado": { label: "Completado", bgColor: "bg-green-100", textColor: "text-green-700" },
  "Cancelado": { label: "Cancelado", bgColor: "bg-red-100", textColor: "text-red-700" },
};

const ESTADOS_TRANSICION: Record<string, string[]> = {
  "En Proceso": ["Completado", "Cancelado"],
  "Completado": [],
  "Cancelado": [],
};

const ESTADOS_MAQUINA = ["Operativa", "En Mantenimiento", "Fuera de Servicio"];

export function SupplyChainPlanning() {
  const {
    productionLots,
    machines,
    rawMaterials,
    products,
    fetchProductionLots,
    fetchMachines,
    fetchRawMaterials,
    createProductionLot,
    updateLotStatus,
    addMachine,
    updateMachine,
    deleteMachine,
    loading,
  } = useData();

  // Modals
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Lot form
  const [lotForm, setLotForm] = useState({
    id_maquina: "",
    id_producto: "",
    cantidad_esperada: 0,
    fecha_fin_estimada: "",
  });

  // Machine form
  const [machineForm, setMachineForm] = useState({
    nombre_maquina: "",
    descripcion: "",
    estado_actual: "Operativa",
    capacidad_por_turno: 0,
    tiempo_por_unidad_min: 0,
  });

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchProductionLots();
    fetchMachines();
    fetchRawMaterials();
  }, [fetchProductionLots, fetchMachines, fetchRawMaterials]);

  const activeLots = productionLots.filter((l) => l.status === "En Proceso").length;

  // ── Machine handlers ──────────────────────────────────────────────────────
  const openCreateMachine = () => {
    setEditingMachine(null);
    setMachineForm({
      nombre_maquina: "",
      descripcion: "",
      estado_actual: "Operativa",
      capacidad_por_turno: 0,
      tiempo_por_unidad_min: 0,
    });
    setFormError(null);
    setIsMachineModalOpen(true);
  };

  const openEditMachine = (machine: any) => {
    setEditingMachine(machine);
    setMachineForm({
      nombre_maquina: machine.name,
      descripcion: machine.description || "",
      estado_actual: machine.status,
      capacidad_por_turno: machine.capacityPerShift || 0,
      tiempo_por_unidad_min: machine.timePerUnitMin || 0,
    });
    setFormError(null);
    setIsMachineModalOpen(true);
  };

  const handleMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingMachine) {
        const success = await updateMachine(editingMachine.id, {
          nombre_maquina: machineForm.nombre_maquina,
          descripcion: machineForm.descripcion || undefined,
          estado_actual: machineForm.estado_actual,
          capacidad_por_turno: machineForm.capacidad_por_turno || null,
          tiempo_por_unidad_min: machineForm.tiempo_por_unidad_min || null,
        });
        if (!success) { setFormError("Error al actualizar la máquina."); return; }
      } else {
        const success = await addMachine({
          nombre_maquina: machineForm.nombre_maquina,
          descripcion: machineForm.descripcion || undefined,
          estado_actual: machineForm.estado_actual,
          capacidad_por_turno: machineForm.capacidad_por_turno || undefined,
          tiempo_por_unidad_min: machineForm.tiempo_por_unidad_min || undefined,
        });
        if (!success) { setFormError("Error al crear la máquina."); return; }
      }
      setIsMachineModalOpen(false);
    } catch {
      setFormError("Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (submitting) return;
    setSubmitting(true);
    await deleteMachine(id);
    setDeleteConfirm(null);
    setSubmitting(false);
  };

  // ── Lot handlers ──────────────────────────────────────────────────────────
  const handleLotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const success = await createProductionLot({
        id_maquina: lotForm.id_maquina,
        id_producto: lotForm.id_producto,
        cantidad_esperada: lotForm.cantidad_esperada,
        fecha_fin_estimada: lotForm.fecha_fin_estimada || undefined,
      });
      if (success) {
        setIsLotModalOpen(false);
        setLotForm({ id_maquina: "", id_producto: "", cantidad_esperada: 0, fecha_fin_estimada: "" });
      } else {
        setFormError("Error al crear el lote de producción.");
      }
    } catch {
      setFormError("Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLotStatusChange = async (lotId: string, newStatus: string) => {
    await updateLotStatus(lotId, newStatus);
  };

  // ── Capacity calculation ──────────────────────────────────────────────────
  // tiempo_por_unidad_min = minutos totales para producir capacidad_por_turno unidades
  const getCapacityDisplay = (machine: any) => {
    if (machine.capacityPerShift && machine.timePerUnitMin) {
      const mins = machine.timePerUnitMin;
      if (mins >= 60) {
        const horas = mins / 60;
        return `${machine.capacityPerShift} und en ${horas.toFixed(1)} horas`;
      }
      return `${machine.capacityPerShift} und en ${mins} minutos`;
    }
    if (machine.capacityPerShift) {
      return `${machine.capacityPerShift} und/turno`;
    }
    if (machine.timePerUnitMin) {
      return `${machine.timePerUnitMin} minutos`;
    }
    return "Sin datos de capacidad";
  };

  // Estimated time for a lot based on machine speed
  // tiempo_por_unidad_min = minutos para capacidad_por_turno und
  const getEstimatedTime = (machineId: string, quantity: number): string | null => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine?.timePerUnitMin || !machine?.capacityPerShift) return null;
    const minPorUnidad = machine.timePerUnitMin / machine.capacityPerShift;
    const totalMin = quantity * minPorUnidad;
    if (totalMin < 60) return `${totalMin.toFixed(0)} minutos`;
    const hours = totalMin / 60;
    if (hours < 24) return `${hours.toFixed(1)} horas`;
    const days = hours / 24;
    return `${days.toFixed(1)} días`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando producción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cadena de Suministro</h1>
          <p className="text-gray-600 mt-1">
            Transformación de insumos en producto terminado
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateMachine}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Factory className="h-5 w-5" />
            Nueva Máquina
          </button>
          <button
            onClick={() => { setIsLotModalOpen(true); setFormError(null); }}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="h-5 w-5" />
            Nuevo Lote
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
        <div>
          <p className="text-3xl font-bold text-green-600">{activeLots}</p>
          <p className="text-sm text-green-700 mt-1">
            Lotes en fabricación actualmente
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MÁQUINAS — CRUD con capacidad (X por X horas)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Máquinas</h2>
        {machines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            No hay máquinas registradas. Agrega una para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <div key={machine.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Factory className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{machine.name}</p>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        machine.status === "Operativa"
                          ? "bg-green-100 text-green-700"
                          : machine.status === "En Mantenimiento"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {machine.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditMachine(machine)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-blue-600"
                      title="Editar máquina"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(machine.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-red-600"
                      title="Eliminar máquina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {machine.description && (
                  <p className="text-sm text-gray-500 mb-2">{machine.description}</p>
                )}

                {/* Capacidad: X unidades cada X horas */}
                <div className="bg-gray-50 rounded-md px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700">Capacidad: </span>
                  <span className="text-green-700 font-semibold">
                    {getCapacityDisplay(machine)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Materias primas */}
      {rawMaterials.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Materias Primas</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rawMaterials.map((rm) => (
                  <tr key={rm.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {rm.name}
                      {rm.stock < rm.minStock && (
                        <AlertTriangle className="h-4 w-4 text-red-500 inline ml-1" />
                      )}
                    </td>
                    <td className={`px-4 py-2 text-sm ${rm.stock < rm.minStock ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {rm.stock} {rm.unit}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {rm.minStock} {rm.unit}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      ${rm.cost.toLocaleString()}/{rm.unit}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{rm.supplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lotes de producción */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lotes de Producción</h2>
          <div className="space-y-4">
            {productionLots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                No hay lotes de producción registrados
              </div>
            ) : (
              productionLots.map((lot) => {
                const conf = statusConfig[lot.status] || statusConfig["En Proceso"];
                const transiciones = ESTADOS_TRANSICION[lot.status] || [];

                return (
                  <div
                    key={lot.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {lot.product}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Lote: {lot.id} · Meta: {lot.targetQuantity} uds · Máquina: {lot.machine}
                        </p>
                        <p className="text-xs text-gray-500">
                          Operario: {lot.operator}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${conf.bgColor} ${conf.textColor}`}>
                          {conf.label}
                        </span>
                        {transiciones.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleLotStatusChange(lot.id, e.target.value);
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500 outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Cambiar</option>
                            {transiciones.map((est) => (
                              <option key={est} value={est}>
                                {statusConfig[est]?.label || est}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progreso de fabricación</span>
                        <span className="font-semibold text-gray-900">
                          {lot.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${lot.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Inicio: {lot.startDate ? new Date(lot.startDate).toLocaleDateString() : "N/A"}</span>
                        <span>Fin est.: {lot.endDate ? new Date(lot.endDate).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Crear/Editar Máquina
          ═══════════════════════════════════════════════════════════════════════ */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setIsMachineModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingMachine ? "Editar Máquina" : "Nueva Máquina"}
              </h2>
              <button onClick={() => !submitting && setIsMachineModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleMachineSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Máquina *</label>
                <input
                  type="text"
                  required
                  value={machineForm.nombre_maquina}
                  onChange={(e) => setMachineForm({ ...machineForm, nombre_maquina: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Ej: Deshidratadora Industrial T-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={machineForm.descripcion}
                  onChange={(e) => setMachineForm({ ...machineForm, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Descripción de la máquina..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={machineForm.estado_actual}
                  onChange={(e) => setMachineForm({ ...machineForm, estado_actual: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  {ESTADOS_MAQUINA.map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidades por Turno</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={machineForm.capacidad_por_turno || ""}
                    onChange={(e) => setMachineForm({ ...machineForm, capacidad_por_turno: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Ej: 500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Cantidad que produce por turno</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo (minutos)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={machineForm.tiempo_por_unidad_min || ""}
                    onChange={(e) => setMachineForm({ ...machineForm, tiempo_por_unidad_min: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Ej: 15"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minutos para producir las unidades del turno</p>
                </div>
              </div>

              {/* Preview de capacidad */}
              {machineForm.capacidad_por_turno > 0 && machineForm.tiempo_por_unidad_min > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <span className="font-medium text-green-800">Capacidad: </span>
                  <span className="text-green-700">
                    {machineForm.capacidad_por_turno} und en {machineForm.tiempo_por_unidad_min >= 60
                      ? `${(machineForm.tiempo_por_unidad_min / 60).toFixed(1)} horas`
                      : `${machineForm.tiempo_por_unidad_min} minutos`}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => !submitting && setIsMachineModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingMachine ? "Actualizar" : "Crear Máquina"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Nuevo Lote de Producción
          ═══════════════════════════════════════════════════════════════════════ */}
      {isLotModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setIsLotModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Lote de Producción</h2>
              <button onClick={() => !submitting && setIsLotModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleLotSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máquina *</label>
                <select
                  required
                  value={lotForm.id_maquina}
                  onChange={(e) => setLotForm({ ...lotForm, id_maquina: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar máquina...</option>
                  {machines.filter(m => m.status === "Operativa").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {getCapacityDisplay(m)}
                    </option>
                  ))}
                  {machines.filter(m => m.status !== "Operativa").map((m) => (
                    <option key={m.id} value={m.id} disabled>
                      {m.name} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <select
                  required
                  value={lotForm.id_producto}
                  onChange={(e) => setLotForm({ ...lotForm, id_producto: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Esperada *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lotForm.cantidad_esperada || ""}
                  onChange={(e) => setLotForm({ ...lotForm, cantidad_esperada: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Ej: 500"
                />
              </div>

              {/* Estimated time display */}
              {lotForm.id_maquina && lotForm.cantidad_esperada > 0 && getEstimatedTime(lotForm.id_maquina, lotForm.cantidad_esperada) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <span className="font-medium text-blue-800">Tiempo estimado: </span>
                  <span className="text-blue-700">{getEstimatedTime(lotForm.id_maquina, lotForm.cantidad_esperada)}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin Estimada</label>
                <input
                  type="date"
                  value={lotForm.fecha_fin_estimada}
                  onChange={(e) => setLotForm({ ...lotForm, fecha_fin_estimada: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Se calcula automáticamente según la velocidad de la máquina si no se especifica</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => !submitting && setIsLotModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear Lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Confirmar Eliminación de Máquina
          ═══════════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Máquina</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas eliminar esta máquina? Esta acción no se puede deshacer.
              No se eliminará si tiene lotes de producción activos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                No, Cancelar
              </button>
              <button
                onClick={() => handleDeleteMachine(deleteConfirm)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
