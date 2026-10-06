const express = require('express');
const { alumnos, Alumno } = require('./alumno.js');



const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/api/alumnos', (req, res) => {
  res.json({ message: 'Lista de alumnos', alumnos });
});

app.get('/api/alumnos/:id', (req, res) => {
  const { id } = req.params;
  const alumno = alumnos.find(a => a.id === parseInt(id));
  if (!alumno) {
    return res.status(404).json({ message: 'Alumno no encontrado' });
  }
  res.json({ message: 'Alumno encontrado', alumno });
});

app.post('/api/alumnos', (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'Bad Request: No se proporcionó un alumno válido' });
  }
  const alumno = req.body;
  let id = 0;
  if (alumnos.length === 0) { // si no hay alumnos, asignar id 1
    id = 1;
  } else{
    id = Math.max(...alumnos.map(a => a.id)) + 1; // asignar el siguiente id disponible
  }
  alumnos.push(new Alumno(id, alumno.nombre, alumno.apellido, alumno.email, alumno.matricula)); //agregar el nuevo a.
  res.status(201).json({ message: '201 CREATED', alumno });
});

app.put('/api/alumnos/:id', (req, res) => {
  const { id } = req.params;
  const alumnoAActualizar = req.body;
  const index = alumnos.findIndex(a => a.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ message: 'Alumno no encontrado' });
  }
  alumnos[index] = { ...alumnos[index], ...alumnoAActualizar };

  res.json({ message: `200 OK`, alumnoActualizado: alumnos[index] });
});

app.delete('/api/alumnos/:id', (req, res) => {
  const { id } = req.params;
  const index = alumnos.findIndex(a => a.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ message: 'Alumno no encontrado' });
  }
  alumnos.splice(index, 1);
  res.json({ message: `200 OK`, id });
});