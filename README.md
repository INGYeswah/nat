# 🌿 NatuDai ERP

> Sistema de Información Empresarial para la gestión integral de inventario, ventas, producción y personal de una empresa de cosméticos naturales.

**Universidad Nacional de Colombia · Sistemas de Información · Hito 2**

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-12.3-003545?style=flat&logo=mariadb&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/Licencia-MIT-green?style=flat)

---

## 📋 Descripción

**NatuDai** es una microempresa dedicada a la producción y comercialización de cosméticos naturales — bentonita, mascarillas y productos deshidratados de frutas. Este sistema ERP reemplaza la gestión manual y desarticulada que generaba cuellos de botella en la cadena de producción.

El sistema centraliza en una sola plataforma:

- Gestión de inventario de productos y materia prima, con alertas dinámicas de stock crítico
- Registro y seguimiento de ventas y pedidos
- Planificación de lotes de producción y trazabilidad por máquina
- Gestión de personal con control de acceso por roles (RBAC)
- Dashboard gerencial con KPIs financieros en tiempo real

---

## 🗂️ Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Dashboard** | Ingresos reales (solo ventas completadas), pedidos activos, alertas de stock |
| **Inventario** | CRUD de productos y materia prima. Alertas calculadas dinámicamente |
| **Ventas** | Registro de ventas y consulta de historial financiero |
| **Pedidos** | Seguimiento logístico: Pendiente → En proceso → Enviado → Completado |
| **Producción / Supply Chain** | Lotes de producción, máquinas y avance en tiempo real |
| **Personal** | CRUD de empleados, roles y permisos (RBAC) |

---

## 🧩 Arquitectura del Backend

El servidor está organizado de forma **modular** — cada módulo de negocio vive en su propio archivo de rutas, lo que facilita el trabajo en equipo sin conflictos de Git y mantiene el código mantenible a medida que el proyecto escala.

```
natudai-backend/
├── server.js                  # Solo arranca el servidor y monta las rutas
├── .env                        # Credenciales (no se sube a Git)
├── database/
│   └── schema.sql              # Definición completa de la base de datos
├── db/
│   └── pool.js                 # Conexión compartida (detecta local vs nube)
├── middleware/
│   ├── auth.js                 # Verificación de JWT
│   └── checkPermiso.js         # RBAC por permisos_json del rol
└── routes/
    ├── auth.routes.js          # Login, logout, perfil
    ├── productos.routes.js     # CRUD de inventario + materia prima
    ├── ventas.routes.js        # Registro y consulta de ventas
    ├── pedidos.routes.js       # CRUD de pedidos + cambio de estado
    ├── empleados.routes.js     # CRUD de personal + roles
    ├── produccion.routes.js    # Lotes de producción + máquinas
    └── dashboard.routes.js     # KPIs + alertas de stock
```

```
natudai-frontend/
├── src/
│   ├── App.jsx                 # Aplicación React (todos los módulos)
│   └── index.css               # @import "tailwindcss"
├── index.html
└── vite.config.js              # Incluye proxy hacia el backend
```

---

## 🔗 Mapa de endpoints

| Módulo | Método | Endpoint | Funcionalidad |
|---|---|---|---|
| Auth | POST | `/api/auth/login` | Iniciar sesión |
| Auth | POST | `/api/auth/logout` | Cerrar sesión |
| Auth | GET | `/api/auth/profile` | Perfil del usuario activo |
| Inventario | GET | `/api/productos` | Listar productos |
| Inventario | GET | `/api/productos/:id` | Obtener un producto |
| Inventario | POST | `/api/productos` | Crear producto |
| Inventario | PUT | `/api/productos/:id` | Actualizar producto |
| Inventario | DELETE | `/api/productos/:id` | Eliminar producto |
| Ventas | GET | `/api/ventas` | Listar ventas (solo completadas) |
| Ventas | GET | `/api/ventas/:id` | Obtener una venta |
| Ventas | POST | `/api/ventas` | Registrar venta (transacción ACID) |
| Ventas | DELETE | `/api/ventas/:id` | Eliminar venta |
| Pedidos | GET | `/api/pedidos` | Listar pedidos |
| Pedidos | GET | `/api/pedidos/:id` | Obtener un pedido |
| Pedidos | POST | `/api/pedidos` | Crear pedido |
| Pedidos | PUT | `/api/pedidos/:id` | Actualizar pedido |
| Pedidos | PATCH | `/api/pedidos/:id/status` | Cambiar estado del pedido |
| Personal | GET | `/api/empleados` | Listar empleados |
| Personal | GET | `/api/empleados/:id` | Obtener un empleado |
| Personal | POST | `/api/empleados` | Crear empleado |
| Personal | PUT | `/api/empleados/:id` | Actualizar empleado |
| Personal | DELETE | `/api/empleados/:id` | Desactivar empleado (soft delete) |
| Personal | GET | `/api/empleados/roles` | Listar roles disponibles |
| Producción | GET | `/api/produccion/lotes` | Listar lotes |
| Producción | POST | `/api/produccion/lotes` | Crear lote |
| Producción | PATCH | `/api/produccion/lotes/:id/status` | Cambiar estado del lote |
| Producción | GET | `/api/produccion/maquinas` | Listar máquinas |
| Dashboard | GET | `/api/dashboard/kpis` | Métricas principales |
| Dashboard | GET | `/api/alertas` | Productos en stock crítico |
| Dashboard | GET | `/api/alertas/:id` | Detalle de una alerta |

---

## ⚙️ Instalación

### Requisitos previos

