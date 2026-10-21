const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const $ = id => document.getElementById(id);
let veterinarios = [];
let citaEnEdicion = null;

// ---------- Utilidades ----------
function mostrarAviso(texto, tipo) {
  const a = $('aviso');
  a.textContent = texto;
  a.className = tipo;
  a.hidden = false;
  setTimeout(() => { a.hidden = true; }, 6000);
}

async function api(ruta, opciones = {}) {
  const resp = await fetch('/api' + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': $('selUsuario').value || '',
      ...(opciones.headers || {})
    }
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(datos.error || 'Ocurrió un error.');
  return datos;
}

function opcion(valor, texto) {
  const o = document.createElement('option');
  o.value = valor;
  o.textContent = texto;
  return o;
}

function celda(texto) {
  const td = document.createElement('td');
  td.textContent = texto;
  return td;
}

function formatoFecha(texto) { // "2026-11-02 09:00:00" -> "02/11/2026 09:00"
  const [f, h] = texto.split(' ');
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y} ${h.slice(0, 5)}`;
}

// ---------- Pestañas ----------
function mostrarVista(vista) {
  $('vistaCitas').hidden = vista !== 'citas';
  $('vistaAgendar').hidden = vista !== 'agendar';
  $('tabCitas').classList.toggle('activo', vista === 'citas');
  $('tabAgendar').classList.toggle('activo', vista === 'agendar');
}

// ---------- Datos ----------
async function cargarUsuarios() {
  const usuarios = await fetch('/api/usuarios').then(r => r.json());
  const sel = $('selUsuario');
  sel.replaceChildren();
  usuarios.forEach(u => sel.appendChild(opcion(u.id_usuario, `${u.nombre} ${u.apellido} (${u.rol})`)));
  const guardado = localStorage.getItem('usuarioDemo');
  if (guardado && usuarios.some(u => String(u.id_usuario) === guardado)) sel.value = guardado;
}

async function cargarCitas() {
  const citas = await api('/citas');
  const tbody = $('tbodyCitas');
  tbody.replaceChildren();
  $('sinCitas').hidden = citas.length > 0;

  citas.forEach(c => {
    const tr = document.createElement('tr');
    tr.appendChild(celda(formatoFecha(c.fecha_hora)));
    tr.appendChild(celda(c.mascota));
    tr.appendChild(celda(`${c.vet_nombre} ${c.vet_apellido} (${c.especialidad})`));
    tr.appendChild(celda(c.motivo));

    const tdEstado = document.createElement('td');
    const span = document.createElement('span');
    span.className = 'estado ' + c.estado.replace(' ', '');
    span.textContent = c.estado;
    tdEstado.appendChild(span);
    tr.appendChild(tdEstado);

    const tdAcc = document.createElement('td');
    if (c.estado === 'Programada') {
      const bR = document.createElement('button');
      bR.textContent = 'Reprogramar';
      bR.onclick = () => { citaEnEdicion = c.id_cita; $('inpNuevaFecha').value = ''; $('dlgReprogramar').showModal(); };
      const bC = document.createElement('button');
      bC.textContent = 'Cancelar';
      bC.className = 'peligro';
      bC.onclick = () => cancelarCita(c.id_cita);
      tdAcc.append(bR, bC);
    }
    tr.appendChild(tdAcc);
    tbody.appendChild(tr);
  });
}

async function cargarFormulario() {
  const mascotas = await api('/mascotas');
  const sel = $('selMascota');
  sel.replaceChildren();
  mascotas.forEach(m => sel.appendChild(opcion(m.id_mascota, `${m.nombre} (${m.especie})`)));

  veterinarios = await api('/veterinarios');
  const selV = $('selVet');
  selV.replaceChildren();
  veterinarios.forEach(v => selV.appendChild(opcion(v.id_veterinario, `${v.nombre} ${v.apellido} - ${v.especialidad}`)));
  mostrarHorario();
}

function mostrarHorario() {
  const v = veterinarios.find(x => String(x.id_veterinario) === $('selVet').value);
  if (!v) { $('horarioVet').textContent = ''; return; }
  const porRango = {};
  v.horarios.forEach(h => {
    const rango = `${h.hora_inicio.slice(0, 5)}-${h.hora_fin.slice(0, 5)}`;
    (porRango[rango] = porRango[rango] || []).push(DIAS[h.dia_semana]);
  });
  $('horarioVet').textContent = 'Atiende: ' + Object.entries(porRango)
    .map(([rango, dias]) => `${dias.join(', ')} ${rango}`).join(' | ');
}

async function recargarTodo() {
  try {
    localStorage.setItem('usuarioDemo', $('selUsuario').value);
    await Promise.all([cargarCitas(), cargarFormulario()]);
  } catch (e) { mostrarAviso(e.message, 'error'); }
}

// ---------- Acciones ----------
async function agendar() {
  try {
    const r = await api('/citas', {
      method: 'POST',
      body: JSON.stringify({
        id_mascota: Number($('selMascota').value),
        id_veterinario: Number($('selVet').value),
        fecha_hora: $('inpFecha').value,
        motivo: $('inpMotivo').value
      })
    });
    mostrarAviso(r.mensaje, 'ok');
    $('inpMotivo').value = '';
    await cargarCitas();
    mostrarVista('citas');
  } catch (e) { mostrarAviso(e.message, 'error'); }
}

async function cancelarCita(id) {
  if (!confirm('¿Seguro que deseas cancelar esta cita?')) return;
  try {
    const r = await api(`/citas/${id}/cancelar`, { method: 'PUT' });
    mostrarAviso(r.mensaje, 'ok');
    await cargarCitas();
  } catch (e) { mostrarAviso(e.message, 'error'); }
}

async function reprogramar() {
  try {
    const r = await api(`/citas/${citaEnEdicion}/reprogramar`, {
      method: 'PUT',
      body: JSON.stringify({ fecha_hora: $('inpNuevaFecha').value })
    });
    $('dlgReprogramar').close();
    mostrarAviso(r.mensaje, 'ok');
    await cargarCitas();
  } catch (e) {
    $('dlgReprogramar').close();
    mostrarAviso(e.message, 'error');
  }
}

// ---------- Eventos ----------
$('tabCitas').onclick = () => mostrarVista('citas');
$('tabAgendar').onclick = () => mostrarVista('agendar');
$('selUsuario').onchange = recargarTodo;
$('selVet').onchange = mostrarHorario;
$('btnAgendar').onclick = agendar;
$('btnConfirmarRepro').onclick = reprogramar;
$('btnCerrarRepro').onclick = () => $('dlgReprogramar').close();

(async () => {
  try { await cargarUsuarios(); await recargarTodo(); }
  catch (e) { mostrarAviso('No se pudo conectar con el servidor. ¿Está encendido MySQL en XAMPP?', 'error'); }
})();
