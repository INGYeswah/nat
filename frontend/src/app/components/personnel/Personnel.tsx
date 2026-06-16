import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Briefcase,
  Award,
  CheckCircle,
  Mail,
  X,
  Pencil,
  Shield,
  ToggleLeft,
  ToggleRight,
  KeyRound,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useData } from "../../context/DataContext";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

const ALL_PAGES = ["dashboard", "inventario", "ventas", "pedidos", "supply", "personal"];
const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  inventario: "Inventario",
  ventas: "Ventas",
  pedidos: "Pedidos",
  supply: "Cadena Suministro",
  personal: "Personal",
};

export function Personnel() {
  const {
    employees, roles, fetchEmployees, fetchRoles,
    addEmployee, updateEmployee, deleteEmployee,
    toggleEmployeeStatus, changeEmployeePassword, addRole, updateRole, deleteRole, loading,
  } = useData();

  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Employee form
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    cedula: "",
    id_rol: 1,
    password: "",
  });

  // Edit employee modal
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ nombre_completo: "", email: "", id_rol: 1 });

  // Role modals
  const [roleModal, setRoleModal] = useState<"create" | "edit" | null>(null);
  const [roleForm, setRoleForm] = useState({ nombre_rol: "", permisos: [] as string[] });
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<number | null>(null);

  // Password change modal
  const [passwordModal, setPasswordModal] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ nueva_password: "", confirmar_password: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch employees and roles on mount
  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [fetchEmployees, fetchRoles]);

  // Initialize id_rol when roles load
  useEffect(() => {
    if (roles.length > 0 && !roles.find(r => r.id_rol === formData.id_rol)) {
      setFormData(f => ({ ...f, id_rol: roles[0].id_rol }));
    }
  }, [roles]);

  const filteredEmployees =
    departmentFilter === "all"
      ? employees
      : employees.filter((e) => e.role === departmentFilter);

  const activeEmployees = employees.filter((e) => e.status === "Activo").length;

  // Charts data
  const roleData = roles.map((r, idx) => ({
    name: r.nombre_rol,
    value: employees.filter((e) => e.roleId === r.id_rol).length,
  })).filter(r => r.value > 0);

  const statusData = [
    { name: "Activos", value: employees.filter((e) => e.status === "Activo").length },
    { name: "Inactivos", value: employees.filter((e) => e.status === "Inactivo").length },
  ];

  // ── Employee handlers ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    const success = await addEmployee({
      nombre_completo: formData.nombre_completo,
      email: formData.email,
      cedula: formData.cedula,
      id_rol: formData.id_rol,
      password: formData.password,
    });
    if (success) {
      setIsModalOpen(false);
      setFormData({ nombre_completo: "", email: "", cedula: "", id_rol: roles[0]?.id_rol || 1, password: "" });
    } else {
      setFormError("Error al crear el empleado.");
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    await toggleEmployeeStatus(id, currentActive);
  };

  const openEditEmployee = (emp: any) => {
    setEditForm({ nombre_completo: emp.name, email: emp.email, id_rol: emp.roleId });
    setEditModal(emp);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !editModal) return;
    setSubmitting(true);
    setFormError(null);
    const success = await updateEmployee(editModal.id, editForm);
    if (success) {
      setEditModal(null);
    } else {
      setFormError("Error al actualizar el empleado.");
    }
    setSubmitting(false);
  };

  // ── Role handlers ───────────────────────────────────────────────────────
  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm({ nombre_rol: "", permisos: [] });
    setRoleModal("create");
  };

  const openEditRole = (role: any) => {
    setEditingRoleId(role.id_rol);
    let perms: string[] = [];
    if (role.permisos_json) {
      try {
        const parsed = typeof role.permisos_json === 'string' ? JSON.parse(role.permisos_json) : role.permisos_json;
        perms = Array.isArray(parsed) ? parsed : [];
      } catch { perms = []; }
    }
    setRoleForm({ nombre_rol: role.nombre_rol, permisos: perms });
    setRoleModal("edit");
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    const payload = { nombre_rol: roleForm.nombre_rol, permisos_json: JSON.stringify(roleForm.permisos) };
    let success = false;
    if (editingRoleId) {
      success = await updateRole(editingRoleId, payload);
    } else {
      success = await addRole(payload);
    }
    if (success) {
      setRoleModal(null);
    } else {
      setFormError("Error al guardar el rol.");
    }
    setSubmitting(false);
  };

  const handleDeleteRole = async (id: number) => {
    if (submitting) return;
    setSubmitting(true);
    await deleteRole(id);
    setDeleteRoleConfirm(null);
    setSubmitting(false);
  };

  // ── Password change handler ──────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !passwordModal) return;
    setPasswordError(null);

    if (passwordForm.nueva_password.length < 4) {
      setPasswordError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    if (passwordForm.nueva_password !== passwordForm.confirmar_password) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const success = await changeEmployeePassword(passwordModal, passwordForm.nueva_password);
    if (success) {
      setPasswordModal(null);
      setPasswordForm({ nueva_password: "", confirmar_password: "" });
    } else {
      setPasswordError("Error al cambiar la contraseña.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
          <p className="text-gray-600 mt-1">Administración de empleados y roles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateRole}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Shield className="h-5 w-5" />
            Nuevo Rol
          </button>
          <button
            onClick={() => { setIsModalOpen(true); setFormError(null); }}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <UserPlus className="h-5 w-5" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100"><Users className="h-6 w-6 text-green-600" /></div>
          </div>
          <p className="text-3xl font-bold text-green-600">{employees.length}</p>
          <p className="text-sm text-gray-600 mt-1">Total Empleados</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100"><CheckCircle className="h-6 w-6 text-green-600" /></div>
          </div>
          <p className="text-3xl font-bold text-green-600">{activeEmployees}</p>
          <p className="text-sm text-gray-600 mt-1">Activos</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100"><Award className="h-6 w-6 text-green-600" /></div>
          </div>
          <p className="text-3xl font-bold text-green-600">{roles.length}</p>
          <p className="text-sm text-gray-600 mt-1">Roles</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100"><Briefcase className="h-6 w-6 text-green-600" /></div>
          </div>
          <p className="text-3xl font-bold text-green-600">{roles.length}</p>
          <p className="text-sm text-gray-600 mt-1">Departamentos</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Empleados por Rol</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80} fill="#8884d8" dataKey="value">
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Empleados</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" name="Empleados" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Roles Section ═══ */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles y Permisos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empleados</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roles.map((role) => {
                let perms: string[] = [];
                if (role.permisos_json) {
                  try {
                    const parsed = typeof role.permisos_json === 'string' ? JSON.parse(role.permisos_json) : role.permisos_json;
                    perms = Array.isArray(parsed) ? parsed : [];
                  } catch { perms = []; }
                }
                const empCount = employees.filter(e => e.roleId === role.id_rol).length;
                return (
                  <tr key={role.id_rol} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{role.nombre_rol}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {perms.map(p => (
                          <span key={p} className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            {PAGE_LABELS[p] || p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{empCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditRole(role)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                        <button onClick={() => setDeleteRoleConfirm(role.id_rol)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setDepartmentFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${departmentFilter === "all" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Todos
          </button>
          {roles.map((rol) => (
            <button key={rol.id_rol} onClick={() => setDepartmentFilter(rol.nombre_rol)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${departmentFilter === rol.nombre_rol ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {rol.nombre_rol}
            </button>
          ))}
        </div>
      </div>

      {/* Employees List */}
      <div className="space-y-4">
        {filteredEmployees.map((employee) => {
          const isActive = employee.status === "Activo";
          return (
            <div key={employee.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-green-700">
                          {employee.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {employee.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{employee.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Cédula</p>
                        <p className="text-sm text-gray-900">{employee.cedula}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Contraseña</p>
                        <p className="text-sm text-gray-500">••••••••</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex lg:flex-col gap-2">
                  <button onClick={() => openEditEmployee(employee)}
                    className="flex-1 lg:flex-none px-4 py-2 border border-blue-300 hover:bg-blue-50 text-blue-700 rounded-lg text-sm font-medium transition">
                    <Pencil className="h-4 w-4 inline mr-1" /> Editar
                  </button>
                  <button onClick={() => { setPasswordModal(employee.id); setPasswordForm({ nueva_password: "", confirmar_password: "" }); setPasswordError(null); }}
                    className="flex-1 lg:flex-none px-4 py-2 border border-purple-300 hover:bg-purple-50 text-purple-700 rounded-lg text-sm font-medium transition">
                    <KeyRound className="h-4 w-4 inline mr-1" /> Contraseña
                  </button>
                  <button onClick={() => handleToggleStatus(employee.id, isActive)}
                    className={`flex-1 lg:flex-none px-4 py-2 border rounded-lg text-sm font-medium transition ${
                      isActive ? "border-yellow-300 hover:bg-yellow-50 text-yellow-700" : "border-green-300 hover:bg-green-50 text-green-700"
                    }`}>
                    {isActive ? (
                      <><ToggleLeft className="h-4 w-4 inline mr-1" /> Desactivar</>
                    ) : (
                      <><ToggleRight className="h-4 w-4 inline mr-1" /> Activar</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay empleados en este rol</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Nuevo Empleado
          ═══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Empleado</h2>
              <button onClick={() => !submitting && setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input type="text" required value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Ej: Juan Pérez García" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
                <input type="text" required value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Ej: 10102020" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="juan.perez@natudai.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input type="password" required value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Contraseña inicial" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select value={formData.id_rol}
                  onChange={(e) => setFormData({ ...formData, id_rol: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                  {roles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre_rol}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => !submitting && setIsModalOpen(false)} disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50">
                  {submitting ? "Creando..." : "Agregar Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Editar Empleado
          ═══════════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setEditModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Editar Empleado</h2>
              <button onClick={() => !submitting && setEditModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEditEmployee} className="p-6 space-y-5">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" required value={editForm.nombre_completo}
                  onChange={(e) => setEditForm({ ...editForm, nombre_completo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={editForm.id_rol}
                  onChange={(e) => setEditForm({ ...editForm, id_rol: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                  {roles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre_rol}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input type="text" value={editModal.cedula} readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none" />
                <p className="text-xs text-gray-400 mt-1">La cédula no se puede modificar</p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => !submitting && setEditModal(null)} disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50">
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Crear/Editar Rol
          ═══════════════════════════════════════════════════════════════════════ */}
      {roleModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setRoleModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">{editingRoleId ? "Editar Rol" : "Nuevo Rol"}</h2>
              <button onClick={() => !submitting && setRoleModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-5">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol *</label>
                <input type="text" required value={roleForm.nombre_rol}
                  onChange={(e) => setRoleForm({ ...roleForm, nombre_rol: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Ej: Jefe de Producción" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos *</label>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_PAGES.map(page => (
                    <label key={page} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={roleForm.permisos.includes(page)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({ ...roleForm, permisos: [...roleForm.permisos, page] });
                          } else {
                            setRoleForm({ ...roleForm, permisos: roleForm.permisos.filter(p => p !== page) });
                          }
                        }}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                      <span className="text-sm text-gray-700">{PAGE_LABELS[page]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => !submitting && setRoleModal(null)} disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50">
                  {submitting ? "Guardando..." : editingRoleId ? "Actualizar Rol" : "Crear Rol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Confirmar Eliminar Rol
          ═══════════════════════════════════════════════════════════════════════ */}
      {deleteRoleConfirm !== null && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteRoleConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Rol</h3>
            <p className="text-gray-600 mb-4">
              No se podrá eliminar si hay empleados asignados a este rol.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteRoleConfirm(null)} disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancelar</button>
              <button onClick={() => handleDeleteRole(deleteRoleConfirm)} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50">
                {submitting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Cambiar Contraseña
          ═══════════════════════════════════════════════════════════════════════ */}
      {passwordModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && setPasswordModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h3>
              <button onClick={() => !submitting && setPasswordModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{passwordError}</div>
              )}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                <KeyRound className="h-4 w-4 inline mr-1" />
                Establece una nueva contraseña para este empleado.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.nueva_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nueva_password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmar_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmar_password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Repite la contraseña"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => !submitting && setPasswordModal(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Cambiar Contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
