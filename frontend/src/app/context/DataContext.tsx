import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  api,
  type ProductoAPI,
  type PedidoAPI,
  type VentaAPI,
  type LoteAPI,
  type MaquinaAPI,
  type EmpleadoAPI,
  type RolAPI,
  type MateriaPrimaAPI,
  type KpiResponse,
  type AlertaAPI,
  type ClienteAPI,
} from "../services/api";
import { useAuth } from "./AuthContext";

// ---- Frontend-facing interfaces (mapped from API) ----

export interface Product {
  id: string;
  name: string;
  description: string;
  stock: number;
  minStock: number;
  salePrice: number;
  unit: string;
}

export interface Order {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  comments: string | null;
}

export interface Sale {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  date: string;
}

export interface ProductionLot {
  id: string;
  product: string;
  targetQuantity: number;
  progress: number;
  machine: string;
  operator: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Machine {
  id: string;
  name: string;
  description: string;
  status: string;
  capacityPerShift: number | null;
  timePerUnitMin: number | null;
}

export interface Employee {
  id: string;
  name: string;
  cedula: string;
  email: string;
  role: string;
  roleId: number;
  status: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  cost: number;
  unit: string;
  supplier: string;
}

export interface Client {
  id: string;
  name: string;
  nit: string;
  email: string;
  level: string;
}

export interface DashboardKpis {
  stockCritico: number;
  ingresosTotales: number;
  pedidosActivos: number;
  lotesActivos: number;
  empleadosActivos: number;
}

export interface StockAlert {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  missing: number;
}

// ---- Mappers API → Frontend ----

function mapProduct(p: ProductoAPI): Product {
  return {
    id: p.id_producto,
    name: p.nombre_producto,
    description: p.descripcion || "",
    stock: Number(p.stock_actual),
    minStock: Number(p.stock_minimo),
    salePrice: Number(p.precio_venta),
    unit: p.unidad_medida,
  };
}

function mapOrder(p: PedidoAPI): Order {
  return {
    id: p.id_pedido,
    orderId: p.id_pedido,
    customer: p.cliente,
    product: p.producto,
    quantity: Number(p.cantidad),
    unitPrice: Number(p.precio_unitario),
    totalAmount: Number(p.total_pagar),
    status: p.estado,
    orderDate: p.fecha_orden,
    comments: p.comentarios || null,
  };
}

function mapSale(v: VentaAPI): Sale {
  return {
    id: v.id_pedido,
    orderId: v.id_pedido,
    customer: v.cliente,
    product: v.producto,
    quantity: Number(v.cantidad),
    unitPrice: Number(v.precio_unitario),
    total: Number(v.total_pagar),
    status: v.estado_pedido,
    date: v.fecha_orden,
  };
}

function mapLot(l: LoteAPI): ProductionLot {
  return {
    id: l.id_lote,
    product: l.nombre_producto,
    targetQuantity: Number(l.cantidad_esperada),
    progress: Number(l.progreso),
    machine: l.maquina,
    operator: l.operario,
    startDate: l.fecha_inicio,
    endDate: l.fecha_fin,
    status: l.estado_lote,
  };
}

function mapMachine(m: MaquinaAPI): Machine {
  return {
    id: m.id_maquina,
    name: m.nombre_maquina,
    description: m.descripcion || "",
    status: m.estado_actual,
    capacityPerShift: m.capacidad_por_turno !== null ? Number(m.capacidad_por_turno) : null,
    timePerUnitMin: m.tiempo_por_unidad_min !== null ? Number(m.tiempo_por_unidad_min) : null,
  };
}

function mapEmployee(e: EmpleadoAPI): Employee {
  return {
    id: e.id_usuario,
    name: e.nombre_completo,
    cedula: e.cedula,
    email: e.email,
    role: e.nombre_rol,
    roleId: e.id_rol,
    status: e.estado,
  };
}

function mapRawMaterial(m: MateriaPrimaAPI): RawMaterial {
  return {
    id: m.id_mp,
    name: m.nombre_mp,
    stock: Number(m.stock_actual),
    minStock: Number(m.stock_minimo),
    cost: Number(m.costo_unitario),
    unit: m.unidad_medida,
    supplier: m.proveedor || "",
  };
}

function mapClient(c: ClienteAPI): Client {
  return {
    id: c.id_cliente,
    name: c.nombre,
    nit: c.nit,
    email: c.email || "",
    level: c.nivel_partner,
  };
}

function mapKpis(k: KpiResponse): DashboardKpis {
  return {
    stockCritico: k.stock_critico,
    ingresosTotales: Number(k.ingresos_totales),
    pedidosActivos: k.pedidos_activos,
    lotesActivos: k.lotes_activos,
    empleadosActivos: k.empleados_activos,
  };
}

function mapAlert(a: AlertaAPI): StockAlert {
  return {
    id: a.id_producto,
    name: a.nombre_producto,
    stock: Number(a.stock_actual),
    minStock: Number(a.stock_minimo),
    missing: Number(a.unidades_faltantes),
  };
}

// ---- Context ----

interface DataContextType {
  products: Product[];
  orders: Order[];
  sales: Sale[];
  productionLots: ProductionLot[];
  machines: Machine[];
  employees: Employee[];
  roles: RolAPI[];
  rawMaterials: RawMaterial[];
  clients: Client[];
  kpis: DashboardKpis | null;
  alerts: StockAlert[];
  loading: boolean;
  error: string | null;

