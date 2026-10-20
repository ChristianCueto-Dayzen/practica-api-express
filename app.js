const express = require('express');
const db = require('./database/db.js');
const cors = require('cors');
const multer = require('multer');
const path = require('path');


//guardar en uploads con la fecha como prefijo para evitar duplicados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

//storage indica el nombre y la ruta
//fileFilter indica que solo se aceptan archivos .json y .csv
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (extension !== '.json' && extension !== '.csv') {
      return cb(new Error('Solo se permiten archivos .json o .csv'));
    }
    cb(null, true);
  }
});

const app = express();
app.use(express.json());
app.use(cors());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/api/alumnos', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM alumnos');

    return res.status(200).json({
      message: 'Consulta exitosa',
      results
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error al consultar'
    });
  }
});

app.get('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('SELECT * FROM alumnos WHERE id= ?', [id]);

    if (result.length === 0) {
      return res.status(404).json({
        message: 'Alumno no encontrado'
      });
    }

    return res.status(200).json({
      message: 'Consulta exitosa',
      result
    });

  } catch (err) {
    return res.status(500).json({
      message: 'Error al consultar'
    });
  }
});

app.post('/api/alumnos', async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'Bad Request: No se proporcionó un alumno válido' });
  }
  const alumno = req.body;
  try {

    const [result] = await db.query("INSERT INTO alumnos (Name, Last_Name, Email, Student_Id) VALUES (?,?,?,?)",
      [alumno.name, alumno.lastname, alumno.email, alumno.studentid]);

    if (result.affectedRows === 0) {
      return res.status(500).json({
        message: 'No se pudo insertar'
      });
    }
    res.status(201).json({ message: 'Creado de forma exitosa', });
  } catch (err) {
    return res.status(500).json({
      message: 'Error al consultar'
    });
  }
});

app.put('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  const alumno = req.body;
  try {
    const [result] = await db.query('UPDATE alumnos SET Name = ?, Last_Name = ?, Email = ?, Student_Id = ? WHERE id = ?',
       [alumno.name, alumno.lastname, alumno.email, alumno.studentid, id]);
    if (result.affectedRows===0){
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    return res.status(200).json({ message: 'Alumno actualizado' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al editar'
    });
  }
});

app.delete('/api/alumnos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM alumnos WHERE id= ? ', [id]);
    if(result.affectedRows===0){
      return res.status(404).json({
      message: 'No se encontró al alumno'
      });
    }
    return res.status(200).json({
      message: 'Eliminado con éxito'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al eliminar'
    });
  }
});

app.post('/api/alumnos/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo en el campo "archivo"' });
  }

  return res.status(200).json({
    message: 'Archivo recibido',
    archivo: req.file.filename
  });
});

// Middleware para manejar errores de multer y errores personalizados
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Solo se permiten archivos .json o .csv') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});
