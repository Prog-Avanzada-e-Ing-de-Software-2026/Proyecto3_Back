import type { Usuario } from '../../../auth/domain/entities/usuario.entity.js';

/**
 * Datos de construcción de un `Profesor`.
 *
 * Es el contrato de entrada de `Profesor.crear`: no valida nada por sí mismo y
 * las invariantes las aplica la raíz del agregado. La auditoría del alta la
 * completa el caso de uso.
 */
export interface CrearProfesor {
  nombre: string;
  fechaNacimiento: string;
  numeroDocumento: string;
  numeroTelefono: string;
  fechaIngreso: Date;
  usuario: Usuario;
}
