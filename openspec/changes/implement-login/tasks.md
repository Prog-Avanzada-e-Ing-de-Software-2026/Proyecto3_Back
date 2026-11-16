# Tasks

## 1. Dependencias y configuración

- [x] 1.1 Agregar `@nestjs/jwt`, `cookie-parser`, `bcryptjs` y los tipos de `cookie-parser`, y registrar `AUTH_JWT_SECRET` con la validación de arranque que falla si falta o es menor a 32 caracteres. Verificación: `yarn typecheck` y `yarn test` en verde, y un test unitario del validador de configuración que falle con el secreto ausente. Trazabilidad: `design.md` D3, D9.
- [x] 1.2 Definir `IPasswordHasher` en `src/modules/auth/domain/interfaces/` con `hash` y `verify`, e implementar el adaptador `argon2id` con `m=19 MiB, t=2, p=1` en `infrastructure/`. Verificación: test unitario del adaptador que compruebe que dos hashes de la misma contraseña difieren, que el hash declara `argon2id` y los parámetros elegidos, que `verify` acepta la correcta y rechaza la incorrecta. Trazabilidad: `identidad-usuario` — Credencial nunca almacenada en claro; `design.md` D2.

## 2. Persistencia de Usuario

- [x] 2.1 Definir `IUsuarioRepository` con `findByEmail(email)` y `findById(id)` en `src/modules/auth/domain/interfaces/`, devolviendo el agregado con su rol y sus permisos y **sin** filtrar la baja lógica. Verificación: `yarn typecheck`; el contrato se ejercita en 2.2. Trazabilidad: `design.md` D6.
- [x] 2.2 Implementar `MikroOrmUsuarioRepository` con `@InjectRepository(Usuario)` y `populate` del rol y sus permisos, registrarlo en `auth.module.ts` con su token y `MikroOrmModule.forFeature([Usuario])`. Verificación: test de persistencia contra PostgreSQL real con alta previa de catálogo, que compruebe email en distinta capitalización, lectura de un usuario dado de baja y permisos efectivos poblados. Trazabilidad: `identidad-usuario` — Identificador de acceso único, Permisos efectivos del usuario, Exclusión de registros dados de baja (excepción de D6); `docs/agreements/testing.md` §3.

## 3. Casos de uso

- [x] 3.1 Implementar `LoginUseCase` con su Input y su Result: normaliza el email, busca por el puerto, verifica el hash, rechaza al usuario dado de baja o sin rol activo y devuelve el actor con su rol y sus permisos efectivos. Verificación: test del caso de uso con doble del puerto y del hasher que cubra credenciales válidas, contraseña incorrecta, email inexistente y usuario dado de baja, con la misma excepción semántica en los tres rechazos. Trazabilidad: `HU 14`, `RN-32`, `RN-34`, `identidad-usuario` — Permisos efectivos del usuario; `autenticacion-sesion` — Inicio de sesión con credenciales válidas, Rechazo de credenciales inválidas, Acceso de usuarios dados de baja.
- [x] 3.2 Definir el contrato de error del rechazo de credenciales: una única excepción semántica que el filtro global traduce a `401` con mensaje genérico, sin distinguir el dato fallido. Verificación: test unitario del filtro que compruebe `401` y el mismo cuerpo para las tres causas. Trazabilidad: `HU 14`, `http-error-contract`; `autenticacion-sesion` — Rechazo de credenciales inválidas sin revelar el dato fallido.

## 4. Sesión y borde HTTP

- [x] 4.1 Implementar el emisor de sesión sobre `JwtService`: firma HS256 con `sub` e `iat`, TTL de 8 h, cookie `httpOnly` con `SameSite=Lax`, `Secure` en producción y `Path=/`, y expiración en el cierre. Verificación: test unitario del emisor que compruebe los atributos de la cookie, el TTL y que el cuerpo no contiene el token. Trazabilidad: `autenticacion-sesion` — Confidencialidad de la credencial y de la sesión; `design.md` D1, D7.
- [x] 4.2 Implementar `AuthGuard` como `APP_GUARD`, el decorador `@Public()` y el decorador `@ActorActual()`, con verificación de firma, expiración, lectura del usuario por el puerto y rechazo por baja. Verificación: test unitario del guard con `Reflector` y puerto dobles que cubra ruta pública, token ausente, token vencido, token con firma alterada, usuario dado de baja y usuario válido con actor disponible. Trazabilidad: `autenticacion-sesion` — Protección de las operaciones que exigen sesión, Acceso de usuarios dados de baja, Actor desde la sesión; `design.md` D4, D5.
- [x] 4.3 Implementar `AuthController` con `POST /api/auth/login`, el `LoginDto` con `class-validator` y la traducción DTO → Input → Result. Verificación: test e2e sobre la app creada desde `AppModule` que cubra login con cookie y rechazo con credenciales inválidas. Trazabilidad: `HU 14`, `autenticacion-sesion` — Inicio de sesión con credenciales válidas; `design.md` D7.
- [x] 4.4 Exponer en el Result del login el rol y los permisos efectivos, y documentar ambos endpoints con `@ApiOperation` y los decoradores de respuesta. Verificación: test e2e que compruebe que un `Alumno` no recibe `Gestionar alumnos` ni `Gestionar profesores` en la respuesta. Trazabilidad: `HU 14`, `identidad-usuario` — Permisos efectivos del usuario.

## 5. Piezas transversales diferidas

- [x] 5.1 Registrar en `src/main.ts` el `ValidationPipe` global con `{ transform: true, whitelist: true }` y `cookie-parser`, y registrar `SwaggerModule` publicando en `/api/docs`. Verificación: test e2e que compruebe que un campo no declarado en el `LoginDto` se descarta y no altera la autenticación, y que `/api/docs-json` responde `200` con el esquema del login. Trazabilidad: `AGENTS.md` §5.6, `setup-http-foundation` (fuera de alcance diferido); `design.md` D8.
- [x] 5.2 Verificar que el prefijo global y la ruta de la documentación no colisionan y que `/api/auth/login` responde y `/auth/login` no. Verificación: test e2e de ambas rutas. Trazabilidad: `design.md` D8.

## 6. Verificación de integración

- [x] 6.1 Cubrir en e2e los requisitos de `autenticacion-sesion`: login válido, capitalización del email, credenciales inválidas con el mismo cuerpo, alta y baja del acceso, operación protegida sin sesión, token manipulado y confidencialidad de la respuesta. Verificación: `yarn test:e2e` en verde con esos casos nombrados por requisito.
- [x] 6.2 Ejecutar la verificación completa del repositorio. Verificación: `yarn typecheck && yarn lint && yarn test && yarn test:e2e` en verde y `openspec validate implement-login --strict` con código 0.

## Workflow follow-up

- Archivar con `openspec archive implement-login` después del merge a `develop`, con `openspec validate --strict` en verde.
- Abrir el cambio `add-alta-alumno`, que consume el guard, el actor y el emisor de sesión de este cambio.
