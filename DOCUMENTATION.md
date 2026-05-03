# NetConnect App (Wifi2Go) - Documentación Técnica Completa

## 1. Arquitectura del Sistema
El proyecto está dividido en un monolito modular usando contenedores Docker.
- **Frontend (Nginx + React + Vite)**: Un solo bundle estático que sirve tanto el portal cautivo público (Puerto 80) como el panel de administración (Puerto 8080). Nginx se encarga de separar el tráfico y enrutar las peticiones al backend correspondiente.
- **Backend (Deno + SQLite)**: Una API RESTful pura sin frameworks pesados, optimizada para rendimiento y compatibilidad ARM64 nativa. Levanta dos servidores HTTP de forma simultanea:
  - `Puerto 8000`: API Pública (Registro, Login de clientes, Webhooks de pago).
  - `Puerto 8443`: API Administrativa (Gestión CRUD, Seguridad y Dashboard).

## 2. Modelos de Base de Datos (SQLite)
La persistencia de datos ocurre en `./db_data/wifi2go.db`, soportando llaves foráneas y consistencia estricta en un sistema de archivos persistido por volúmenes de Docker.
- `admins`: Usuarios administrativos del dashboard con control total.
- `clients`: Clientes públicos del portal cautivo. Almacenan su `two_factor_secret` para validaciones TOTP.
- `devices`: Dispositivos (Direcciones MAC) mapeados al `client_id` propietario. Actúa como base innegable para conceder o denegar internet.
- `sessions`: Tiempos comprados o canjeados por el cliente. Indica `start_time` y `end_time`.
- `payments`: Transacciones históricas con su `provider` (mock, stripe, paypal).
- `security_logs`: Auditoría inmutable de eventos del sistema (login fallidos, activaciones de red, mitigaciones).

## 3. Lógica de Seguridad y Autenticación
### Admin Auth
- Basada puramente en JWT (JSON Web Tokens) asimétricos o simétricos. Una vez validada la contraseña con cifrado, Deno devuelve un Bearer Token persistente.
- Todas las rutas `/admin-api/*` están protegidas por middleware manual que inspecciona y desencripta pasivamente el Bearer Token.

### Client Auth (Portal Cautivo)
- Registro directo con generación de semilla TOTP (App Authenticator) compatible genéricamente con Auth, utilizando `npm:otpauth`.
- Inicio de sesión en **Dos Fases**: Validación primaria de la clave y posterior ingreso imperativo del código 6-dígitos en vivo (si el usuario así lo aprobase o forzase). Una vez validado el 2FA de manera positiva, se entrega el JWT para proceder a la página de compra.

## 4. Flujo del Portal Cautivo y Webhooks
## 4. Flujo del Portal Cautivo, Pagos y Simulación
### Simulación de Internet (Puerto 3000)
Para fines de demostración en vivo (Live Demo) sin requerir configuraciones complejas de enrutamiento y DNS, el sistema incluye un **Servidor de Internet Simulado** corriendo en el Puerto 3000. 
1. Cuando un usuario navega a `http://localhost:3000/?mac=...`, el servidor consulta la base de datos `sessions`.
2. Si no hay pago activo, intercepta la petición, redirecciona al Portal Cautivo (Puerto 80) y registra un evento `internet_blocked` en los logs de seguridad.
3. Si existe un pago activo, muestra una página de acceso exitoso ("Welcome to the Internet") y registra `internet_access`.

### Modo Producción (Stripe & PayPal)
1. El backend expone un catálogo de precios cerrado (`PLANS`), asegurando que ningún cliente pueda alterar el precio desde el Frontend.
2. **Stripe**: Al seleccionar pago con tarjeta, se crea un `Checkout Session` seguro inyectando la MAC del cliente en la `metadata`. El cliente paga en la página alojada por Stripe, y luego un Webhook (`/api/payments/stripe-webhook`) protegido criptográficamente con firmas (`STRIPE_WEBHOOK_SECRET`) autoriza la conexión en la base de datos y firewall.
3. **PayPal**: Se utiliza el SDK oficial para crear y capturar órdenes servidor-a-servidor (`/api/payments/paypal/create-order` y `/api/payments/paypal/capture-order`). El acceso se concede sincrónicamente al confirmar los fondos.
4. Una vez procesado cualquier pago, el cliente es redirigido a `/payment-success` y el servidor aprovisiona las reglas de `iptables` reales (o registra el evento en macOS).

## 5. Criterios de Interfaz Urbana
El frontend abraza ciegamente normas estrictas de diseño vanguardista inspiradas al ecosistema Apple. Emplea nativamente la manipulación de árboles físicos (DOM) a través de `framer-motion` para propiciar curvas suaves y transiciones continuas. Los módulos abstractos se difuminan con clases generadas por `TailwindCSS` emulando trasfondos de cristal y nitidez fotográfica (`glassmorphism`, `backdrop-blur`).
