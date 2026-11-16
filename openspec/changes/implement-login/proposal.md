# Proposal

## Why

El backend ya persiste la identidad (`Usuario`, `Rol`, `Permiso`, `Alumno`, `Profesor`) pero no tiene ninguna forma de saber **quién** ejecuta una petición. Eso bloquea dos cosas a la vez: el primer endpoint funcional y toda la auditoría, porque `AGENTS.md` §6.2 exige que el actor de `createdById` y `updatedById` salga del contexto de autenticación y nunca del cuerpo de la petición.

`HU 14` es la puerta de entrada del MVP: sin login, las historias de alta, planes y entrenamientos no tienen actor. El cambio `add-usuario-identity` dejó la autenticación explícitamente fuera de su alcance y reservó este cambio para resolverla.

## What Changes

- Se expone **inicio de sesión** con email y contraseña, con un único mensaje de rechazo que no revela cuál de los dos datos falló (`HU 14`).
- Se expone **cierre de sesión**, que invalida la sesión del cliente y deja de conceder acceso.
- La sesión viaja en una **cookie `httpOnly`** con un token firmado; ninguna respuesta devuelve la credencial ni el token en el cuerpo.
- El inicio de sesión devuelve **el rol y los permisos efectivos** del usuario, para que el cliente muestre solo las funciones que le corresponden (`HU 14`, `RN-11`, `RN-12`).
- Se **rechaza el acceso** a cualquier usuario dado de baja, tanto al iniciar sesión como en cada petición posterior (`RN-34`).
- Se incorpora un **guard global de autenticación** que rechaza toda operación protegida sin sesión válida y deja el sistema cerrado por defecto: una ruta nueva nace protegida salvo que se declare pública.
- Se incorpora el **contexto de actor** de la petición: el identificador del usuario autenticado queda disponible para los casos de uso que escriben auditoría, y nunca se toma del cliente.
- Se crea el **puerto de persistencia de `Usuario`** y su adaptador MikroORM, hoy inexistentes.
- Se incorporan dos piezas que `setup-http-foundation` difirió al primer endpoint: el **`ValidationPipe` global** y el **registro de Swagger** con la decoración del controller.
- Se agrega **hashing de contraseñas** con un algoritmo lento y salado; el hash nunca se serializa.

## Capabilities

### New Capabilities

- `autenticacion-sesion`: comportamiento observable del inicio y cierre de sesión, la vigencia de la sesión, el rechazo por credenciales inválidas o por usuario dado de baja, y la protección de las operaciones que exigen un actor autenticado.

### Modified Capabilities

Ninguna. `identidad-usuario` ya especifica el hash almacenado, el email único, los permisos efectivos y la autorización por permiso; este cambio los consume sin cambiar su comportamiento. `http-error-contract` ya define el estado y el cuerpo de error para una credencial ausente o inválida.

## Impact

- **Código afectado:**
  - `src/modules/auth/presentation/` — controller de autenticación y DTO de entrada.
  - `src/modules/auth/application/use-cases/` — inicio y cierre de sesión.
  - `src/modules/auth/domain/interfaces/` — puerto `IUsuarioRepository`.
  - `src/modules/auth/domain/services/` — verificación y generación del hash, si no cabe en el puerto.
  - `src/modules/auth/infrastructure/` — adaptador MikroORM de `Usuario` y adaptador de hashing.
  - `src/common/presentation/` — guard de autenticación, guard de permiso, decorador de actor y middleware que completa el contexto.
  - `src/main.ts` — `ValidationPipe` global, Swagger y prefijo ya existente.
- **Dependencias nuevas:** un algoritmo de hashing lento (bcrypt o argon2), emisión y verificación de tokens firmados, y lectura de cookies. Se eligen en `design.md`.
- **Base de datos:** sin migraciones. `usuario` ya existe con `password_hash` y `email` único; la sesión no se persiste.
- **API:** primer contrato HTTP funcional, bajo el prefijo `/api`. La documentación OpenAPI se publica en el mismo cambio.
- **Fuera de alcance:**
  - **Autorización por permiso en el borde HTTP**: `identidad-usuario` ya especifica que una operación protegida se decide por permiso y no por el código del rol, pero este cambio no tiene ninguna operación de negocio que la ejerza. El guard de permiso se entrega con la primera operación protegida (`add-alta-alumno`), para no crear una abstracción sin consumidor (`AGENTS.md` §5.9).
  - **Restauración de contraseña (`HU 15`)**: requiere un proveedor de correo y un mecanismo de código de un solo uso. Va en el cambio `restore-password`.
  - **Alta de alumno (`HU 16`) y de profesor (`HU 17`)**: van en `add-alta-alumno` y `add-alta-profesor`. Este cambio no crea personas ni credenciales iniciales.
  - **Alta del administrador inicial** y administración de roles y permisos por API.
  - **Protección CSRF por token**: se mitiga con los atributos de la cookie y se registra como riesgo residual en `design.md`.
  - Refresco silencioso del token, segundo factor, bloqueo por intentos fallidos y recuperación de sesión entre dispositivos.
  - Cualquier regla de negocio de planes o entrenamientos.
