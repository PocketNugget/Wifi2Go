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
### Modo Simulacro (Free Trial & Mock Testing)
Cuando un cliente aprueba un plan gratuito (o el entorno interno está marcado explícitamente para pruebas), la UI despacha una confirmación directa a `/api/payments/webhook`.
1. Deno registra de inmediato un pago simulado bajo el label `completed`.
2. Intercepta la dirección MAC local y los `durationMinutes`, inyectando una sesión activa a la Base de Datos.
3. El módulo aislante `firewall.ts` ejecuta scripts `iptables` reales en maquinas Linux (o logs condicionales perimetrales si se desarrolla en macOS) mandando un axioma de ACEPTAR flujo para esa MAC específica por el transcurso de tiempo delimitado.

### Modo Producción (Checkout Oficial)
1. Al cliquear tarjetas de cobro real ($2 o $8), la app interrumpe flujos locales y solicita un handshake contra `/api/payments/checkout`.
2. Deno inicializa una sesión aislada de **Stripe** de forma segura inyectando el PriceID y devuelve la URL remota encriptada.
3. El cliente es redirigido a poner su tarjeta bajo infraestructuras PCI Compliance externas. Una vez exitoso el escrutinio financiero, Stripe hace POST a nuestro endpoint `/api/payments/stripe-webhook` autorizando silenciosamente la MAC en el firewall.

## 5. Criterios de Interfaz Urbana
El frontend abraza ciegamente normas estrictas de diseño vanguardista inspiradas al ecosistema Apple. Emplea nativamente la manipulación de árboles físicos (DOM) a través de `framer-motion` para propiciar curvas suaves y transiciones continuas. Los módulos abstractos se difuminan con clases generadas por `TailwindCSS` emulando trasfondos de cristal y nitidez fotográfica (`glassmorphism`, `backdrop-blur`).
