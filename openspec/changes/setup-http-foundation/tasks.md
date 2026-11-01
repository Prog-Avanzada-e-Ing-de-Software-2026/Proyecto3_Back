# Tasks

## 1. Arnés de pruebas

- [x] 1.1 Agregar `--import @swc-node/register/esm-register` a los scripts `test` y `test:e2e` de `package.json`, y verificar que `yarn test` y `yarn test:e2e` pasan con la suite existente, incluida `test/app.e2e-spec.ts` que hoy falla.
- [x] 1.2 Crear `test/support/` con un módulo Nest mínimo que no importe `AppModule` y un controller de sonda con una ruta por categoría semántica y una que lanza un fallo inesperado; verificar con un test e2e que el módulo levanta y responde en cada ruta.

## 2. Logging estructurado

- [x] 2.1 Agregar `pino`, `pino-http` y `nestjs-pino` en versiones compatibles con NestJS 12 y verificar que `yarn install` no reporta conflictos de peer y que `yarn typecheck` pasa.
- [x] 2.2 Implementar las opciones de `pino-http` en `src/common/presentation/` con nivel por variable de entorno, lista blanca de niveles, reserva `info` ante valor inválido, salida JSON sin `pino-pretty`, serializador de `req` de lista blanca y redacción de cookies, `authorization`, contraseñas y documentos; verificar con tests unitarios contra un stream en memoria que el nivel inválido no rompe el arranque y que ningún evento contiene esos valores (requisito «Nivel de log configurable por entorno» y «Redacción de datos sensibles»).
- [x] 2.3 Registrar `LoggerModule.forRoot` en `AppModule` y `bufferLogs` con `useLogger` en `main.ts`; verificar que el arranque emite eventos JSON de una línea y que `GET /` produce un evento con método, ruta, estado, duración e identificador de solicitud (requisitos «Registro de cada solicitud HTTP» y «Salida estructurada»).
- [x] 2.4 Implementar la resolución del identificador de solicitud —patrón válido, generación cuando falta o es inválido— y conectarla como `genReqId` del logger; verificar con tests unitarios de la resolución y con tests HTTP que el identificador entrante válido se repite en la respuesta de error, el inválido se reemplaza y el ausente se genera, y que todos los eventos de una solicitud comparten el mismo valor (requisito «Correlación de eventos por solicitud»).

## 3. Errores semánticos

- [x] 3.1 Implementar en `src/common/domain/errors/` la base de error semántico y sus categorías, con código estable y mensaje seguro, sin dependencias de Nest ni de HTTP; verificar con tests unitarios que cada error expone su categoría y su código (requisito «Errores semánticos independientes del transporte»).
- [x] 3.2 Extender `.oxlintrc.json` para que la prohibición de excepciones de `@nestjs/common` también cubra `src/common/domain/**`, y verificar que `yarn lint` pasa y que la regla figura en la configuración.

## 4. Filtro global de errores

- [x] 4.1 Implementar el filtro en `src/common/presentation/` con la tabla de categorías a estados `404`, `409`, `401`, `403`, `400`, el fallo a `500` para categoría desconocida o error no semántico, la normalización de `HttpException` emitida por el framework y el `requestId` del cuerpo y de la cabecera; verificar con tests unitarios cada fila de la tabla y el caso de categoría desconocida (requisitos «Traducción de categorías semánticas a estados HTTP» e «Identificador de solicitud en la respuesta»).
- [x] 4.2 Registrar el filtro como `APP_FILTER` en `AppModule`; verificar con tests HTTP sobre las rutas de sonda que `400`, `401`, `403`, `404` y `409` devuelven el cuerpo de cuatro campos, que una ruta inexistente responde `404` y no `500`, y que un fallo inesperado responde `500` sin traza, sentencia SQL, nombre de tabla ni nombre de clase (requisitos «Cuerpo único de respuesta de error», «No exposición de detalles internos» y «Un solo lugar arma la respuesta de error»).
- [x] 4.3 Verificar sobre las rutas de sonda que un `500` registra una sola traza con su causa, que un `4xx` registra código y mensaje sin traza y que ningún evento de esas solicitudes contiene cookies, `authorization`, contraseña ni documento (requisitos «Registro de fallos con causa suficiente», «Registro único de cada fallo» y «Exclusión del contenido de las solicitudes»).
- [x] 4.4 Documentar en `docs/agreements/buenas_practicas.md` §6 el contrato de error resultante, la cabecera `X-Request-Id` y la variable `LOG_LEVEL`; verificar con `yarn check:docs`.

## 5. Integración y cierre

- [x] 5.1 Ejecutar `yarn typecheck && yarn lint && yarn test && yarn test:e2e` y verificar que los cuatro comandos terminan en verde, registrando el resultado real de cada uno.
- [x] 5.2 Verificar que `GET /` sigue respondiendo `200` con `Hello World!`, que no se registró `SwaggerModule` ni `ValidationPipe` global, y que `git diff` no toca `src/mock/`, `src/mikro-orm.config.ts`, entidades ni migraciones.

## Workflow follow-up

- Ejecutar `openspec validate setup-http-foundation --strict` y presentar el resultado.
- Implementar en `feature/setup-http-foundation` con commits convencionales que incluyan `Refs: openspec/changes/setup-http-foundation`, sin push, PR ni merge sin autorización.
- Archivar el cambio solo con todas las tareas verificadas y la validación estricta en verde.
