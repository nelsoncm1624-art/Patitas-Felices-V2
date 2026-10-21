const express = require('express');
const pool = require('./db');
const CitaError = require('./errors');
const servicio = require('./citaService');

const router = express.Router();
const asyncH = fn => (req, res, next) => fn(req, res).catch(next);

// ---- Selector de usuario para la DEMO (sustituye al login real por ahora) ----
router.get('/usuarios', asyncH(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.apellido, r.nombre AS rol
     FROM usuario u JOIN rol r ON r.id_rol = u.id_rol ORDER BY r.id_rol, u.nombre`);
  res.json(rows);
}));

// ---- Identifica al usuario por la cabecera x-user-id ----
router.use(async (req, res, next) => {
  try {
    const id = Number(req.header('x-user-id'));
    if (!id) throw new CitaError('Selecciona un usuario para continuar.', 401);
    const [r] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.apellido, r.nombre AS rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.id_usuario = ?`, [id]);
    if (!r.length) throw new CitaError('Usuario no válido.', 401);
    req.usuario = r[0];
    next();
  } catch (e) { next(e); }
});

router.get('/mascotas', asyncH(async (req, res) => res.json(await servicio.listarMascotas(req.usuario))));
router.get('/veterinarios', asyncH(async (req, res) => res.json(await servicio.listarVeterinarios())));
router.get('/citas', asyncH(async (req, res) => res.json(await servicio.listarCitas(req.usuario))));

router.post('/citas', asyncH(async (req, res) => {
  const r = await servicio.agendar(req.usuario, req.body);
  res.status(201).json({ mensaje: 'Cita agendada correctamente.', ...r });
}));

router.put('/citas/:id/reprogramar', asyncH(async (req, res) => {
  await servicio.reprogramar(req.usuario, Number(req.params.id), req.body.fecha_hora);
  res.json({ mensaje: 'Cita reprogramada correctamente.' });
}));

router.put('/citas/:id/cancelar', asyncH(async (req, res) => {
  await servicio.cancelar(req.usuario, Number(req.params.id));
  res.json({ mensaje: 'Cita cancelada correctamente.' });
}));

module.exports = router;
