# Tasks

## 1. Caso de uso compartido

- [x] 1.1 Renombrar `RefreshSesionUseCase` a `ReadSesionUseCase` y actualizar el módulo, el controller y su uso desde `/refresh`. Verificación: `yarn typecheck` y el e2e de renovación en verde sin cambios de contrato. Trazabilidad: `design.md` D1.

## 2. Endpoint

- [x] 2.1 Implementar `GET /api/auth/me` en `AuthController`: recibe `@ActorActual()`, resuelve la sesión y devuelve `SesionOtorgada` sin emitir cookies. Verificación: test e2e con sesión válida que compruebe `id`, `email`, `rol` y `permisos`, y que la respuesta no trae `Set-Cookie`. Trazabilidad: `autenticacion-sesion` — Consulta del usuario autenticado; `design.md` D2.
- [x] 2.2 Cubrir el rechazo: sin sesión `401` y usuario dado de baja con sesión emitida `401`, sin datos del usuario en el cuerpo. Verificación: test e2e de ambos casos. Trazabilidad: `autenticacion-sesion` — Consulta sin sesión, Consulta de un usuario dado de baja; `design.md` D3.
- [x] 2.3 Documentar la operación en Swagger y comprobar que aparece en el documento. Verificación: e2e que compruebe la ruta en `/api/docs-json`.

## 3. Verificación

- [x] 3.1 Ejecutar la verificación completa del repositorio. Verificación: `yarn typecheck && yarn lint && yarn test && yarn test:e2e` en verde y `openspec validate add-auth-me --strict` con código 0.

## Workflow follow-up

- Archivar con `openspec archive add-auth-me` después del merge a `develop`.
