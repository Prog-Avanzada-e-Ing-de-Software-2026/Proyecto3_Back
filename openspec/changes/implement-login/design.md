# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `src/modules/auth/` tiene entidades, inputs, specs, dos puertos de lectura (`Rol`, `Permiso`) y tres casos de uso de catálogo. **No tiene** puerto de `Usuario`, adaptador de `Usuario`, controller, módulo con controller, ni nada de autenticación.
- `Usuario` ya persiste `email` único y `passwordHash`, y su constructor normaliza ambos (`usuario.entity.ts`). `Rol` expone su colección de `Permiso`, así que los permisos efectivos se obtienen navegando el agregado.
- `src/main.ts` aplica `app.setGlobalPrefix('api')` y `nestjs-pino`. No hay `ValidationPipe`, ni Swagger, ni guard global: `setup-http-foundation` los difirió explícitamente al cambio que expusiera el primer endpoint.
- `APP_FILTER` ya traduce `SIN_CREDENCIALES` a `401` y `SIN_PERMISO` a `403` con el cuerpo estable del contrato de error; el arnés de prueba lo demuestra sobre rutas de sonda.
- Stack: NestJS 12, TypeScript 6 ESM (`nodenext`), MikroORM 7 con `ReflectMetadataProvider`, PostgreSQL, Vitest 4.

## Goals / Non-Goals

**Goals:**

- Que una petición autenticada tenga un actor identificable y reutilizable por cualquier caso de uso que escriba auditoría.
- Que el sistema quede cerrado por defecto: toda ruta nueva exige sesión salvo declaración explícita de lo contrario.
- Dejar el contrato HTTP del primer endpoint documentado en OpenAPI y validado en el arnés e2e.

**Non-Goals:**

- Autorización por permiso en el borde HTTP: sin operación de negocio que la ejerza, se posterga a `add-alta-alumno`.
- Renovación silenciosa del token, revocación server-side por dispositivo, y protección CSRF por token.
- Persistir sesiones: la sesión no tiene tabla.

## Decisions

### D1 — JWT firmado en cookie `httpOnly`, y verificación contra la base en cada petición

La sesión es un JWT firmado con HS256 que viaja en una cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción y `Path=/`. El token solo transporta `sub` (identificador del usuario) y `iat`.

**Por qué:** decisión del usuario. Entre las alternativas, la cookie `httpOnly` es la única que no expone el token a JavaScript del cliente, y por eso es la que menos depende de la disciplina del front-end.

**Consecuencia asumida y explícita:** el guard **lee el `Usuario` de la base en cada petición**. `identidad-usuario` y `RN-34` exigen que la baja corte el acceso, y un token sin estado no lo puede saber; además el actor y sus permisos se necesitan igual para la auditoría. Con esa lectura, la ventaja teórica del JWT —no consultar la base— no se materializa: lo que se gana es no necesitar tabla de sesiones, no evitar la consulta. Se documenta para que nadie optimice después leyendo el token como fuente de verdad.

**Alternativas descartadas:**

- **Sesión opaca en tabla + cookie:** equivalente en costo por petición y con revocación inmediata real. Descartada por el usuario.
- **JWT `Bearer` en cabecera:** el cliente decide dónde guardarlo; con `localStorage` queda expuesto a XSS. Descartada.
- **Token con los permisos adentro:** evita navegar el rol, pero deja permisos obsoletos hasta que expire el token y contradice que la autorización se decida contra el catálogo persistido.

### D2 — `argon2id` para el hash

Hash con `argon2id` usando la dependencia `argon2`, parámetros `m=19 MiB, t=2, p=1` —el mínimo recomendado por OWASP—, salt por fila y salida en formato PHC. La verificación se hace contra `passwordHash`; el hash nunca sale del agregado.

**Por qué:** `argon2id` es la primera recomendación de OWASP y de la RFC 9106, y es **memory-hard**: encarece el ataque offline con GPU, que es el que importa acá. Además corre en el threadpool de libuv, así que no bloquea el event loop. En este proyecto el argumento es más fuerte que en una aplicación promedio: por `RN-33` la credencial inicial de alumnos y profesores es su número de documento, un espacio de 10⁸ claves, y el único freno real es el costo por intento.

**Medición:** en `linux-x64` con Node 24, `argon2@0.45.2` instala en 2 s sin ejecutar su script de instalación —usa binarios precompilados sobre N-API vía `node-gyp-build`— y hashea en 27 ms con los parámetros por defecto. El repositorio usa `nodeLinker: node-modules`, así que un módulo nativo no requiere configuración extra.

**Alternativas descartadas:**

