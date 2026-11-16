# Tasks

## 1. Tipos y traducción del detalle

- [x] 1.1 Crear `DetalleValidacion` (`{ campo, mensaje }`), `EntradaInvalidaException extends BadRequestException` y el guard tipado `esErrorConDetalle` en `src/common/presentation/validation/`, con extensión `.js` en los imports. Verificación: test unitario que comprueba que la excepción expone `errores` y que el guard la reconoce y descarta cualquier otra `HttpException`. Trazabilidad: requisito «Detalle de validación por campo»; `design.md` D1.
- [x] 1.2 Convertir `ValidationError[]` en `DetalleValidacion[]` tomando el mensaje que `class-validator` ya resolvió: una entrada por restricción incumplida, recursión sobre `children` con campo compuesto por puntos, orden estable por campo y restricción, y redacción central en español solo para la restricción `whitelist`. Verificación: test unitario con un mensaje declarado en el DTO que llega literal, el caso `whitelist`, un DTO anidado y dos restricciones sobre el mismo campo, con aserciones de orden estable y de que el mensaje no incorpora el valor recibido. Trazabilidad: requisito «Detalle de validación por campo»; `design.md` D2, D3 y D4.
- [x] 1.3 Declarar `message` en español en cada decorador de validación de los seis DTO de `src/modules/auth/presentation/dto/` y agregar el test guardián que recorre los DTO con `getMetadataStorage()` y falla si un decorador de validación no declara `message`, omitiendo las validaciones condicionales. Verificación: el test guardián pasa con los seis DTO y falla al quitar un `message` en una copia de prueba. Trazabilidad: requisito «Detalle de validación por campo»; `design.md` D2.
- [x] 1.4 Implementar el `exceptionFactory` que traduce `ValidationError[]` a `EntradaInvalidaException`. Verificación: test unitario que comprueba el `statusCode` 400 y que el cuerpo del error transporta exactamente las entradas producidas por el traductor. Trazabilidad: requisito «Detalle de validación por campo»; `design.md` D1 y D2.

## 2. Cuerpo de error en el filtro global

- [x] 2.1 Agregar la rama de detalle en `construirCuerpo`: cuando la excepción transporta `errores`, el cuerpo conserva `statusCode`, `code`, `message` y `requestId` y agrega `errores`; cuando no los transporta, el campo no aparece. Verificación: en `src/common/presentation/global-exception.filter.spec.ts`, un caso con detalle que compare el cuerpo completo y un caso sin detalle que compare las cuatro claves exactas. Trazabilidad: requisito «Cuerpo único de respuesta de error»; `design.md` D1.
- [x] 2.2 Corregir el mensaje genérico de las excepciones HTTP: un estado `4xx` sin mensaje declarado responde el genérico de solicitud rechazada y solo un `5xx` responde el de fallo interno, conservando el estado y el `code` derivado. Verificación: tests unitarios con `418` y con `503` que comprueben estado, `code` y que el texto de `4xx` no es el de fallo inesperado. Trazabilidad: requisito «Normalización de excepciones HTTP del framework»; `design.md` D7.

## 3. Fuente única de las opciones de validación

- [x] 3.1 Extraer la construcción del `ValidationPipe` a una función compartida con `{ transform: true, whitelist: true, forbidNonWhitelisted: true, exceptionFactory }` y usarla en `src/main.ts` y en los arneses de `test/auth.e2e-spec.ts` y `test/roles-permisos.e2e-spec.ts`. Verificación: test unitario que comprueba que la función devuelve un `ValidationPipe` con las tres opciones y el `exceptionFactory`, y que no queda ninguna otra construcción literal de `ValidationPipe` en `src/` ni en `test/`. Trazabilidad: requisitos «Rechazo de propiedades no declaradas»; `design.md` D5 y D6.
- [x] 3.2 Actualizar `AGENTS.md` §6.2, regla 3, y §5.6, y `docs/agreements/arquitectura.md` §8, para que declaren el rechazo con `400` de los campos no declarados, incluidos los de auditoría. Verificación: `yarn check:docs` y lectura del diff contra el comportamiento implementado en 3.1. Trazabilidad: `design.md` D5; `docs/agreements/buenas_practicas.md` §4.

## 4. Contrato HTTP comprobado por endpoint

- [x] 4.1 Reemplazar en `test/auth.e2e-spec.ts` el caso que fija el descarte silencioso por uno que espera `400` con una entrada de `errores` que nombra `createdById`. Verificación: el test corre en verde y no queda ninguna aserción que espere el descarte. Trazabilidad: requisito «Rechazo de propiedades no declaradas»; `HU 14` sin cambio de comportamiento de credenciales.
- [x] 4.2 Agregar en `test/auth.e2e-spec.ts` el caso de un email con formato inválido y el de un atributo mal escrito (`correo` en lugar de `email`), ambos con `400`, `code` `SOLICITUD_INVALIDA` y la entrada correspondiente en `errores`. Verificación: los dos casos pasan y el login válido sigue respondiendo `200` con sus cookies. Trazabilidad: requisito «Detalle de validación por campo»; `design.md` D5.
- [x] 4.3 Agregar en `test/roles-permisos.e2e-spec.ts` la verificación de que un `400` semántico conserva las cuatro claves y no incluye `errores`, usando el `PATCH /api/roles/:id` sin campos (`SIN_CAMBIOS`). Verificación: el caso pasa y falla si el filtro agrega el campo en ese camino. Trazabilidad: requisito «Cuerpo único de respuesta de error»; `design.md` D1.

## 5. Documentación del contrato expuesto

- [x] 5.1 Declarar en Swagger el esquema del `400` con `errores` mediante un decorador compartido y aplicarlo a los endpoints que reciben cuerpo. Verificación: `/api/docs-json` expone el esquema del `400` con `errores` en cada endpoint con cuerpo y ningún endpoint recibió un esquema copiado a mano. Trazabilidad: `docs/agreements/buenas_practicas.md` §4; `design.md` D8.

## 6. Verificación integral

- [x] 6.1 Ejecutar `yarn typecheck && yarn lint && yarn test`. Verificación: los tres comandos terminan sin errores y se reporta la salida real.
- [x] 6.2 Ejecutar `yarn test:e2e`. Verificación: la suite completa pasa contra PostgreSQL real y se reporta el resultado real, incluidos los casos de detalle de validación y de rechazo de propiedades no declaradas.
- [x] 6.3 Ejecutar `yarn check:docs`. Verificación: las referencias entre documentos siguen resolviendo después de la actualización de `AGENTS.md`.

## Workflow follow-up

- Archivar el cambio con `openspec archive add-error-detail` cuando la validación estricta y las suites estén en verde y el usuario lo apruebe.
