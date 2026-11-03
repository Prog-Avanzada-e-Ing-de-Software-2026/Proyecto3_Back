# Proposal

## Why

El backend no tiene todavía un manejo centralizado de errores ni un registro estructurado de solicitudes. Hoy solo existe `GET /` y cualquier endpoint futuro —login, planes, entrenamientos— tendría que inventar por su cuenta la forma del cuerpo de error y la manera de registrar fallos. Eso produce contratos divergentes, filtra detalles internos al cliente y vuelve imposible reconstruir una operación a partir de los logs.

Resolver esta base transversal antes del primer endpoint funcional evita retrabajo: el cambio de autenticación (`implement-login`) y todos los posteriores consumen el filtro y el logger en lugar de redefinirlos.

## What Changes

- Se introduce una jerarquía de **errores semánticos** de dominio/aplicación que no dependen de `HttpException` y que se lanzan, no se devuelven.
- Se introduce **un único filtro global de excepciones** en `src/common/presentation/` que traduce esos errores a un contrato HTTP estable y responde `500` ante fallos inesperados sin exponer trazas, SQL, credenciales ni detalles internos.
- Se define el **contrato uniforme del cuerpo de error**: código estable, mensaje seguro, estado HTTP e identificador de solicitud.
- Se incorpora **Pino** mediante `nestjs-pino` como logger de NestJS, con registro estructurado de solicitudes HTTP, código de estado, duración y errores.
- Se agrega **correlación por identificador de solicitud**, reutilizando el entrante o generando uno, y se propaga en la respuesta de error y en los logs.
- Se configura **redacción de datos sensibles** en el logger: cookies, cabecera `authorization`, tokens, contraseñas y documentos.
- Se fija el nivel y el formato de log por entorno, con salida apta para Heroku.
- Se **repara el arnés de pruebas HTTP**, hoy roto en `develop`: `yarn test:e2e` falla con `SyntaxError: Invalid or unexpected token` porque MikroORM importa `src/**/*.entity.ts` por el cargador ESM nativo de Node 24 y ese cargador rechaza los decoradores. Sin arnés no se puede demostrar el comportamiento de este cambio ni de ninguno posterior.

## Capabilities

### New Capabilities

- `http-error-contract`: comportamiento observable del cuerpo de error HTTP, su código estable, la traducción de errores semánticos y la no exposición de detalles internos.
- `http-logging`: comportamiento observable del registro estructurado de solicitudes y errores, su nivel por entorno y la redacción de datos sensibles.

### Modified Capabilities

Ninguna. Todavía no existe ninguna capacidad especificada en `openspec/specs/`.

## Impact

- **Código afectado:** `src/main.ts`, `src/app.module.ts`, nueva carpeta `src/common/presentation/` (filtro global e identificador de solicitud), nueva carpeta `src/common/domain/` (errores semánticos base), y el arnés de pruebas (`package.json`, `vitest.config.ts`, `vitest.config.e2e.ts`, `test/support/`).
- **Dependencias nuevas:** `pino`, `pino-http` y `nestjs-pino`. `nestjs-pino` 5.x declara compatibilidad con `@nestjs/core` y `@nestjs/common` `^12.0.2`; el repositorio tiene instalado 12.1.3.
- **Base de datos:** sin cambios. No hay entidades nuevas ni migraciones.
- **API:** sin ruptura. `GET /` conserva su respuesta actual; no se agrega ningún endpoint funcional.
- **Fuera de alcance:**
  - El `ValidationPipe` global, que se registra en el cambio que exponga el primer endpoint funcional (`implement-login`).
  - El registro de `SwaggerModule`, la ruta de documentación y la decoración de controllers, que se entregan en ese mismo cambio.
  - La entidad `Usuario`, roles, auditoría y migraciones (`add-usuario-identity`).
  - Autenticación, cookies, JWT, guards y CSRF (`implement-login`).
  - La retirada de `src/mock/mock.entity.ts`, que se evalúa cuando exista la primera entidad real.
  - Cualquier regla de negocio: este cambio no implementa ni modifica `RN-nn` ni historias de usuario. Habilita la trazabilidad técnica de todas ellas y no declara criterios de aceptación funcionales cumplidos.
