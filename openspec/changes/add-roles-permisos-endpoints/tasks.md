# Tasks

## 1. Catálogo y puertos

- [x] 1.1 Agregar `Gestionar roles` y `Gestionar permisos` a `PERMISOS_INICIALES` y a la asignación de `Administrador` en `ROLES_INICIALES`. Verificación: test del seed sobre una base recién migrada que compruebe los cinco permisos y que `Administrador` queda con los cinco. Trazabilidad: `identidad-usuario` — Catálogo de permisos; `design.md` D6.
- [x] 1.2 Extender `IRolRepository` con `findAll()` y `findById(id)`, e `IPermisoRepository` con los mismos dos métodos. Verificación: `yarn typecheck`; el contrato se ejercita en 1.3. Trazabilidad: `design.md` D5.
- [x] 1.3 Implementar las cuatro lecturas en los adaptadores MikroORM, con `populate` de permisos en el de roles. Verificación: test de integración contra PostgreSQL real que compruebe el listado con permisos, la búsqueda por id y que un registro dado de baja no aparece. Trazabilidad: `identidad-usuario` — Listado del catálogo, Exclusión de registros dados de baja; `design.md` D5.

## 2. Reglas de administración

- [x] 2.1 Implementar la regla de nombres requeridos inmutables como servicio de dominio o constante compartida por los casos de edición, con el listado de nombres requeridos en un solo lugar. Verificación: test unitario que rechace renombrar cada nombre requerido y acepte cambiar la descripción. Trazabilidad: `identidad-usuario` — Inmutabilidad de los nombres requeridos; `design.md` D4.
- [x] 2.2 Implementar la regla de no escalada: un componente que, dado el actor y el conjunto pedido, rechace si falta alguno de los permisos. Verificación: test unitario con actor que tiene todos, que tiene algunos y que no tiene ninguno. Trazabilidad: `identidad-usuario` — Nadie otorga un permiso que no tiene; `design.md` D3.

## 3. Casos de uso

- [x] 3.1 Implementar `ListRolesUseCase`, `FindRolByIdUseCase`, `ListPermisosUseCase` y `FindPermisoByIdUseCase` con sus proyecciones de aplicación. Verificación: test de cada caso de uso con doble del puerto, incluido el no encontrado. Trazabilidad: `identidad-usuario` — Listado del catálogo.
- [x] 3.2 Implementar `CreateRolUseCase` y `CreatePermisoUseCase` como comandos con actor: nombre único que incluye los dados de baja, escalada verificada cuando hay permisos, y auditoría de alta. Verificación: test de cada caso de uso con doble del puerto que cubra alta válida, nombre repetido y nombre de un registro dado de baja. Trazabilidad: `identidad-usuario` — Alta de un permiso nuevo, Alta con nombre ya usado por un registro dado de baja, Nadie otorga un permiso que no tiene.
- [x] 3.3 Implementar `UpdateRolUseCase` y `UpdatePermisoUseCase` con nombre único, nombres requeridos inmutables y auditoría de edición. Verificación: test de cada caso de uso que cubra edición válida, nombre en uso y renombre de un requerido. Trazabilidad: `identidad-usuario` — Inmutabilidad de los nombres requeridos.
- [x] 3.4 Implementar `ReplaceRolPermisosUseCase`: resuelve cada nombre a un permiso vigente, rechaza repetidos y faltantes, verifica la escalada y aplica el conjunto por la raíz del rol en una sola escritura. Verificación: test del caso de uso que cubra reemplazo completo, quita los anteriores, permiso inexistente, repetido y escalada. Trazabilidad: `identidad-usuario` — Reemplazo de los permisos de un rol, Permiso repetido en el mismo rol.

## 4. Borde HTTP

- [x] 4.1 Implementar `RolesController` y `PermisosController` con los nueve endpoints, sus DTOs y `@ActorActual()`, cada uno con `@RequierePermiso` usando las constantes del catálogo. Verificación: test e2e que compruebe `401` sin sesión y `403` con sesión sin el permiso en las cuatro operaciones de escritura. Trazabilidad: `identidad-usuario` — Administración del catálogo de roles y permisos; `design.md` D1.
- [x] 4.2 Cubrir el contrato de los nueve endpoints en e2e: alta, listado, detalle, edición y reemplazo de permisos, con los códigos del contrato de error para nombre duplicado, recurso no encontrado y escalada. Verificación: `yarn test:e2e` en verde con esos casos.
- [x] 4.3 Documentar los nueve endpoints en Swagger con su operación, cuerpo y respuestas. Verificación: e2e que compruebe que `/api/docs-json` incluye las nueve rutas.

## 5. Verificación

- [x] 5.1 Ejecutar la verificación completa del repositorio. Verificación: `yarn typecheck && yarn lint && yarn test && yarn test:e2e` en verde y `openspec validate add-roles-permisos-endpoints --strict` con código 0.

## Workflow follow-up

- Archivar con `openspec archive add-roles-permisos-endpoints` después del merge a `develop`.
- Sembrar el catálogo con `yarn db:seed catalogo-identidad` en los entornos nuevos.
- Abrir el cambio de baja y reactivación del catálogo, que reutiliza estos casos de uso.
