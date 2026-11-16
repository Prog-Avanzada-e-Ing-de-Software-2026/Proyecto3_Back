/**
 * Entorno determinista de las suites.
 *
 * `AuthModule` falla el arranque si `AUTH_JWT_SECRET` falta o es corta, y eso es
 * deliberado en producción. Las pruebas no dependen de un `.env` local: fijan
 * un valor propio antes de que se instancie el módulo.
 */
process.env.AUTH_JWT_SECRET ??= 'secreto-de-pruebas-con-longitud-suficiente-para-hs256';
