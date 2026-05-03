# 🚀 Guía Interactiva para la Demostración en Vivo (Wifi2Go)

¡Bienvenidos a la demostración de **Wifi2Go**! Esta guía está diseñada paso a paso para que cualquiera pueda entender y probar cómo funciona nuestro sistema de Portal Cautivo para IoT, tanto desde la perspectiva de un usuario normal como desde la del administrador de la red.

---

## 🛠 Paso 1: Preparación del Entorno
Antes de empezar, asegúrate de que el sistema esté encendido.
Si el servidor no está corriendo, abre una terminal en esta carpeta y ejecuta:
```bash
docker compose up --build -d
```
¡Esto encenderá todos los motores de forma automática!

---

## 👨‍💻 Parte 1: La Experiencia del Usuario (El Cliente)

Vamos a simular que eres una persona en un aeropuerto o cafetería que intenta conectarse a internet por primera vez.

1. **Intenta acceder a internet sin permiso:**
   Abre tu navegador y entra exactamente a este enlace (simula que tu teléfono tiene la MAC address `DEMO123`):
   👉 [http://localhost:3000/?mac=DEMO123](http://localhost:3000/?mac=DEMO123)
   
   *💡 **¿Qué pasó?** ¡El sistema detectó que no tienes internet y te redirigió automáticamente a la página de bienvenida del Portal Cautivo!*

2. **Crea una cuenta:**
   - Haz clic en **"Get Connected"**.
   - En la pantalla de Login, haz clic abajo en **"Register now"**.
   - Ingresa un correo inventado (ej. `prueba@wifi.com`) y una contraseña (ej. `123456`).
   - El sistema te ofrecerá configurar seguridad 2FA (con QR), pero por ahora haz clic en **"Skip for now"** (Saltar por ahora).

3. **Compra tu pase de internet:**
   - Una vez registrado, serás llevado a la página de Precios ("Pricing").
   - Verás tres opciones. Haz clic en el botón **"Select Plan"** en la opción de **5 Min Trial** (Prueba gratuita).
   - Verás una bonita animación de pago exitoso. ¡Ya tienes internet!

4. **¡Comprueba que tienes internet!**
   Vuelve a intentar acceder al internet abriendo de nuevo este enlace exacto:
   👉 [http://localhost:3000/?mac=DEMO123](http://localhost:3000/?mac=DEMO123)
   
   *🎉 **Resultado:** ¡Deberías ver una pantalla negra muy visual que dice **"Welcome to the Internet"**! Ya no estás bloqueado.*

---

## 🕵️‍♂️ Parte 2: La Experiencia del Administrador (El Jefe)

Ahora vamos a ver qué está pasando detrás de escena. Tú eres el dueño de la red y quieres ver quién está conectado.

1. **Entra al Panel de Control:**
   Abre una nueva pestaña en tu navegador y entra a:
   👉 [http://localhost:8080/admin/login](http://localhost:8080/admin/login)

2. **Inicia Sesión:**
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
   - Haz clic en "Secure Login".

3. **Observa el Dashboard de Dispositivos (Active Devices):**
   - Mira los recuadros de arriba: Verás que **"Total Accounts"** y **"Active Sessions"** han aumentado en tiempo real gracias a lo que hiciste en el Paso 1.
   - Mira la tabla: Debería aparecer un dispositivo con la MAC `DEMO123`, su estado en verde (`active`), y el tiempo exacto que le queda antes de que se le corte el internet.

4. **El botón de Pánico (Revocar Acceso):**
   - Imagina que el usuario `DEMO123` se está portando mal.
   - En la tabla, haz clic en el botón rojo **"Revoke"** (Revocar) al lado de su dispositivo.
   - Confirma la acción en la ventana que aparece.
   
5. **Comprueba el baneo:**
   Vuelve a la pestaña donde tenías el internet funcionando (o entra de nuevo a `http://localhost:3000/?mac=DEMO123`).
   
   *🚫 **Resultado:** ¡El internet fue cortado inmediatamente y te devolvió a la pantalla de Login del portal cautivo!*

6. **Revisa la Auditoría (Security Logs):**
   - En el panel de administrador, ve al menú lateral izquierdo y haz clic en **"Security Logs"**.
   - Verás un registro completo e inalterable de todo lo que pasó: Tu inicio de sesión, cuando se le bloqueó el internet al principio, la creación del usuario, y la revocación manual que acabas de hacer.

---
*¡Felicidades! Has completado la demostración completa del flujo de red y pagos de Wifi2Go.*
