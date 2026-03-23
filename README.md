# NetConnect App (Wifi2Go) 🚀

Sistema Gestionable de Renta de Internet a través de Portal Cautivo. Diseñado con una arquitectura moderna bajo Deno, React (Vite) y una base de datos SQLite embebida. Totalmente compatible con la arquitectura ARM64 (Apple Silicon y Raspberry Pi 5).

## 🌟 Características

- **Diseño Premium (Apple Glassmorphism)**: Interfaz de portal cautivo limpia, moderna y animada con Framer Motion.
- **Doble Puerto de Seguridad**:
  - `Puerto 80`: Portal cautivo público donde el cliente compra y visualiza el uso de su internet.
  - `Puerto 8080/8443`: Panel de administración estrictamente aislado por seguridad.
- **Back-end Rápido (Deno)**: Implementado bajo Deno JS, tipado estricto, interactuando con drivers nativos de SQLite (`jsr:@db/sqlite`).
- **Sistema Integrado de Pagos**: Webhooks de Stripe y PayPal.
- **Firewall Inteligente**: Mocks inofensivos (`console.log`) en modo desarrollo (macOS) y automatización real de `iptables` en producción (Linux / Raspberry Pi).
- **Despliegue Universal (Docker)**: Configuración lista para la compilación nativa en dispositivos ARM64.

## 🛠️ Tecnologías

- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Lucide React, React Router.
- **Backend**: Deno, SQLite, jose (Autenticación JWT).
- **Contenedores**: Docker y Docker Compose.

## ⚙️ Cómo Ejecutar en Local (Modo Apple Silicon / macOS)

**Opción 1: Desarrollo Activo con Hot Reloading**
1. Clona el repositorio y avanza al backend: 
   ```bash
   cd backend
   deno task db:setup # Inicializa SQLite y admin por defecto (admin / admin123)
   deno task start    # Corre en localhost:8000 (Público) y localhost:8443 (Admin)
   ```
2. Levanta el frontend en otra terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

**Opción 2: Producción / Test de Contenedores con Docker**
1. Asegúrate de tener Docker Desktop en ejecución.
2. Desde la raíz del monorepo ejecuta:
   ```bash
   docker compose up --build -d
   ```
3. Crea la base de datos dentro del entorno Docker:
   ```bash
   docker compose exec backend deno task db:setup
   ```
4. Accede al portal público en [http://localhost](http://localhost).
5. Accede al dashboard administrativo en [http://localhost:8080/admin/login](http://localhost:8080/admin/login).

## 🚀 Despliegue en Producción (Raspberry Pi 5)

La Raspberry Pi 5 actúa como un portal de captura que controla la red (e.g. con `hostapd` u otro asignador DHCP). Todo el tráfico http no autenticado debe redirigirse al puerto 80 (a través de IP Tables routing o un DNS override).

1. Instala Docker y Docker Compose en la Raspberry Pi.
2. Clona el repositorio y enciéndelo usando: `docker compose up -d`.
3. El `firewallService` del Backend detectará "Linux" y ejecutará sentencias reales de `sudo iptables` automáticamente cuando una conexión/pago sea confirmado.

## 🔐 Credenciales del Administrador de Pruebas
- **Usuario**: `admin`
- **Contraseña**: `admin123`

_(Recuerda integrar cifrado bcrypt y regenerar usuarios para despliegues reales de producción)_
