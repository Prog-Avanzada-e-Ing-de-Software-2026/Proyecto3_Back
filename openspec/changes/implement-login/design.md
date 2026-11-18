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

### D1 — Dos JWT en cookies legibles por JavaScript, sin estado en el servidor

La sesión son dos JWT firmados con HS256 en cookies `SameSite=Lax`, `Secure` en producción y **sin `httpOnly`**:

| Cookie | Contenido | Vida | `Path` | Secreto |
| --- | --- | --- | --- | --- |
| `access` | `sub`, `tipo: 'access'` | `AUTH_ACCESS_TTL_SEGUNDOS` (900) | `/` | `AUTH_JWT_SECRET_ACCESS` |
| `refresh` | `sub`, `tipo: 'refresh'` | `AUTH_REFRESH_TTL_SEGUNDOS` (604800) | `/api/auth` | `AUTH_JWT_SECRET_REFRESH` |

Los dos vencimientos y los dos secretos se leen del entorno. Los secretos son **obligatorios y distintos**: con uno compartido, un access filtrado permitiría firmar un refresh. El `tipo` va además dentro del token y se compara al verificar, así que la separación es doble: firma distinta y contenido distinto.

**Por qué:** decisión del usuario. El cierre de sesión se resuelve en el front, y para que el front pueda **borrar** las cookies no pueden ser `httpOnly`.

**Consecuencias asumidas, explícitas y verificadas en pruebas:**

- Un XSS puede **leer** las dos cookies. La elección lo acepta; se verifica en el e2e que ninguna lleve `HttpOnly`.
- **No hay revocación**: sin tabla y sin rotación, borrar la cookie solo afecta a ese navegador. Un refresh copiado sigue sirviendo hasta siete días. El logout del front no invalida nada del lado del servidor.
- El guard y `/refresh` **leen el `Usuario` de la base** en cada uso: `RN-34` exige que la baja corte el acceso, y un token sin estado no lo sabe. Con esa lectura, lo que el JWT ahorra es la tabla, no la consulta.

**Alternativas descartadas:**

- **Cookies `httpOnly` + `POST /logout` que las expire:** protegía los tokens de XSS y hacía el cierre real, pero el usuario decidió que el logout sea del front y no del back.
- **Refresh con `jti` y tabla de revocación + rotación:** habilitaba logout real y detección de reuso. Descartada explícitamente: «no quiero tablas ni nada».
- **Sesión opaca en tabla:** revocación inmediata, pero con el mismo costo por petición y una tabla que el usuario descartó.
- **JWT `Bearer` en cabecera:** el cliente decide dónde guardarlo; ya no aportaba nada frente a una cookie legible.

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

### D6 — `IUsuarioRepository` excluye la baja y la excepción es explícita

Las lecturas habituales del puerto (`findByEmail`, `findById`) excluyen a los usuarios dados de baja, como el resto del modelo (`AGENTS.md` §5.8 y §6.3). La unicidad del email usa la variante explícita `findByEmailIncluyendoBaja`, porque el email no se libera con la baja.

**Por qué:** el filtro de baja pertenece a la implementación del puerto y no a cada consulta; el método que sí mira la baja lo declara en la firma. Login, guard y `/refresh` ya no repiten `estaActivo()` sobre el usuario: si la lectura no lo devuelve, el rechazo es el genérico y el cliente sigue sin poder distinguir la causa (`HU 14`), porque el mensaje es el mismo. El rol sí se chequea explícitamente: un rol dado de baja deja sin acceso a sus usuarios.

**Alternativas descartadas:**

- **Que el puerto devuelva siempre el agregado y cada caso de uso chequee `estaActivo()`:** reparte el filtro por la aplicación, contradice §5.8 y obliga a acordarse en cada lector nuevo.
- **Un puerto de lectura aparte solo para la baja:** un contrato por lectura, que es el antipatrón de §5.9.

### D7 — Contrato de los dos endpoints de sesión

- `POST /api/auth/login`, cuerpo `{ email, password }` → `200` con `{ id, email, rol, permisos }` y las dos cookies.
- `POST /api/auth/refresh`, sin cuerpo → `200` con la misma proyección y **solo** la cookie `access` renovada.

Los dos son `@Public()`: el guard no puede exigir un access válido para renovar un access vencido. `/refresh` se autentica con la cookie `refresh`, cuyo `tipo` se compara dentro del token.

`/refresh` vuelve a leer el `Usuario` y lo rechaza si está dado de baja o si su rol lo está (`RN-34`): un refresh de siete días sería si no la forma de sobrevivir a la baja.

**`logout` no existe.** Decisión del usuario: el cierre de sesión se resuelve en el front, que borra las dos cookies porque son legibles. El back no participa y, como no hay estado, tampoco podría invalidar el refresh.

**Alternativas descartadas:**

- **`logout` protegido que expire las cookies:** era el diseño anterior; el usuario decidió que el cierre pertenece al cliente.
- **`/refresh` que también rote el refresh:** sin tabla no hay forma de invalidar el anterior, así que la rotación sería cosmética y agregaría una cookie por request sin beneficio.
- **`GET /api/auth/me`:** no lo pide `HU 14` y el login y `/refresh` ya devuelven rol y permisos; sería un endpoint sin consumidor.

