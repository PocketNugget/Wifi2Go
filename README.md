# NetConnect (Wifi2Go) 🌐

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Powered by Deno](https://img.shields.io/badge/Powered%20by-Deno-000000?style=for-the-badge&logo=deno)](https://deno.com)
[![Database: SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Containerized with Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Security First](https://img.shields.io/badge/Security-First-4CAF50?style=for-the-badge&logo=security)](#)

> Un sistema avanzado, rápido y totalmente gestionable de Renta de Internet a través de un Portal Cautivo. Creado con React, Deno puro (WASM SQLite) y una estética premium inspirada en Apple.

---

## 📋 Estado Actual: Fase 2 Completada (Portal Privado & Público Listos)
El proyecto cuenta con un backend consolidado nativamente en Deno que administra la arquitectura concurrente para tanto el Panel Administrativo (Puerto 8080) como el Portal Cautivo para Invitados (Puerto 80). Se ha incluido soporte de Autenticación cifrada en Dos Pasos (TOTP) al vuelo, Webhooks transaccionales y procesadores dinámicos de conexiones efímeras enganchadas simuladamente interactuando en las restricciones del Firewall perimetral. **Referirse a `DOCUMENTATION.md` y a `NEXT_STEPS.md` para ver el diseño técnico formal y el roadmap a futuro.**

---

## 🚀 ¿Qué es NetConnect (Wifi2Go)?

**NetConnect App** es una plataforma centralizada para gestionar accesos a red WiFi pública por demanda. Cuando los usuarios intentan navegar, el router los atrapa en un **Portal Cautivo**, pagan por tiempo (Stripe/PayPal), y un webhook libera su MAC e IP en el cortafuegos. Incluye un dashboard de administrador ultra-seguro, construido en una arquitectura aislada dentro de módulos Docker en ARM64 nativo.

---

## ✨ Key Features

- **UI Premium:** Diseño inspirado en Apple con animaciones fluidas (Framer Motion) y Glassmorphism
- **Portal Cautivo:** Flujo de intercepción, precios y cuenta regresiva de conexión dinámica
- **Demo Mode Global:** Alterna el flujo de pagos usando mocks nativos con un switch asíncrono
- **Admin Dashboard Seguro:** Monitoreo en tiempo real de logs de seguridad y dispositivos conectados
- **Motor de Red Nivel Servidor:** Daemon de Deno validando y autorizando accesos de iptables
- **JWT Autorización Encriptada:** Backend multi-puerto (8000 para APIs públicas, 8443 para Administración)
- **Despliegue Nativo ARM64:** Imágenes optimizadas en Docker, compatible para desarrollo en macOS Silicon y producción directa en Raspberry Pi 5

---

## 🛠️ Prerequisites

- **Docker** y **Docker Compose** (Opción recomendada para entorno 1:1)
- **Node.js** + **Deno** (Para desarrollo local manual del entorno)

---

## ⚡ Quickstart

### 1. Clonar el Repositorio

```bash
git clone https://github.com/PocketNugget/Wifi2Go.git
cd Wifi2Go
```

### 2. Configurar Claves Secretas

```bash
# Configura las llaves maestras y Webhooks (copia las plantillas)
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# IMPORTANTE: Reemplaza JWT_SECRET y la clave de acceso de administrador en Producción.
```

### 3. Arrancar con Docker (Recomendado)

```bash
docker-compose up --build -d
```

- **Portal Público (Cautivo):** http://localhost
- **Admin Dashboard:** http://localhost/admin  
  *(Autenticación por defecto: `admin` / `admin123`)*

### 4. Desarrollo Local Manual

**Backend:**
```bash
cd backend
deno task start
# O para inicializar la DB desde cero:
deno task db:setup
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Configuración y Seguridad 

### Cuentas de Acceso y Modo Demostración

- El usuario de administración por defecto se crea al encender el contenedor por primera vez.
- **Demo Mode**: Existe un botón de palanca ("Toggle") en el menú lateral del administrador para encender o apagar la integración con pasarelas de pago. Encíendelo para pruebas sin impacto en cajas de Stripe.

### Best Practices Incluidas

- **Logs de Auditoría Inmutables:** Los registros de *Spoofing* y los intentos de inicio de sesión se escriben de inmediato en la base de datos persistida.
- **Port Segregation:** La red bloquea completamente llamadas a la administración a menos que vengas de un origen seguro al puerto 8443.
- **Base de datos Nativa sin dependencias:** Integración completa de `node:sqlite` sin librerías dependientes de Node-Gyp, resolviendo cualquier conflicto cruzado entre Raspberry Pi, MacBooks o Ubuntu.
- **.gitignore**: Se ha asegurado para no exponer credenciales bajo ninguna circunstancia.

---

## 🐛 Troubleshooting

- **Error de Compilación ARM:** \`docker-compose.yml\` está adaptado para extraer siempre la imagen de tu plataforma (\`linux/arm64\` o \`linux/amd64\`). 
- **Verificación de Logs Docker:**
  ```bash
  docker compose logs backend --tail 50
  docker compose logs frontend
  ```

---

## License

MIT License
