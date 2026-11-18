/** Lo que el sistema concede al abrir o renovar una sesión: nunca expone el hash. */
export interface SesionOtorgada {
  id: number;
  email: string;
  rol: string;
  permisos: string[];
}