- **`bcryptjs`:** JavaScript puro, sin riesgo de compilación, pero solo CPU-hard y **bloquea el event loop** durante el hash. Era la elección anterior de este diseño; se descartó al comprobar que el costo de instalación de `argon2` que la justificaba no existe en esta plataforma.
- **`bcrypt` nativo:** mismo límite de 72 bytes y sin parámetro de memoria; no aporta nada sobre `argon2id` a cambio de la misma dependencia nativa.
- **`node:crypto` `scrypt`:** memory-hard y sin dependencia externa, pero obliga a definir formato de almacenamiento, parámetros y comparación en tiempo constante a mano. Más superficie de error que la que ahorra.

### D3 — `@nestjs/jwt` y `cookie-parser`

Emisión y verificación con `@nestjs/jwt` sobre el secreto `AUTH_JWT_SECRET`; lectura de cookies con `cookie-parser`. La firma se verifica con algoritmo explícito, para no aceptar `none` ni algoritmos alternativos.

**Por qué:** son las piezas idiomáticas de NestJS y no arrastran la maquinaria de `passport` ni sus estrategias para dos endpoints.

**Alternativas descartadas:**

- **`passport` + `passport-jwt`:** capa de estrategias que se justifica con varios mecanismos de autenticación; acá hay uno.
- **`jose`:** excelente y ESM nativo, pero verifica y firma a mano cada llamada y duplica lo que `@nestjs/jwt` ya integra con el contenedor.
- **Verificar el token a mano en un middleware:** el guard necesita además cargar el usuario y decidir el rechazo; partirlo en dos lugares complica el orden.

### D4 — Guard global con exclusión explícita, no guard por controller

`AuthGuard` se registra como `APP_GUARD`, de modo que **toda ruta nace protegida**. Las públicas (`login`, `logout`) se marcan con un decorador `@Public()` que el guard consulta por `Reflector`.

**Por qué:** es un sistema cerrado por defecto. Olvidar un decorador deja una ruta cerrada —molesto y visible—; olvidar aplicar un guard deja una ruta abierta —silencioso y grave—. Con `HU 16` a `HU 24` por delante, el error probable es el segundo.

**Alternativas descartadas:**

- **Guard por controller o por método:** el default es abierto; el olvido no se detecta.
- **Middleware de autenticación en vez de guard:** un middleware corre antes de la resolución de ruta y no puede leer metadata del handler con la misma precisión; el guard es el punto donde NestJS resuelve "¿esta operación está protegida?".

### D5 — El actor llega por decorador de parámetro, no por `AsyncLocalStorage`

El guard deja el `Usuario` autenticado en la petición y un decorador `@ActorActual()` lo entrega como parámetro al método del controller, que lo pasa al Input del caso de uso.

**Por qué:** `AGENTS.md` §5.4 dice que presentación "obtiene el actor autenticado" y lo traduce a Input de aplicación. Un decorador es explícito, tipado y visible en la firma; `AsyncLocalStorage` funciona pero esconde la dependencia y complica las pruebas.

**Alternativas descartadas:**

- **`AsyncLocalStorage`:** útil cuando el actor se lee en capas profundas; acá el caso de uso ya recibe su Input.
- **Leer el `request` dentro del caso de uso:** mete HTTP en aplicación y contradice §5.4.

### D6 — `IUsuarioRepository` devuelve el agregado aunque esté dado de baja

El puerto expone `findByEmail(email)` y `findById(id)` **sin** filtrar la baja lógica; el caso de uso de login y el guard deciden si el usuario puede acceder.

**Por qué:** para iniciar sesión y para revalidar una sesión hay que poder distinguir "el email no existe" de "el email existe pero el usuario está dado de baja": el primero es un rechazo genérico, el segundo también, pero además es una decisión de negocio con trazabilidad. Si el puerto filtrara, el caso de uso no podría decidir. Es la excepción explícita a la exclusión habitual de `AGENTS.md` §5.8, y el nombre del método no la oculta.

**Alternativas descartadas:**

- **Reutilizar un lector que excluya la baja:** obliga a devolver "no encontrado" para un usuario dado de baja y deja la decisión de negocio fuera del dominio.
- **Dos métodos, uno con y otro sin baja:** dos puertos para el mismo dato; el llamador elige según lo que necesita, lo cual es exactamente el error que se quiere evitar.

### D7 — Contrato del endpoint de sesión

- `POST /api/auth/login`, cuerpo `{ email, password }` → `200` con `{ usuario: { id, email, rol: { nombre }, permisos: string[] } }` y la cookie de sesión.

El rechazo por credenciales inválidas responde `401` con un mensaje único, sin distinguir email inexistente, contraseña incorrecta ni usuario dado de baja.

