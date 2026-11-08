import type { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
import type { Profesor } from '../../../profesores/domain/entities/profesor.entity.js';

/**
 * Datos de construcción de un `Alumno`.
 *
 * Es el contrato de entrada de `Alumno.crear`: no valida nada por sí mismo y las
 * invariantes las aplica la raíz del agregado. La auditoría del alta la completa
 * el caso de uso.
 */
export interface CrearAlumno {
  nombre: string;
  fechaNacimiento: string;
  numeroDocumento: string;
  numeroTelefono: string;
  fechaIngreso: Date;
  observaciones?: string | null;
  profesorAsignado?: Profesor | null;
  usuario: Usuario;
}
