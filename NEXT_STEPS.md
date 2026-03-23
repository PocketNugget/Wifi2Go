# Roadmap y Siguientes Pasos (Wifi2Go)

Actualmente, las prioridades arquitectónicas estipuladas en la *Fase 1 (Administración)* y la *Fase 2 (Autenticación Cautiva)* se encuentran 100% integradas y funcionales en entornos locales unificados (Mocking Flow Completo). 
Para llevar el proyecto a un nivel corporativo final y consolidarse como Producto de Producción en el ecosistema real (ej. Raspberry Pi 5 interactuando materialmente en comercios físicos), se recomienda encarar la **Fase 3**:

## 1. Integración de Pasarelas de Pago Reales
- **Stripe**: Sustituir definitivamente el engranaje Mock simulado presente dentro de `backend/routes/payments.ts` con la librería verificada `stripe.checkout.sessions.create()`. Será forzoso proveer la llave secreta verídica originada desde el panel administrativo virtual de la compañía registrando las variables de ambiente en el archivo `.env` de Producción.
- **PayPal** (Opcional Escalable): Incorporar el SDK verificado de *PayPal Orders V2* en una capa paralela para ofrecer multiplicidad de esquemas de pago.

## 2. Redirección Nativa de Red (Portal Cautivo Auténtico)
El hito definitivo implica obligar a los smartphones (iOS/Android) a forzar la apertura abrupta del popup del navegador nada más asimilen la conexión WiFi. Esto requiere Intercepciones Capa 7:
- Configurar **DNS Spoofing** en la maquina matriz (ej. usando herramientas open-source comprobadas globalmente como `dnsmasq`) para capturar y redirigir toda petición aleatoria pública (ej. las de telemetría de Google/Apple al conectar) hacia la pasarela hosteada en el Nginx residente del router (Puerto 80).
- Desplegar una cadena de Certificados SSL autofirmados localmente para despistar restricciones de HTTPS estrictas inherentes a los motores *WebKit/Chromium WebView* en las capas de captive portal detection mode.

## 3. Mejoras Modulares del Panel Administrativo Integrado
- **Paginación REST Limits**: Las estructuras primordiales de `Security Logs` y del repositorio persistente de UUID de `Users` pueden desbordar volumétricamente la tabla, impactando la agilidad visual de React State. Será menester implementar mecanismos API paginados estructuradamente (`limit/offset`) in Deno.
- **Visualización Analítica Real**: Actualmente los gráficos de Barras e Ingresos Netos emulados visualizan mock data. Alterar react-recharts para consumir los históricos reales procedentes de la tabla `payments`.

## 4. Ejecución del Sandbox Firewall en Host Linux (Raspberry Pi)
- El daemon `firewall.ts` actualmente emite sintaxis `iptables/ipset` en el kernel. Para evitar colapsos silenciados de escalada en un hardware final, existen dos abordajes:
  a. Integrar permisos masivos a Deno dándole exenciones controladas en `visudo` para no pedir password cuando gatille bash scripts de redes.
  b. Inicializar los contenedores de Docker inyectándoles la Capability absoluta de Redes `CAP_NET_ADMIN` y conectándolos en la red global primaria (`network_mode: host`) garantizando manipulación universal y sin ataduras a interfaces de Linux (`wlan0`/`eth0`).

## 5. Hardening General Definitivo
- Instanciar Hashing Completo Cryptográfico usando una librería sólida externa (`Argon2`) para la solidificación perpetua de Base de Datos en lugar de firmas superficiales concatenadas temporalmente probadas en el mock (`password_hash`).
