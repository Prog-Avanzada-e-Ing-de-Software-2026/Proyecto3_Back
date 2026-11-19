/**
 * Entorno determinista de las suites.
 *
 * `AuthModule` falla el arranque si los secretos de sesión faltan, son cortos o
 * son iguales, y eso es deliberado en producción. Las pruebas no dependen de un
 * `.env` local: fijan valores propios antes de que se instancie el módulo.
 */
process.env.AUTH_JWT_SECRET_ACCESS ??= 'secreto-de-pruebas-access-con-longitud-suficiente';
process.env.AUTH_JWT_SECRET_REFRESH ??= 'secreto-de-pruebas-refresh-con-longitud-suficiente';
