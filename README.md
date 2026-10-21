# Patitas Felices - Agendamiento de citas

Node.js + Express + MySQL (XAMPP). Frontend simple en HTML, CSS y JavaScript.

## Cómo ejecutarlo

1. Instala **Node.js (LTS)** desde nodejs.org si aún no lo tienes.
2. Abre **XAMPP** y pulsa *Start* solo en **MySQL** (Apache no hace falta).
3. Abre `http://localhost/phpmyadmin` → pestaña **Importar** y carga, en este orden:
   - `database/schema.sql`
   - `database/seed_datos_prueba.sql`
4. En VS Code: *File → Open Folder* y elige esta carpeta `patitas-felices`.
5. Abre la terminal (Ctrl + ñ) y ejecuta:
   ```
   npm install
   npm start
   ```
6. Entra a **http://localhost:3000**.

El archivo `.env` ya viene con los valores de XAMPP (usuario `root`, sin contraseña). Si tu MySQL tiene contraseña, cámbiala ahí.

## Qué hace

- **Mis citas**: lista las citas del usuario, con botones para reprogramar y cancelar.
- **Agendar cita**: elige mascota, veterinario, fecha/hora y motivo.
- Reglas validadas en el servidor: fecha futura, dentro del horario del veterinario, sin traslape (citas de 30 min), cancelación solo si no está Atendida/Cancelada, reprogramación con las mismas reglas y pertenencia (cada dueño solo opera sobre lo suyo).
- Para probar usa el selector de usuario de arriba: Pedro y María son dueños, Ana es administradora, Luis y Carla son veterinarios (solo ven sus citas).

## Pruebas

```
npm test
```

## Estructura

- `public/` interfaz (HTML, CSS, JS) — aquí cambias el diseño cuando quieras.
- `src/` lógica (`citaService.js`, `fechas.js`), conexión MySQL (`db.js`) y rutas (`citasRoutes.js`).
- `database/` scripts SQL.
- `tests/` pruebas automatizadas.
- `evidencias/` capturas de pantalla para el documento.
- `server.js` arranque del servidor.

## Nota

El selector de usuario reemplaza al login real (es solo para la demo). Cuando agreguen inicio de sesión, solo hay que cambiar el bloque que identifica al usuario en `src/citasRoutes.js`.
