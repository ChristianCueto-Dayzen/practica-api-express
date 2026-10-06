class Alumno {
  constructor(id, nombre, apellido, email, matricula) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.matricula = matricula;
  }
}
const alumnos = [];
alumnos.push(new Alumno(1, "Juan", "Pérez", "juan@example.com", "MAT001"));
alumnos.push(new Alumno(2, "María", "Gómez", "maria@example.com", "MAT002"));
alumnos.push(new Alumno(3, "Carlos", "López", "carlos@example.com", "MAT003"));

module.exports = {
    Alumno: Alumno,
    alumnos: alumnos
}