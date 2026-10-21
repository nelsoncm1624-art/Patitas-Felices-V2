const CitaError = require('./errors');

const DURACION_MIN = 30;

function aMinutos(hora) { // "08:30:00" -> 510
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function parseFecha(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(texto || '');
  if (!m) throw new CitaError('La fecha y hora no tienen un formato válido.', 400);
  const [, y, mo, d, h, mi] = m.map(Number);
  const fecha = new Date(y, mo - 1, d, h, mi);
  if (fecha.getFullYear() !== y || fecha.getMonth() !== mo - 1 || fecha.getDate() !== d) {
    throw new CitaError('La fecha indicada no existe.', 400);
  }
  return {
    fecha,
    sql: `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:00`,
    dia: fecha.getDay() || 7, // 1=Lunes ... 7=Domingo
    minutos: h * 60 + mi
  };
}

// Reglas: fecha futura + dentro del horario del veterinario
function evaluarFecha(texto, horarios, ahora = new Date()) {
  const p = parseFecha(texto);
  if (p.fecha <= ahora) {
    throw new CitaError('No se puede agendar ni reprogramar en una fecha u hora pasada.', 400);
  }
  const dentro = horarios.some(h =>
    h.dia_semana === p.dia &&
    p.minutos >= aMinutos(h.hora_inicio) &&
    p.minutos + DURACION_MIN <= aMinutos(h.hora_fin)
  );
  if (!dentro) {
    throw new CitaError('El veterinario no atiende en ese día u horario.', 400);
  }
  return p;
}

module.exports = { aMinutos, parseFecha, evaluarFecha, DURACION_MIN };