- **Node.js 18+**
- **MariaDB / MySQL 8+** corriendo localmente (o una instancia en Railway)
- **npm**

---

### 1. Configurar la base de datos

```bash
mysql -u root -p -h 127.0.0.1 --port=3306 < natudai-backend/database/schema.sql
```

> El script incluye `DROP TABLE IF EXISTS` para cada tabla, por lo que puede ejecutarse varias veces sin generar conflictos. Las contraseñas de los usuarios de prueba ya vienen encriptadas con bcrypt — no se requiere ningún paso adicional de configuración.

---

### 2. Backend

```bash
cd natudai-backend
npm install express cors mysql2 bcryptjs jsonwebtoken dotenv
node server.js
```

Si todo está correcto verás:
```
=============================================================
🚀  NatuDai ERP activo en: http://localhost:3000
🛡️   RBAC por permisos_json · JWT 8h
=============================================================
```

---

### 3. Frontend

```bash
npm create vite@latest natudai-frontend -- --template react
cd natudai-frontend
npm install
npm install lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

Reemplaza el contenido de `src/index.css` con:
```css
@import "tailwindcss";
```

Inicia el frontend:
```bash
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**

---

### 4. Ejecutar ambos servidores con un solo comando (opcional)

En la carpeta raíz del proyecto:

```bash
npm install -D concurrently
npm run dev
```

Esto levanta backend y frontend simultáneamente en la misma terminal.

---

## 🔐 Credenciales de prueba

| Cédula | Contraseña | Rol | Módulos accesibles |
|---|---|---|---|
| `10102020` | `admin123` | Administrador | Todos |
| `20203030` | `supply123` | Supply Chain | Dashboard, Inventario, Ventas, Producción |

---

## 🔧 Variables de entorno

Crea un archivo `.env` en `natudai-backend/`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=natudai

JWT_SECRET=NatuDai_Super_Secret_Key_2026
PORT=3000
```


>crea un archivo .env en la carpeta raiz del proyecto 
>Agrega la contraseña de tu gestor de base de datos mySQL/MariaDB en el campo de password   
> ⚠️ Agrega `.env` a tu `.gitignore` antes de hacer cualquier commit.


---

## ☁️ Despliegue en la nube (opcional)

Por el momento el proyecto se mantiene **local** para facilitar el desarrollo iterativo y las pruebas sin depender de conexión a internet ni de credenciales compartidas entre el equipo. El backend ya está preparado para migrar a un servidor en la nube sin cambios adicionales de código.

Para escalarlo a [Railway](https://railway.app) (gratuito, con $5 USD de crédito mensual):

1. Crear un proyecto en Railway y aprovisionar una base de datos MySQL
2. Copiar las credenciales generadas (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`)
3. Cargar el schema: `mysql -h <host> -P <puerto> -u root -p railway < database/schema.sql`
4. Actualizar el `.env` con esas credenciales

El archivo `db/pool.js` detecta automáticamente si la conexión es local o remota y activa SSL cuando es necesario — no requiere ningún cambio adicional de código.

---

## 🛡️ Consideraciones de seguridad

- Las contraseñas se almacenan encriptadas con **bcrypt** (salt 10), nunca en texto plano.
- Todos los endpoints (excepto `/api/auth/login`) requieren un JWT válido en el header `Authorization: Bearer <token>`.
- El acceso a cada módulo se valida en el backend contra `permisos_json` del rol del usuario — el control de acceso no depende únicamente del frontend.
- La eliminación de empleados es un **soft delete** (`estado_activo = FALSE`) para preservar la trazabilidad de pedidos y lotes de producción ya asociados a ese usuario.
- El JWT expira en **8 horas**.

---

## 🧠 Decisiones de diseño relevantes

- **No existe una tabla de alertas.** El stock crítico se calcula dinámicamente comparando `stock_actual` contra `stock_minimo` en cada consulta, evitando redundancia y desincronización de datos.
- **No existe una tabla de ventas separada.** Una venta es un `PEDIDO` con estado `Completado` y su `DETALLE_PEDIDO` asociado — crear una tabla aparte duplicaría información con riesgo de inconsistencia.
- **Los ingresos del dashboard solo cuentan pedidos completados**, evitando que pedidos cancelados o pendientes infle artificialmente el reporte financiero.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React 18 + Vite | Framework frontend con HMR |
| Tailwind CSS v4 | Estilos utilitarios (sin `tailwind.config.js`) |
| lucide-react | Iconografía del sistema |
| Node.js + Express | API REST modular del backend |
| mysql2/promise | Driver asíncrono para MariaDB/MySQL |
| bcryptjs | Encriptación de contraseñas |
| jsonwebtoken | Autenticación stateless (JWT) |
| MariaDB | Base de datos relacional principal |

---

## 👥 Equipo de desarrollo

| Integrante | Rol |
|---|---|
| Nicolás Moreno Calderón | Diseño UX / Prototipo |
| Juan Diego Rodríguez Bello | Modelo entidad-relación / Base de datos |
| Arnold Oswaldo Acosta Ortega | Backend Node.js / Arquitectura API |
| Yoiner Romero Cabrera | Pruebas / Documentación |
| Yeswah González Tapia | Historias de usuario / Requerimientos/ Ensamble Backend-Frontend |

**Profesor:** Jhon Alexander Garcia Camargo — Sistemas de Información, UNAL

---

## 📄 Licencia

Distribuido bajo la licencia **MIT**.

---

<p align="center">
  Hecho con 🌿 por el equipo NatuDai · Universidad Nacional de Colombia · 2026
</p>