  // Fetch methods
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchProductionLots: () => Promise<void>;
  fetchMachines: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchRawMaterials: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchKpis: () => Promise<void>;
  fetchAlerts: () => Promise<void>;

  // Product CRUD
  addProduct: (product: Omit<ProductoAPI, "id_producto">) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<ProductoAPI>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Order CRUD
  addOrder: (data: { id_cliente: string; id_producto: string; cantidad: number; precio_unitario: number; comentarios?: string }) => Promise<boolean>;
  updateOrderStatus: (id: string, estado: string) => Promise<boolean>;
  cancelOrder: (id: string, comentarios?: string) => Promise<boolean>;
  updateOrderComments: (id: string, comentarios: string) => Promise<boolean>;

  // Sales CRUD
  addSale: (data: { id_cliente: string; id_producto: string; cantidad: number; precio_unitario: number }) => Promise<boolean>;
  deleteSale: (id: string) => Promise<boolean>;

  // Machine CRUD
  addMachine: (data: { nombre_maquina: string; descripcion?: string; estado_actual?: string; capacidad_por_turno?: number; tiempo_por_unidad_min?: number }) => Promise<boolean>;
  updateMachine: (id: string, data: { nombre_maquina: string; descripcion?: string; estado_actual: string; capacidad_por_turno?: number | null; tiempo_por_unidad_min?: number | null }) => Promise<boolean>;
  deleteMachine: (id: string) => Promise<boolean>;
  updateMachineStatus: (id: string, estado_actual: string) => Promise<boolean>;

  // Production Lot
  createProductionLot: (data: { id_maquina: string; id_producto: string; cantidad_esperada: number; fecha_fin_estimada?: string }) => Promise<boolean>;
  updateLotStatus: (id: string, estado: string) => Promise<boolean>;

  // Client
  addClient: (data: { id_cliente: string; nombre: string; nit: string; email?: string; nivel_partner?: string }) => Promise<boolean>;

  // Employee
  addEmployee: (data: { nombre_completo: string; cedula: string; email: string; id_rol: number; password: string }) => Promise<boolean>;
  updateEmployee: (id: string, data: { nombre_completo?: string; email?: string; id_rol?: number; estado_activo?: boolean }) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;

  // Role
  addRole: (data: { nombre_rol: string; permisos_json: string }) => Promise<boolean>;
  updateRole: (id: number, data: { nombre_rol: string; permisos_json: string }) => Promise<boolean>;
  deleteRole: (id: number) => Promise<boolean>;

  // Toggle
  toggleEmployeeStatus: (id: string, currentActive: boolean) => Promise<boolean>;

  // Change Password
  changeEmployeePassword: (id: string, nueva_password: string) => Promise<boolean>;

  // Lookup
  getProductById: (id: string) => Product | undefined;
  getProductByName: (name: string) => Product | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [productionLots, setProductionLots] = useState<ProductionLot[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RolAPI[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch methods ----

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<ProductoAPI[]>("/productos");
      setProducts(data.map(mapProduct));
    } catch (err: any) {
      console.error("Error fetching products:", err.message);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<PedidoAPI[]>("/pedidos");
      setOrders(data.map(mapOrder));
    } catch (err: any) {
      console.error("Error fetching orders:", err.message);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const data = await api.get<VentaAPI[]>("/ventas");
      setSales(data.map(mapSale));
    } catch (err: any) {
      console.error("Error fetching sales:", err.message);
    }
  }, []);

