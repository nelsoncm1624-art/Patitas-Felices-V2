const pool = require('./db');
const CitaError = require('./errors');

const { evaluarFecha, aMinutos, DURACION_MIN } = require('./fechas');

// ---------- Utilidades de base de datos ----------
const esAdmin = u => u.rol === 'Administrador';

async function bloquearVeterinario(conn, idVet) {
  const [r] = await conn.query(
    'SELECT id_veterinario FROM veterinario WHERE id_veterinario = ? FOR UPDATE', [idVet]);
  if (!r.length) throw new CitaError('El veterinario no existe.', 404);
}

async function horariosDe(conn, idVet) {
  const [h] = await conn.query(
    'SELECT dia_semana, hora_inicio, hora_fin FROM horario_veterinario WHERE id_veterinario = ?', [idVet]);
  return h;
}

async function verificarTraslape(conn, idVet, fechaSql, idCitaIgnorada) {
  const [r] = await conn.query(
    `SELECT id_cita FROM cita
     WHERE id_veterinario = ? AND estado <> 'Cancelada' AND id_cita <> ?
       AND ABS(TIMESTAMPDIFF(SECOND, fecha_hora, ?)) < ?`,
    [idVet, idCitaIgnorada || 0, fechaSql, DURACION_MIN * 60]);
  if (r.length) {
    throw new CitaError('El veterinario ya tiene una cita en ese horario (cada cita dura 30 minutos).', 409);
  }
}

async function conTransaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function obtenerCitaConDueno(conn, idCita) {
  const [r] = await conn.query(
    `SELECT c.*, m.id_usuario AS id_dueno
     FROM cita c JOIN mascota m ON m.id_mascota = c.id_mascota
     WHERE c.id_cita = ? FOR UPDATE`, [idCita]);
  if (!r.length) throw new CitaError('La cita no existe.', 404);
  return r[0];
}

function verificarPertenencia(usuario, idDueno) {
  if (esAdmin(usuario)) return;
  if (usuario.rol === 'Dueño de mascota' && usuario.id_usuario === idDueno) return;
  throw new CitaError('Solo puedes operar sobre tus propias mascotas y citas.', 403);
}

// ---------- Casos de uso ----------
async function agendar(usuario, { id_mascota, id_veterinario, fecha_hora, motivo }) {
  if (!id_mascota || !id_veterinario || !fecha_hora || !motivo || !String(motivo).trim()) {
    throw new CitaError('Completa mascota, veterinario, fecha y hora, y motivo.', 400);
  }
  return conTransaccion(async conn => {
    const [m] = await conn.query('SELECT id_usuario FROM mascota WHERE id_mascota = ?', [id_mascota]);
    if (!m.length) throw new CitaError('La mascota no existe.', 404);
    verificarPertenencia(usuario, m[0].id_usuario);

    await bloquearVeterinario(conn, id_veterinario);
    const p = evaluarFecha(fecha_hora, await horariosDe(conn, id_veterinario));
    await verificarTraslape(conn, id_veterinario, p.sql, null);

    const [r] = await conn.query(
      'INSERT INTO cita (id_mascota, id_veterinario, fecha_hora, motivo) VALUES (?, ?, ?, ?)',
      [id_mascota, id_veterinario, p.sql, String(motivo).trim()]);
    return { id_cita: r.insertId };
  });
}

async function reprogramar(usuario, idCita, fecha_hora) {
  if (!fecha_hora) throw new CitaError('Indica la nueva fecha y hora.', 400);
  return conTransaccion(async conn => {
    const cita = await obtenerCitaConDueno(conn, idCita);
    verificarPertenencia(usuario, cita.id_dueno);
    if (cita.estado !== 'Programada') {
      throw new CitaError(`No se puede reprogramar una cita en estado "${cita.estado}".`, 409);
    }
    await bloquearVeterinario(conn, cita.id_veterinario);
    const p = evaluarFecha(fecha_hora, await horariosDe(conn, cita.id_veterinario));
    await verificarTraslape(conn, cita.id_veterinario, p.sql, cita.id_cita);

    await conn.query('UPDATE cita SET fecha_hora = ? WHERE id_cita = ?', [p.sql, cita.id_cita]);
    return { id_cita: cita.id_cita };
  });
}

async function cancelar(usuario, idCita) {
  return conTransaccion(async conn => {
    const cita = await obtenerCitaConDueno(conn, idCita);
    verificarPertenencia(usuario, cita.id_dueno);
    if (cita.estado === 'Atendida' || cita.estado === 'Cancelada') {
      throw new CitaError(`No se puede cancelar una cita ${cita.estado.toLowerCase()}.`, 409);
    }
    await conn.query("UPDATE cita SET estado = 'Cancelada' WHERE id_cita = ?", [cita.id_cita]);
    return { id_cita: cita.id_cita };
  });
}

async function listarCitas(usuario) {
  let filtro = '';
  let params = [];
  if (usuario.rol === 'Dueño de mascota') { filtro = 'WHERE m.id_usuario = ?'; params = [usuario.id_usuario]; }
  else if (usuario.rol === 'Veterinario') { filtro = 'WHERE v.id_usuario = ?'; params = [usuario.id_usuario]; }
  const [rows] = await pool.query(
    `SELECT c.id_cita, c.fecha_hora, c.motivo, c.estado,
            m.nombre AS mascota, vu.nombre AS vet_nombre, vu.apellido AS vet_apellido,
            e.nombre AS especialidad
     FROM cita c
     JOIN mascota m ON m.id_mascota = c.id_mascota
     JOIN veterinario v ON v.id_veterinario = c.id_veterinario
     JOIN usuario vu ON vu.id_usuario = v.id_usuario
     JOIN especialidad e ON e.id_especialidad = v.id_especialidad
     ${filtro}
     ORDER BY c.fecha_hora DESC`, params);
  return rows;
}

async function listarMascotas(usuario) {
  if (esAdmin(usuario)) {
    const [r] = await pool.query('SELECT id_mascota, nombre, especie, raza FROM mascota ORDER BY nombre');
    return r;
  }
  const [r] = await pool.query(
    'SELECT id_mascota, nombre, especie, raza FROM mascota WHERE id_usuario = ? ORDER BY nombre',
    [usuario.id_usuario]);
  return r;
}

async function listarVeterinarios() {
  const [vets] = await pool.query(
    `SELECT v.id_veterinario, u.nombre, u.apellido, e.nombre AS especialidad
     FROM veterinario v
     JOIN usuario u ON u.id_usuario = v.id_usuario
     JOIN especialidad e ON e.id_especialidad = v.id_especialidad
     ORDER BY u.apellido`);
  const [horarios] = await pool.query(
    `SELECT id_veterinario, dia_semana, hora_inicio, hora_fin
     FROM horario_veterinario ORDER BY dia_semana`);
  return vets.map(v => ({ ...v, horarios: horarios.filter(h => h.id_veterinario === v.id_veterinario) }));
}

module.exports = {
  agendar, reprogramar, cancelar, listarCitas, listarMascotas, listarVeterinarios,
  evaluarFecha, aMinutos, DURACION_MIN
};
