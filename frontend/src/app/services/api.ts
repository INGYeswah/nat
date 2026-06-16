// ============================================================================
// NatuDai ERP — Capa de servicio API
// Wrapper de fetch con JWT automático, manejo de errores y base URL
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ---- Token helpers ----

export function getToken(): string | null {
  return localStorage.getItem('natudai_token');
}

export function setToken(token: string): void {
  localStorage.setItem('natudai_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('natudai_token');
  localStorage.removeItem('natudai_user');
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem('natudai_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: any): void {
  localStorage.setItem('natudai_user', JSON.stringify(user));
}

// ---- Fetch wrapper ----

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Auto-attach JWT
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 — token expired or invalid
  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
  }

  // Handle other errors
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Error ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ---- Convenience methods ----

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// ---- API type definitions ----

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: {
    nombre: string;
    rol: string;
    permisos: string[];
  };
}

export interface UserProfile {
  id_usuario: string;
  nombre_completo: string;
  cedula: string;
  email: string;
  rol: string;
  permisos: string[];
}

export interface ProductoAPI {
  id_producto: string;
  nombre_producto: string;
  descripcion: string;
  stock_actual: number;
  stock_minimo: number;
  precio_venta: number;
  unidad_medida: string;
}

export interface MateriaPrimaAPI {
  id_mp: string;
  id_proveedor: string;
  nombre_mp: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  unidad_medida: string;
  proveedor?: string;
}

export interface PedidoAPI {
  id_pedido: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  total_pagar: number;
  estado: string;
  fecha_orden: string;
  comentarios: string | null;
}

export interface VentaAPI {
  id_pedido: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  total_pagar: number;
  estado_pedido: string;
  fecha_orden: string;
}

export interface LoteAPI {
  id_lote: string;
  cantidad_esperada: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado_lote: string;
  maquina: string;
  nombre_producto: string;
  operario: string;
  progreso: number;
}

export interface MaquinaAPI {
  id_maquina: string;
  nombre_maquina: string;
  descripcion: string | null;
  estado_actual: string;
  capacidad_por_turno: number | null;
  tiempo_por_unidad_min: number | null;
}

export interface EmpleadoAPI {
  id_usuario: string;
  cedula: string;
  nombre_completo: string;
  email: string;
  estado_activo: number;
  id_rol: number;
  nombre_rol: string;
  estado: string;
}

export interface RolAPI {
  id_rol: number;
  nombre_rol: string;
  permisos_json?: string | string[];
}

export interface ClienteAPI {
  id_cliente: string;
  nombre: string;
  cedula: string | null;
  tipo_cliente: string;
  nit: string | null;
  email: string | null;
  nivel_partner: string;
}

export interface KpiResponse {
  stock_critico: number;
  ingresos_totales: number;
  pedidos_activos: number;
  lotes_activos: number;
  empleados_activos: number;
}

export interface AlertaAPI {
  id_producto: string;
  nombre_producto: string;
  stock_actual: number;
  stock_minimo: number;
  unidades_faltantes: number;
}