  const fetchProductionLots = useCallback(async () => {
    try {
      const data = await api.get<LoteAPI[]>("/produccion/lotes");
      setProductionLots(data.map(mapLot));
    } catch (err: any) {
      console.error("Error fetching production lots:", err.message);
    }
  }, []);

  const fetchMachines = useCallback(async () => {
    try {
      const data = await api.get<MaquinaAPI[]>("/produccion/maquinas");
      setMachines(data.map(mapMachine));
    } catch (err: any) {
      console.error("Error fetching machines:", err.message);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await api.get<EmpleadoAPI[]>("/empleados");
      setEmployees(data.map(mapEmployee));
    } catch (err: any) {
      console.error("Error fetching employees:", err.message);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await api.get<RolAPI[]>("/empleados/roles");
      setRoles(data);
    } catch (err: any) {
      console.error("Error fetching roles:", err.message);
    }
  }, []);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const data = await api.get<MateriaPrimaAPI[]>("/productos/materia-prima/lista");
      setRawMaterials(data.map(mapRawMaterial));
    } catch (err: any) {
      console.error("Error fetching raw materials:", err.message);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const data = await api.get<ClienteAPI[]>("/clientes");
      setClients(data.map(mapClient));
    } catch (err: any) {
      console.error("Error fetching clients:", err.message);
    }
  }, []);

  const fetchKpis = useCallback(async () => {
    try {
      const data = await api.get<KpiResponse>("/dashboard/kpis");
      setKpis(mapKpis(data));
    } catch (err: any) {
      console.error("Error fetching KPIs:", err.message);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.get<AlertaAPI[]>("/dashboard/alertas");
      setAlerts(data.map(mapAlert));
    } catch (err: any) {
      console.error("Error fetching alerts:", err.message);
    }
  }, []);

  // ---- CRUD methods ----

  // Products
  const addProduct = useCallback(async (productData: Omit<ProductoAPI, "id_producto">): Promise<boolean> => {
    try {
      await api.post("/productos", productData);
      await fetchProducts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, productData: Partial<ProductoAPI>): Promise<boolean> => {
    try {
      await api.put(`/productos/${id}`, productData);
      await fetchProducts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/productos/${id}`);
      await fetchProducts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchProducts]);

  // Orders
  const addOrder = useCallback(async (data: { id_cliente: string; id_producto: string; cantidad: number; precio_unitario: number; comentarios?: string }): Promise<boolean> => {
    try {
      await api.post("/pedidos", data);
      await fetchOrders();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (id: string, estado: string): Promise<boolean> => {
    try {
      await api.patch(`/pedidos/${id}/status`, { estado });
      await fetchOrders();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (id: string, comentarios?: string): Promise<boolean> => {
    try {
      await api.patch(`/pedidos/${id}/cancel`, { comentarios });
      await fetchOrders();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOrders]);

  const updateOrderComments = useCallback(async (id: string, comentarios: string): Promise<boolean> => {
    try {
      await api.patch(`/pedidos/${id}/comentarios`, { comentarios });
      await fetchOrders();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOrders]);

  // Sales
  const addSale = useCallback(async (data: { id_cliente: string; id_producto: string; cantidad: number; precio_unitario: number }): Promise<boolean> => {
    try {
      await api.post("/ventas", data);
      await fetchSales();
      await fetchOrders();       // Las ventas crean pedidos, refrescar también
      await fetchProducts(); // stock changes
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchSales, fetchOrders, fetchProducts]);

  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/ventas/${id}`);
      await fetchSales();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchSales]);

  // Machines
  const addMachine = useCallback(async (data: { nombre_maquina: string; descripcion?: string; estado_actual?: string; capacidad_por_turno?: number; tiempo_por_unidad_min?: number }): Promise<boolean> => {
    try {
      await api.post("/produccion/maquinas", data);
      await fetchMachines();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMachines]);

  const updateMachine = useCallback(async (id: string, data: { nombre_maquina: string; descripcion?: string; estado_actual: string; capacidad_por_turno?: number | null; tiempo_por_unidad_min?: number | null }): Promise<boolean> => {
    try {
      await api.put(`/produccion/maquinas/${id}`, data);
      await fetchMachines();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMachines]);

  const deleteMachine = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/produccion/maquinas/${id}`);
      await fetchMachines();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMachines]);

  const updateMachineStatus = useCallback(async (id: string, estado_actual: string): Promise<boolean> => {
    try {
      await api.patch(`/produccion/maquinas/${id}/status`, { estado_actual });
      await fetchMachines();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchMachines]);

  // Production Lots
  const createProductionLot = useCallback(async (data: { id_maquina: string; id_producto: string; cantidad_esperada: number; fecha_fin_estimada?: string }): Promise<boolean> => {
    try {
      await api.post("/produccion/lotes", data);
      await fetchProductionLots();
      await fetchProducts();   // El stock puede cambiar
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchProductionLots, fetchProducts]);

  const updateLotStatus = useCallback(async (id: string, estado: string): Promise<boolean> => {
    try {
      await api.patch(`/produccion/lotes/${id}/status`, { estado });
      await fetchProductionLots();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchProductionLots]);

  // Clients
  const addClient = useCallback(async (data: { id_cliente: string; nombre: string; nit: string; email?: string; nivel_partner?: string }): Promise<boolean> => {
    try {
      await api.post("/clientes", data);
      await fetchClients();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchClients]);

  // Employees
  const addEmployee = useCallback(async (data: { nombre_completo: string; cedula: string; email: string; id_rol: number; password: string }): Promise<boolean> => {
    try {
      await api.post("/empleados", data);
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (id: string, data: { nombre_completo?: string; email?: string; id_rol?: number; estado_activo?: boolean }): Promise<boolean> => {
    try {
      await api.put(`/empleados/${id}`, data);
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchEmployees]);

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/empleados/${id}`);
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchEmployees]);

  // Roles
  const addRole = useCallback(async (data: { nombre_rol: string; permisos_json: string }): Promise<boolean> => {
    try {
      await api.post("/empleados/roles", data);
      await fetchRoles();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchRoles]);

  const updateRole = useCallback(async (id: number, data: { nombre_rol: string; permisos_json: string }): Promise<boolean> => {
    try {
      await api.put(`/empleados/roles/${id}`, data);
      await fetchRoles();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchRoles]);

  const deleteRole = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/empleados/roles/${id}`);
      await fetchRoles();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchRoles]);

  // Toggle Employee Status
  const toggleEmployeeStatus = useCallback(async (id: string, currentActive: boolean): Promise<boolean> => {
    try {
      await api.patch(`/empleados/${id}/toggle`, {});
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchEmployees]);

  // Change Employee Password
  const changeEmployeePassword = useCallback(async (id: string, nueva_password: string): Promise<boolean> => {
    try {
      await api.patch(`/empleados/${id}/password`, { nueva_password });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // ---- Lookup helpers ----

  const getProductById = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  const getProductByName = useCallback((name: string) => {
    return products.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  }, [products]);

  // ---- Initial data fetch when authenticated ----

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchSales(),
        fetchProductionLots(),
        fetchMachines(),
        fetchKpis(),
        fetchAlerts(),
        fetchClients(),
        fetchEmployees(),
        fetchRoles(),
      ]).finally(() => setLoading(false));
    } else {
      // Clear data on logout
      setProducts([]);
      setOrders([]);
      setSales([]);
      setProductionLots([]);
      setMachines([]);
      setEmployees([]);
      setRoles([]);
      setKpis(null);
      setAlerts([]);
      setClients([]);
    }
  }, [isAuthenticated, fetchProducts, fetchOrders, fetchSales, fetchProductionLots, fetchMachines, fetchKpis, fetchAlerts, fetchClients, fetchEmployees, fetchRoles]);

  return (
    <DataContext.Provider
      value={{
        products,
        orders,
        sales,
        productionLots,
        machines,
        employees,
        roles,
        rawMaterials,
        clients,
        kpis,
        alerts,
        loading,
        error,
        fetchProducts,
        fetchOrders,
        fetchSales,
        fetchProductionLots,
        fetchMachines,
        fetchEmployees,
        fetchRoles,
        fetchRawMaterials,
        fetchClients,
        fetchKpis,
        fetchAlerts,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        updateOrderComments,
        addSale,
        deleteSale,
        addMachine,
        updateMachine,
        deleteMachine,
        updateMachineStatus,
        createProductionLot,
        updateLotStatus,
        addClient,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addRole,
        updateRole,
        deleteRole,
        toggleEmployeeStatus,
        changeEmployeePassword,
        getProductById,
        getProductByName,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
