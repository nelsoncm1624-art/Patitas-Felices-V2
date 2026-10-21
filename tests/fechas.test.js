const test = require('node:test');
const assert = require('node:assert');
const { evaluarFecha } = require('../src/fechas');

// Luis: lunes a viernes 08:00-13:00
const horarios = [1, 2, 3, 4, 5].map(d => ({ dia_semana: d, hora_inicio: '08:00:00', hora_fin: '13:00:00' }));
const ahora = new Date(2026, 9, 20, 12, 0); // martes 20/10/2026

test('acepta una fecha futura dentro del horario', () => {
  const p = evaluarFecha('2026-11-02T09:00', horarios, ahora); // lunes
  assert.strictEqual(p.sql, '2026-11-02 09:00:00');
});

test('rechaza fechas pasadas', () => {
  assert.throws(() => evaluarFecha('2026-10-19T09:00', horarios, ahora), /pasada/);
});

test('rechaza un día sin atención (domingo)', () => {
  assert.throws(() => evaluarFecha('2026-11-01T09:00', horarios, ahora), /no atiende/);
});

test('rechaza horas fuera del rango', () => {
  assert.throws(() => evaluarFecha('2026-11-02T14:00', horarios, ahora), /no atiende/);
});

test('la última cita debe terminar antes del cierre (12:30 sí, 12:45 no)', () => {
  assert.ok(evaluarFecha('2026-11-02T12:30', horarios, ahora));
  assert.throws(() => evaluarFecha('2026-11-02T12:45', horarios, ahora), /no atiende/);
});

test('rechaza formatos inválidos', () => {
  assert.throws(() => evaluarFecha('mañana', horarios, ahora), /formato/);
});