**`logout` no existe.** Decisión del usuario: el cierre de sesión se resuelve en el cliente y no tiene ruta propia. Consecuencia que queda registrada: como la cookie es `httpOnly`, el cliente **no puede borrarla**; al cerrar sesión el navegador la conserva hasta que vence, y hasta entonces la sigue enviando. Lo único que corta el acceso antes de ese plazo es la baja del usuario (`RN-34`), que el guard evalúa en cada petición. Si más adelante se necesita un cierre real, aparece junto con el par de tokens de `D1`.

**Alternativas descartadas:**

- **`logout` protegido que expire la cookie:** era el diseño anterior. Resolvía el borrado en el servidor y daba al arnés una ruta protegida real, pero el usuario decidió que el cierre pertenece al cliente.
- **`GET /api/auth/me`:** no lo pide `HU 14` y el login ya devuelve rol y permisos; sería un endpoint sin consumidor.

### D8 — `ValidationPipe` y Swagger entran acá

`ValidationPipe` global con `{ transform: true, whitelist: true }` en `src/main.ts`, sin `forbidNonWhitelisted` (`AGENTS.md` §5.6 y §6.2 regla 3). Swagger se registra con título y versión internos del proyecto, y se publica en `/api/docs`. El prefijo global **no** se aplica a la ruta de la documentación: `SwaggerModule.setup` usa su propio path, y por eso `/api/docs` se declara explícitamente y convive con `/api/auth/*` sin colisión.

**Por qué:** `setup-http-foundation` lo condicionó al primer endpoint, y este es el primer endpoint.

### D9 — Módulos, entidades y migraciones afectadas

- `auth.module.ts`: registra `AuthController`, los dos casos de uso, el adaptador de `Usuario` y los providers del guard. `MikroOrmModule.forFeature([Usuario])` en el módulo; el puerto se vincula por token en `auth.repository-tokens.ts`, como ya se hace con `Rol` y `Permiso`.
- `src/common/presentation/`: guard, decorador `@Public()`, decorador `@ActorActual()` y el tipo de petición autenticada.
- **Entidades:** ninguna nueva ni modificada. `Usuario` ya tiene todo lo necesario.
- **Migraciones:** ninguna. Sin tabla de sesiones y sin columnas nuevas.
- **Configuración:** `AUTH_JWT_SECRET` obligatoria; el arranque falla si falta o es demasiado corta, en vez de firmar con un valor por defecto.

## Risks / Trade-offs

- **[Revocación]** Un token robado sigue siendo válido hasta que expira; el logout solo borra la cookie del cliente. → TTL corto y configurable (8 h por defecto), `Secure` en producción, y verificación de baja en cada petición, que es el caso de negocio realmente exigido.
- **[CSRF]** La cookie viaja automáticamente: `SameSite=Lax` bloquea el envío en peticiones cross-site no navegacionales, que es lo que cubre estos endpoints `POST`. → Riesgo residual aceptado y declarado; si aparecen operaciones de negocio con efectos amplios, se evalúa token CSRF.
- **[Costo por request]** Una lectura de `Usuario` con su rol y permisos en cada petición. → Se resuelve con un `populate` explícito del rol y sus permisos en el adaptador, y se mide en la prueba del adaptador; si el volumen lo exige, se cachea por rol, no por usuario.
- **[Memoria del hash]** `argon2id` reserva 19 MiB por verificación concurrente. → Con `p=1` y `t=2` cada login cuesta ~10 ms y el consumo es acotado; se mide en el test del adaptador y los parámetros quedan explícitos para poder ajustarlos.
- **[Secreto ausente]** Firmar con un valor por defecto convertiría un error de despliegue en una sesión falsificable. → El arranque falla con un mensaje explícito; el `.env` no se versiona.
- **[Dependencia nueva en el arnés]** `cookie-parser` y `@nestjs/jwt` entran a la matriz de e2e. → Se prueban sobre la app real creada desde `AppModule` y `main.ts`, no sobre módulos de sonda.

## Migration Plan

1. Agregar `AUTH_JWT_SECRET` al `.env` de cada entorno antes de desplegar; el arranque falla sin ella.
2. Instalar las dependencias nuevas.
3. Desplegar. Sin migraciones, no hay paso de esquema ni ventana de incompatibilidad: los endpoints son nuevos y `/api` ya existe.
4. **Rollback:** revertir el commit; no queda estado persistido que deshacer salvo las cookies emitidas, que expiran solas y dejan de servir cuando el guard desaparece.

## Open Questions

- **Origen del front-end:** si el cliente vive en otro origen, la cookie necesita `SameSite=None; Secure` y CORS con credenciales desde una lista de orígenes permitidos. No cambia el contrato ni el desglose de tareas; se resuelve cuando exista la configuración de CORS.
- **TTL definitivo de la sesión:** 8 h es una elección inicial; se ajusta con la operación real sin tocar specs ni tareas.
