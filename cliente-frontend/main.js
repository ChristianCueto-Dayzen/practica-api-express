const API_URL = 'http://localhost:3000/api/alumnos';

async function obtenerAlumnos() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error('Error al obtener los alumnos:', err);
  }
}
async function buscarAlumno(id){
  try {
    const response = await fetch(`${API_URL}/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.result;
  } catch (err) {
    console.error('Error al buscar el alumno:', err);
  }
}

async function agregarAlumno(alumno) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alumno)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error al agregar el alumno:', err);
  }
}

async function actualizarAlumno(id, alumno) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alumno)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error al actualizar el alumno:', err);
  }
}

async function eliminarAlumno(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error al eliminar el alumno:', err);
  }
}

function renderizarTabla(alumnos) {
  const tbody = document.getElementById('alumnos-tbody');
  tbody.innerHTML = '';

  if (alumnos.length === 0) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 5;
    celda.className = 'vacio';
    celda.textContent = 'No se encontraron alumnos';
    fila.appendChild(celda);
    tbody.appendChild(fila);
    return;
  }

  alumnos.forEach((alumno) => {
    const fila = document.createElement('tr');

    [alumno.Student_Id, alumno.Name, alumno.Last_Name, alumno.Email].forEach((valor) => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    const acciones = document.createElement('td');
    acciones.className = 'acciones';

    const editarBtn = document.createElement('button');
    editarBtn.className = 'btn-secundario';
    editarBtn.textContent = 'Editar';
    editarBtn.addEventListener('click', () => prepararEdicion(alumno));

    const eliminarBtn = document.createElement('button');
    eliminarBtn.className = 'btn-peligro';
    eliminarBtn.textContent = 'Eliminar';
    eliminarBtn.addEventListener('click', () => manejarEliminar(alumno.Id));

    acciones.append(editarBtn, eliminarBtn);
    fila.appendChild(acciones);

    tbody.appendChild(fila);
  });
}

function extraerDatosGrafica(alumnos) {
  const conteo = {};

  alumnos.forEach((alumno) => {
    const dominio = alumno.Email && alumno.Email.includes('@')
      ? alumno.Email.split('@')[1].toLowerCase()
      : 'Sin email';

    conteo[dominio] = (conteo[dominio] || 0) + 1;
  });

  return {
    etiquetas: Object.keys(conteo),
    valores: Object.values(conteo)
  };
}

let grafica = null;

function renderizarGrafica(etiquetas, valores) {
  if (grafica) {
    grafica.data.labels = etiquetas;
    grafica.data.datasets[0].data = valores;
    grafica.update();
    return;
  }

  const canvas = document.getElementById('alumnos-chart');

  grafica = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Alumnos',
        data: valores,
        backgroundColor: '#2a78d6',
        borderRadius: 4,
        maxBarThickness: 48
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Alumnos por dominio de correo' }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

async function cargarTabla() {
  const alumnos = await obtenerAlumnos() || [];
  renderizarTabla(alumnos);

  const { etiquetas, valores } = extraerDatosGrafica(alumnos);
  renderizarGrafica(etiquetas, valores);
}

const form = document.getElementById('alumno-form');
const campoStudentId = document.getElementById('campo-studentid');
const campoName = document.getElementById('campo-name');
const campoLastName = document.getElementById('campo-lastname');
const campoEmail = document.getElementById('campo-email');
const guardarBtn = document.getElementById('guardar-btn');
const cancelarBtn = document.getElementById('cancelar-btn');
const buscarForm = document.getElementById('buscar-form');
const buscarId = document.getElementById('buscar-id');
const verTodosBtn = document.getElementById('ver-todos-btn');

let idEnEdicion = null;

function prepararEdicion(alumno) {
  idEnEdicion = alumno.Id;
  campoStudentId.value = alumno.Student_Id;
  campoName.value = alumno.Name;
  campoLastName.value = alumno.Last_Name;
  campoEmail.value = alumno.Email;
  guardarBtn.textContent = 'Guardar cambios';
  cancelarBtn.hidden = false;
}

function limpiarFormulario() {
  idEnEdicion = null;
  form.reset();
  guardarBtn.textContent = 'Agregar';
  cancelarBtn.hidden = true;
}

async function manejarEliminar(id) {
  if (!confirm('¿Eliminar este alumno?')) {
    return;
  }

  const resultado = await eliminarAlumno(id);

  if (!resultado) {
    alert('No se pudo eliminar el alumno');
    return;
  }

  if (idEnEdicion === id) {
    limpiarFormulario();
  }
  await cargarTabla();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const alumno = {
    name: campoName.value.trim(),
    lastname: campoLastName.value.trim(),
    email: campoEmail.value.trim(),
    studentid: campoStudentId.value.trim()
  };

  const resultado = idEnEdicion
    ? await actualizarAlumno(idEnEdicion, alumno)
    : await agregarAlumno(alumno);

  if (!resultado) {
    alert('No se pudo guardar el alumno');
    return;
  }

  limpiarFormulario();
  await cargarTabla();
});

cancelarBtn.addEventListener('click', limpiarFormulario);

buscarForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const alumno = await buscarAlumno(buscarId.value);
  renderizarTabla(alumno || []);
});

verTodosBtn.addEventListener('click', async () => {
  buscarForm.reset();
  await cargarTabla();
});

cargarTabla();
