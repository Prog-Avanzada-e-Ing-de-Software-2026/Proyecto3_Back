# Proposal

## Why

`identidad-usuario` exige que la autorización de una operación protegida se decida por la **presencia de un permiso** y no comparando el código del rol, y `http-error-contract` ya traduce `prohibido` a `403` con el cuerpo estable. Ninguna de las dos cosas tiene todavía quien las ejerza: hoy todo lo que el guard de sesión deja pasar puede ejecutarse con cualquier rol.

`implement-login` dejó la autorización por permiso explícitamente fuera de su alcance porque no había ninguna operación de negocio que la reclamara. Las altas de alumno y profesor son esas operaciones, y llegan con `Gestionar alumnos` y `Gestionar profesores`: si el guard no existe antes, cada cambio arrastra su propia versión.

## What Changes

- Se incorpora un **decorador `@RequierePermiso(nombre)`** que declara, en el método o en el controller, el permiso que exige una operación.
- El **guard de sesión pasa a aplicar la autorización**: cuando la operación declara un permiso y el usuario autenticado no lo tiene entre sus permisos efectivos, la petición se rechaza con `403 SIN_PERMISO` **antes** de ejecutar cualquier efecto.
- El guard **reutiliza el `Usuario` que ya carga** para validar la sesión en lugar de consultarlo dos veces: hoy lo descarta y conserva solo el identificador.
- El orden de rechazo queda fijado: sin sesión válida es `401`, y solo un usuario autenticado puede recibir `403`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `identidad-usuario`: se agrega el comportamiento observable de una operación que declara un permiso requerido —rechazo con `403` sin ejecutar efectos, y prioridad del `401` cuando no hay sesión—. La regla de dominio de decidir por permiso ya está especificada y no cambia.

## Impact

- **Código afectado:**
  - `src/common/presentation/auth/requiere-permiso.decorator.ts` (nuevo) y el tipo de la petición autenticada, que pasa a exponer el usuario resuelto.
  - `src/modules/auth/presentation/auth.guard.ts`: lee la metadata y aplica la autorización.
  - `src/modules/auth/auth.module.ts`: sin cambios de wiring; el `APP_GUARD` ya está registrado.
- **Base de datos:** sin cambios. Los permisos efectivos salen del rol ya persistido.
- **API:** ninguna ruta existente declara un permiso, así que el contrato público no cambia. La primera ruta que lo use llega en `add-alta-alumno`.
- **Fuera de alcance:**
  - `add-alta-alumno` y `add-alta-profesor`, que son quienes declaran permisos sobre operaciones reales.
  - Un permiso por endpoint o una matriz de permisos: el permiso nombra una operación del negocio (`RN-11`, `RN-12`) y no un verbo HTTP.
  - Reglas de pertenencia al recurso (`RN-12`, `RN-35`): dependen del alumno o del profesor asignado, no del rol, y las evalúa el caso de uso.
  - Cachear los permisos para evitar la lectura por request.
