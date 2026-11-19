/**
 * Puerto de hashing de credenciales.
 *
 * El algoritmo y sus parámetros son una decisión de infraestructura: el caso de
 * uso solo pide hashear al dar de alta y verificar al iniciar sesión.
 */
export interface IPasswordHasher {
  hash(claro: string): Promise<string>;
  verify(hash: string, claro: string): Promise<boolean>;
}