### D8 — `ValidationPipe` y Swagger entran acá

`ValidationPipe` global con `{ transform: true, whitelist: true }` en `src/main.ts`, sin `forbidNonWhitelisted` (`AGENTS.md` §5.6 y §6.2 regla 3). Swagger se registra con título y versión internos del proyecto, y se publica en `/api/docs`. El prefijo global **no** se aplica a la ruta de la documentación: `SwaggerModule.setup` usa su propio path, y por eso `/api/docs` se declara explícitamente y convive con `/api/auth/*` sin colisión.

**Por qué:** `setup-http-foundation` lo condicionó al primer endpoint, y este es el primer endpoint.

### D9 — Módulos, entidades y migraciones afectadas

- `auth.module.ts`: registra `AuthController`, los dos casos de uso, el adaptador de `Usuario` y los providers del guard. `MikroOrmModule.forFeature([Usuario])` en el módulo; el puerto se vincula por token en `auth.repository-tokens.ts`, como ya se hace con `Rol` y `Permiso`.
- `src/common/presentation/`: guard, decorador `@Public()`, decorador `@ActorActual()` y el tipo de petición autenticada.
- **Entidades:** ninguna nueva ni modificada. `Usuario` ya tiene todo lo necesario.
- **Migraciones:** ninguna. Sin tabla de sesiones y sin columnas nuevas.
- **Configuración:** `AUTH_JWT_SECRET_ACCESS` y `AUTH_JWT_SECRET_REFRESH` obligatorios, distintos y de al menos 32 caracteres; `AUTH_ACCESS_TTL_SEGUNDOS` y `AUTH_REFRESH_TTL_SEGUNDOS` con valor por defecto. El arranque falla ante cualquier valor inválido en vez de caer a un default en silencio.

## Risks / Trade-offs

- **[XSS y tokens legibles]** Las dos cookies viajan sin `httpOnly`, así que cualquier script en la página puede leerlas y exfiltrarlas. → Decisión explícita del usuario para que el front pueda cerrar sesión solo. Se asume como riesgo aceptado; la mitigación disponible es sanear el cliente, no el back.
- **[Revocación]** Sin tabla ni rotación, un refresh copiado sigue siendo válido siete días y el logout del front no lo invalida en el servidor. → Aceptado: el caso de negocio que sí se cubre es la baja del usuario (`RN-34`), que el guard y `/refresh` verifican contra la base.
- **[Access de 15 minutos]** El front tiene que llamar a `/refresh` y reintentar cuando recibe `401`; sin ese reintento, la sesión se corta cada cuarto de hora. → Contrato documentado en `D7`; el `401` con `SESION_INVALIDA` es la señal única para refrescar.
- **[CSRF]** Las cookies viajan automáticamente: `SameSite=Lax` bloquea el envío en peticiones cross-site no navegacionales, que es lo que cubren los dos `POST`. → Riesgo residual aceptado y declarado; si aparecen operaciones de negocio con efectos amplios, se evalúa token CSRF.
- **[Costo por request]** Una lectura de `Usuario` con su rol y permisos en cada petición. → `populate` explícito en el adaptador y medición en su prueba; si el volumen lo exige, se cachea por rol, no por usuario.
- **[Memoria del hash]** `argon2id` reserva 19 MiB por verificación concurrente. → Con `p=1` y `t=2` cada login cuesta ~10 ms y el consumo es acotado; los parámetros quedan explícitos para poder ajustarlos.
- **[Secretos ausentes o iguales]** Firmar con un valor por defecto, o compartir el secreto entre los dos tipos, convertiría un error de despliegue en una sesión falsificable o anularía la separación. → El arranque falla con un mensaje explícito; el `.env` no se versiona.
- **[Arnés duplicado]** `test/auth.e2e-spec.ts` repite el prefijo, el `ValidationPipe`, `cookie-parser` y Swagger de `main.ts`. → `main.ts` arranca al importarse y no se puede reutilizar; la duplicación está documentada y cubierta por pruebas de contrato.

## Migration Plan

1. Agregar `AUTH_JWT_SECRET` al `.env` de cada entorno antes de desplegar; el arranque falla sin ella.
2. Instalar las dependencias nuevas.
3. Desplegar. Sin migraciones, no hay paso de esquema ni ventana de incompatibilidad: los endpoints son nuevos y `/api` ya existe.
4. **Rollback:** revertir el commit; no queda estado persistido que deshacer salvo las cookies emitidas, que expiran solas y dejan de servir cuando el guard desaparece.

## Open Questions

- **Origen del front-end:** si el cliente vive en otro origen, la cookie necesita `SameSite=None; Secure` y CORS con credenciales desde una lista de orígenes permitidos. No cambia el contrato ni el desglose de tareas; se resuelve cuando exista la configuración de CORS.
- **TTL definitivo de la sesión:** 8 h es una elección inicial; se ajusta con la operación real sin tocar specs ni tareas.
