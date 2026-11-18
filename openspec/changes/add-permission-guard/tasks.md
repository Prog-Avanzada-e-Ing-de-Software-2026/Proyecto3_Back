# Tasks

## 1. Decorador y contrato del guard

- [x] 1.1 Crear `@RequierePermiso(nombre)` en `src/common/presentation/auth/` con `SetMetadata`, exportando la clave y documentando que acepta un nombre del catálogo. Verificación: test unitario que compruebe que la metadata queda en el descriptor del método y en el de la clase. Trazabilidad: `identidad-usuario` — Autorización de la operación por permiso declarado; `design.md` D2.
- [x] 1.2 Extender `SolicitudAutenticada` para exponer el `Usuario` resuelto, conservando `actorId` derivado para no romper `@ActorActual()`. Verificación: `yarn typecheck` y el test del guard que comprueba que el usuario queda en la petición. Trazabilidad: `design.md` D3.

## 2. Autorización en el guard

- [x] 2.1 Implementar en `AuthGuard` la lectura de la metadata y la comprobación del permiso contra `permisosEfectivos()` del usuario ya cargado, lanzando el error semántico de categoría `prohibido` con código `SIN_PERMISO`. Verificación: test unitario que cubra operación sin permiso declarado, con el permiso, sin el permiso y con el rol dado de baja. Trazabilidad: `identidad-usuario` — Autorización de la operación por permiso declarado; `design.md` D1, D3, D4.
- [x] 2.2 Fijar la prioridad de rechazos: una operación que declara permiso y no tiene sesión responde `401` sin evaluar permisos. Verificación: test unitario del guard con la combinación de ruta protegida y permiso declarado. Trazabilidad: `identidad-usuario` — Prioridad del rechazo de sesión sobre el de permiso.
- [x] 2.3 Confirmar que `@Public()` sigue ganando sobre cualquier permiso declarado, de modo que una ruta abierta no evalúe autorización. Verificación: test unitario del guard con las dos metadata en el mismo handler. Trazabilidad: `design.md` D1.

## 3. Verificación sobre HTTP

- [x] 3.1 Cubrir en e2e un controller de sonda con `@RequierePermiso` usando un nombre del catálogo: con sesión y permiso `200`, con sesión sin permiso `403` con el cuerpo del contrato de error, sin sesión `401` y una ruta sin permiso declarado `200`. Verificación: `yarn test:e2e` en verde con esos tres casos. Trazabilidad: `identidad-usuario` — Autorización de la operación por permiso declarado, Prioridad del rechazo de sesión sobre el de permiso; `http-error-contract`.
- [x] 3.2 Ejecutar la verificación completa del repositorio. Verificación: `yarn typecheck && yarn lint && yarn test && yarn test:e2e` en verde y `openspec validate add-permission-guard --strict` con código 0.

## Workflow follow-up

- Archivar con `openspec archive add-permission-guard` después del merge a `develop`.
- Declarar los permisos reales en `add-alta-alumno` (`alumno:crear`) y `add-alta-profesor` (`profesor:crear`) usando las constantes de `src/modules/auth/domain/catalogos.ts`, con la forma `recurso:acción` de `AGENTS.md` §5.10.
