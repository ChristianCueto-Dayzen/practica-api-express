const express = require('express');
const db = require('./database/db.js');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');


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

// Error que se responde al cliente con 400 porque el problema está en el archivo
class ArchivoInvalidoError extends Error {}

// Algunos editores (como Excel) agregan un BOM al inicio del archivo
function quitarBOM(texto) {
  return texto.replace(/^\uFEFF/, '');
}

async function leerJSON(ruta) {
  const contenido = await fs.promises.readFile(ruta, 'utf8');

  let datos;
  try {
    datos = JSON.parse(quitarBOM(contenido));
  } catch (err) {
    throw new ArchivoInvalidoError('El archivo JSON no tiene un formato válido');
  }

  if (!Array.isArray(datos)) {
    throw new ArchivoInvalidoError('El archivo JSON debe contener un arreglo de alumnos');
  }
  return datos;
}

function leerCSV(ruta) {
  return new Promise((resolve, reject) => {
    const filas = [];

    fs.createReadStream(ruta)
      .pipe(csv({ mapHeaders: ({ header }) => quitarBOM(header).trim() }))
      .on('data', (fila) => filas.push(fila))
      .on('end', () => resolve(filas))
      .on('error', reject);
  });
}

// Convierte cada registro al orden de columnas del INSERT y valida los campos obligatorios
function prepararFilas(alumnos) {
  return alumnos.map((alumno, i) => {
    const limpiar = (valor) => (valor === undefined || valor === null || String(valor).trim() === '')
      ? null
      : String(valor).trim();

    const fila = [
      limpiar(alumno.name),
      limpiar(alumno.lastname),
      limpiar(alumno.email),
      limpiar(alumno.studentid)
    ];

    if (!fila[0] || !fila[3]) {
      throw new ArchivoInvalidoError(`Registro ${i + 1}: "name" y "studentid" son obligatorios`);
    }
    return fila;
  });
}

// Inserta todos los registros en una sola transacción: o entran todos o ninguno
async function insertarAlumnos(filas) {
  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();
    const [result] = await conexion.query(
      'INSERT INTO alumnos (Name, Last_Name, Email, Student_Id) VALUES ?',
      [filas]
    );
    await conexion.commit();
    return result.affectedRows;
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}

app.post('/api/alumnos/upload', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo en el campo "archivo"' });
  }

  const ruta = req.file.path;
  const extension = path.extname(req.file.originalname).toLowerCase();

  try {
    const alumnos = extension === '.json'
      ? await leerJSON(ruta)
      : await leerCSV(ruta);

    if (alumnos.length === 0) {
      return res.status(400).json({ message: 'El archivo no contiene registros' });
    }

    const filas = prepararFilas(alumnos);
    const insertados = await insertarAlumnos(filas);

    return res.status(200).json({
      message: 'Importación exitosa',
      insertados
    });
  } catch (err) {
    if (err instanceof ArchivoInvalidoError) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error al importar los alumnos' });
  } finally {
    // El archivo temporal ya se procesó (con o sin éxito), así que se elimina de uploads
    try {
      fs.unlinkSync(ruta);
    } catch (err) {
      console.error('No se pudo eliminar el archivo temporal:', err.message);
    }
  }
});

const FORMATOS_EXPORTACION = ['json', 'csv'];

app.get('/api/alumnos/export/:formato', async (req, res) => {
  const formato = req.params.formato.toLowerCase();

  if (!FORMATOS_EXPORTACION.includes(formato)) {
    return res.status(400).json({
      message: `Formato no válido: usa ${FORMATOS_EXPORTACION.join(' o ')}`
    });
  }

  try {
    const [alumnos] = await db.query('SELECT * FROM alumnos');

    return res.status(200).json({
      message: `Exportación en formato ${formato}`,
      total: alumnos.length,
      alumnos
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error al exportar los alumnos'
    });
  }
});

// Middleware para manejar errores de multer y errores personalizados
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Solo se permiten archivos .json o .csv') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});
