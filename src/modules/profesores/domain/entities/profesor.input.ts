import type { Usuario } from '../../../auth/domain/entities/usuario.entity.js';

/**
 * Datos de construcción de un `Profesor`.
 *
 * Es el contrato de entrada de `Profesor.crear`: no valida nada por sí mismo y
 * las invariantes las aplica la raíz del agregado.
 */
export interface CrearProfesor {
  nombre: string;
  fechaNacimiento: string;
  numeroDocumento: string;
  numeroTelefono: string;
  fechaIngreso: Date;
  usuario: Usuario;
  createdAt: Date;
  createdById?: number | null;
}
