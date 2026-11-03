# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `src/` no tiene ninguna entidad de dominio: solo `src/mock/mock.entity.ts`, creado para que MikroORM arranque, y ninguna migración aplicada en `src/migrations/`.
- `openspec/specs/` está vacío; `identidad-usuario` es la primera capacidad que se especifica.
- `AGENTS.md` §6 fija la auditoría como convención transversal, con las seis columnas **declaradas y completadas por cada entidad**, sin base abstracta ni suscriptor. El commit `b9144fd` retiró la base compartida que existía.
- `docs/agreements/arquitectura.md` §5.4 fija la convención de referencias entre agregados: la relación expone el identificador y la referencia al objeto, y ambos representan **una sola relación persistida**.
- **Divergencia documental detectada:** el modelo de `Analisis de dominio.md` describe `Alumno` y `Profesor` con `id, nombre, fechaIngreso, activo, profesorAsignado, observaciones`, pero `HU 16` a `HU 19` exigen además `fechaNacimiento`, `numeroDocumento`, `numeroTelefono` y `email`, y `RN-25` exige el par nombre + número de documento. `Usuario` no está en el lenguaje ubicuo aunque `RN-32`, `RN-33` y `RN-34` lo usan, y `Rol` y `Permiso` tampoco, aunque las reglas de acceso de `RN-11` y `RN-12` y las historias de administración distinguen quién puede hacer qué. Este cambio sincroniza la documentación; no interpreta que los atributos de las historias sean opcionales.
- Stack: NestJS 12, TypeScript 6 ESM, MikroORM 7.2.5 con `ReflectMetadataProvider`, PostgreSQL 18, Vitest 4 con `@swc-node/register`.

## Goals / Non-Goals

**Goals:**

- Dejar persistido y auditable el modelo de identidad y autorización que consumen `implement-login` y las historias de alta, baja y reactivación de alumnos y profesores.
- Fijar en PostgreSQL las unicidades, la coherencia de la baja lógica y la asignación de permisos, para que las invariantes no dependan de una lectura previa.
- Dejar documentado el lenguaje ubicuo de identidad antes de escribir los casos de uso.

**Non-Goals:**

- Autenticación, credenciales, hashing, cookies, JWT, guards y CSRF.
- Casos de uso, puertos de persistencia, implementaciones MikroORM, módulos NestJS, controllers y DTO.
- El alta del administrador inicial.
- La administración de roles y permisos por API.

## Decisions

### D1 — Cinco entidades en tres módulos, sin archivos de módulo todavía

`Usuario`, `Rol` y `Permiso` viven en `src/modules/auth/domain/entities/`; `Alumno` en `src/modules/alumnos/domain/entities/` y `Profesor` en `src/modules/profesores/domain/entities/`. Son raíces de agregado distintas, según `Analisis de dominio.md` y la partición por capacidad de `AGENTS.md` §5.1.

`Rol` y `Permiso` se quedan en `auth` porque la autorización es una sola capacidad de negocio y separarlos crearía módulos de una entidad sin consumidor propio: `AGENTS.md` §5.3 exige un submódulo por concepto solo para el catálogo, y ahí hay cinco historias independientes que lo justifican. Acá las tres piezas se consumen juntas en el mismo guard y el mismo caso de uso.

No se crea `*.module.ts` en este cambio: `AGENTS.md` §5.2 lo define como composition root que registra controllers y providers, y todavía no hay ninguno. MikroORM descubre las entidades por el glob de `src/**/*.entity.ts`, así que la migración y las pruebas no necesitan el módulo Nest.

**Alternativas descartadas:**

- Un único módulo `identidad` con las cinco entidades: reduce la importación cruzada, pero contradice la partición por capacidad y obliga a partir el módulo después.
- Submódulos `roles/` y `permisos/` dentro de `auth`: módulos de una entidad, sin controller ni caso de uso propio, alimentados solo por migración.
- Crear los `*.module.ts` ahora: archivos sin consumidores, que igual habría que completar después.

### D2 — `Rol` y `Permiso` son entidades persistidas, no un enum

`Rol` y `Permiso` son entidades con las seis columnas de auditoría, baja lógica y `codigo` único. `Usuario` referencia a `Rol` por clave foránea; no guarda un rol como texto ni como enum.

**Por qué:** decisión explícita del usuario. Además el modelo deja de codificar la autorización en el binario: agregar un rol o un permiso es un dato, no un despliegue, y la asignación rol-permiso queda auditable como cualquier otra escritura.

**Alternativas descartadas:**

- Un enum `Rol` en la entidad `Usuario`: era el diseño anterior, más simple, pero no permite asignar permisos ni auditarlos como datos.
- Un enum de TypeScript como fuente de verdad y una tabla espejo: dos fuentes que pueden divergir.

**Costo aceptado:** `Usuario` necesita que su rol exista antes de crearse; el alta de un alumno ya no es un `INSERT` de una fila, y el esquema no puede aplicarse sin cargar el catálogo. Se resuelve en D6.

### D3 — Los códigos de rol y de permiso son datos con constantes de código para el tipado

La base guarda `codigo` en mayúsculas con guiones bajos (`ADMINISTRADOR`, `CREAR_PLAN`). El código de la aplicación declara constantes con esos tres roles y esos tres permisos para las búsquedas y las comparaciones, y nunca decide autorización por el código del rol (D4).

**Por qué:** un `enum` de TypeScript como tipo de la propiedad persistida volvería a atar el modelo al binario, y un `string` suelto en cada llamada pierde el chequeo de tipos. Las constantes de búsqueda dan lo segundo sin lo primero; la fila sigue siendo la fuente de verdad.

**Alternativa descartada:** comparar contra literales `'PROFESOR'` dispersos en los casos de uso: un error de tipeo se descubre en ejecución.

### D4 — La autorización se decide por permiso, no por código de rol

Los permisos efectivos de un `Usuario` son la unión de los permisos de su rol, y una operación protegida exige un permiso. Ninguna regla de negocio compara el código del rol para decidir acceso; `RN-12` y `RN-35` —pertenencia al alumno y al profesor asignado— siguen siendo reglas de identidad que el caso de uso evalúa, no permisos.

**Por qué:** si el código compara roles, modelar `Permiso` no cambia nada y la asignación queda decorativa. Separar las dos cosas también evita inventar permisos para reglas de pertenencia, que dependen del recurso y no del rol.

**Alternativas descartadas:**

- Guards por rol (`RolesGuard` con una lista de códigos): más simple hoy, pero deja el catálogo de permisos sin efecto y obliga a recompilar para cambiar quién puede qué.
- Un permiso por endpoint: la matriz crece sin control y el permiso deja de nombrar una operación del negocio.

### D5 — La asignación rol-permiso pertenece a la raíz `Rol`

`Rol` es la raíz del agregado y expone su colección de `Permiso` mapeada como `@ManyToMany` **unidireccional** con `pivotTable: 'rol_permiso'`; la asignación se modifica a través de un método de `Rol`, que registra autor y momento de la edición en la propia fila del rol. `Permiso` es raíz de su propio agregado de catálogo y no conoce a los roles que lo usan. La tabla intermedia **no se declara a mano**: la genera MikroORM a partir de la colección, con clave primaria compuesta `(rol_id, permiso_id)`, y no es una entidad ni lleva auditoría propia.

**Por qué:** la invariante «un permiso no se repite dentro del mismo rol» vive en `Rol`, y quien la protege debe ser la raíz. Poner la colección en `Permiso` obligaría a dos agregados a escribir el mismo vínculo y a elegir cuál es el dueño. Delegar la tabla intermedia al ORM evita mantener a mano un esquema que ya está descrito por la relación, sin agregar una entidad para un vínculo que tiene dueño.

**Alcance del mapeo:** solo el lado `Rol` es dueño de la colección; `Permiso` no declara la relación inversa. El nombre de la tabla se fija explícitamente con `pivotTable` para que el DDL generado coincida con el del diseño y no dependa de la convención de nombres del ORM.

**Alternativas descartadas:**

- `ManyToMany` bidireccional con colección en ambas entidades: dos caminos de escritura para el mismo dato y ciclos de serialización.
- Una entidad `RolPermiso` con su propio repositorio y auditoría: un agregado más para representar un vínculo que ya tiene dueño.
- Declarar la tabla `rol_permiso` a mano en la migración: duplica en SQL algo que la relación ya describe y obliga a mantener los dos en sincronía.

### D6 — La carga inicial va en un seeder que ejecuta casos de uso del módulo `auth`

El catálogo inicial —tres roles, tres permisos y sus asignaciones— se carga con `yarn db:seed catalogo-identidad`. El entrypoint de `src/seeder/` solo resuelve los casos de uso y los ejecuta en orden; la creación, la validación y la auditoría viven en el módulo `auth`, nunca en el seeder (`AGENTS.md` §5.2).

**Consecuencia de alcance:** este cambio entrega la primera capa de aplicación del proyecto. `CreatePermisoUseCase` y `CreateRolUseCase`, sus puertos `IPermisoRepository` e `IRolRepository`, sus implementaciones MikroORM en `infrastructure/repositories/` y `AuthModule` como composition root. Es la excepción que `AGENTS.md` §5.2 admite: el borde de persistencia y el contrato nacen con su primer caso de uso.

**Idempotencia:** el seeder MUST poder repetirse. Cada caso de uso consulta su puerto por código y no escribe si la fila ya existe, así una segunda ejecución termina sin cambios y una ejecución interrumpida converge al repetirse.

**Atomicidad:** cada caso de uso escribe un solo agregado y su implementación abre la transacción (`AGENTS.md` §5.7). No hay una transacción única para el catálogo completo: si la ejecución se corta entre permisos y roles, la siguiente converge. Se prefiere eso a un puerto que cree dos raíces de agregado, que sería el caso de uso escondido en el repositorio.

**Actor de la auditoría:** el seeder es el proceso interno explícitamente declarado por `AGENTS.md` §6.2.2. Registra el momento del alta y deja `created_by_id` en `NULL`, porque todavía no existe ningún `Usuario` que pueda ser actor: el primer administrador necesita el hash de `implement-login`. No se inventa un usuario «sistema».

**Alternativas descartadas:**

- Insertar el catálogo en la migración: era el diseño anterior. Mezcla datos con esquema, no ejercita los casos de uso reales del módulo y obliga a que el `down` de esquema borre filas.
- Insertar el catálogo desde `seeder/` con `EntityManager` o SQL: salta el puerto de persistencia y no ejercita validación ni auditoría (`AGENTS.md` §5.2).
- Un usuario `sistema` como actor: `AGENTS.md` §6.2.2 lo prohíbe fuera del proceso interno declarado y exigiría una credencial que todavía no se puede generar.
- Una única transacción para todo el catálogo: obliga a un puerto que cree dos raíces de agregado.

**Asignaciones iniciales:**

| Rol | Permisos | Trazabilidad |
| --- | --- | --- |
| `ADMINISTRADOR` | `GESTIONAR_ALUMNOS`, `GESTIONAR_PROFESORES` | `HU 16`, `HU 17`, `HU 18`, `HU 19`, `HU 20`, `HU 21`, `HU 23`, `HU 24` |
| `PROFESOR` | `CREAR_PLAN` | `RN-11`, `HU 1` |
| `ALUMNO` | ninguno | sus operaciones dependen de su propia identidad (`RN-35`) |

**Deliberadamente fuera del catálogo:** la gestión del catálogo de ejercicios, que depende de `DW-13` y sigue abierta; y el acceso a los recursos propios, que es pertenencia y no permiso.

### D7 — El vínculo con el perfil se declara desde el perfil, no desde `Usuario`

`Alumno` y `Profesor` llevan `usuario` (muchos a uno, obligatorio, único por tabla) y `Usuario` solo lleva `rol`. Un `ADMINISTRADOR` no tiene fila de perfil.

**Por qué:** `Usuario` no necesita conocer qué perfil lo referencia; la relación obligatoria uno a uno se garantiza con un índice único sobre `usuario_id` en cada tabla de perfil, y así `Usuario` no gana una clave foránea polimórfica ni dos columnas nulas (`alumnoId`, `profesorId`) que se excluyan entre sí.

**Alternativas descartadas:**

- `Usuario.alumnoId` / `Usuario.profesorId` mutuamente excluyentes: dos columnas nullables y un `CHECK` que codifica el rol dos veces.
- `Usuario.perfilId` + discriminador: clave foránea polimórfica, que PostgreSQL no puede garantizar.

### D8 — El estado activo se deriva de la baja lógica

`Analisis de dominio.md` declara un atributo `activo(boolean)` para `Alumno` y `Profesor`. Ese atributo **no se persiste**: el registro está activo mientras su fecha de baja sea nula, y `RN-30` (reactivación) consiste en limpiar la baja. Lo mismo vale para `Usuario`, `Rol` y `Permiso`.

**Reactivación del profesor (decidido el 2026-11-03):** un `Profesor` dado de baja también puede reactivarse. La habilitación viene de `HU 25`, que incluye "reactivarla" entre las acciones sobre cualquier persona de la nómina; `RN-30` y `RN-31` son específicas del alumno y no lo contradicen. La reactivación no restaura asignaciones: `RN-27` deja a los alumnos sin profesor al darlo de baja, así que no hay vínculo que recuperar, y el profesor reactivado aparece en la nómina sin alumnos hasta que se lo reasigne.

**Acoplamiento perfil ↔ usuario (decidido el 2026-11-03):** el alta, la baja y la reactivación de un `Alumno` o de un `Profesor` ocurren en la **misma unidad de trabajo** que las de su `Usuario`, para que los dos estados no puedan divergir y `RN-34` no quede contradictorio con el perfil. Consecuencias:

- El caso de uso del perfil es el único punto de entrada de un `Usuario` que tiene perfil: no existe un comando que dé de baja o reactive ese `Usuario` por separado. Un `Usuario` sin perfil (`ADMINISTRADOR`) se activa y desactiva por sí mismo.
- El puerto de persistencia expone una operación con nombre propio —alta, baja y reactivación con usuario— y su implementación la envuelve en `em.transactional(...)`; el caso de uso no abre la transacción a mano (`AGENTS.md` §5.7).
- Las dos filas reciben el mismo actor y el mismo instante: la baja completa `deletedAt` y `deletedById` en ambas, la reactivación los limpia en ambas y la edición actualiza `updatedAt` y `updatedById` en ambas. La prueba de integración compara las dos filas, no solo el perfil.
- El caso de uso y su puerto viven en el módulo del perfil (`alumnos`, `profesores`); importan la entidad `Usuario` como vocabulario compartido de dominio (`D10`) y no providers internos de `auth` (`AGENTS.md` §5.4). La operación no introduce `forwardRef`.

**Alcance:** esta decisión obliga a los cambios que implementen `HU 16`–`HU 21` y `HU 24`; este cambio solo crea entidades y esquema, y no expone esos casos de uso.

**Por qué:** dos fuentes de estado (`activo` y baja lógica) pueden divergir, y `RN-34` prohíbe el acceso de un usuario dado de baja: si `activo` y la baja discrepan, la regla de acceso se vuelve ambigua. `AGENTS.md` §6.3 ya define la baja como el estado.

**Alternativas descartadas:**

- Persistir `activo` además de la fecha de baja: obliga a mantener dos escrituras sincronizadas en cada comando y no aporta ninguna consulta que la baja no resuelva.
- Un `enum` de estado (`ACTIVO`, `DADO_DE_BAJA`): mismo problema, con más superficie.

### D9 — Unicidades planas, sin índices parciales

- `usuario.email`: `UNIQUE` sobre el valor normalizado (recortado y en minúsculas).
- `rol.codigo` y `permiso.codigo`: `UNIQUE` sobre el código normalizado en mayúsculas.
- `alumno.numero_documento`: `UNIQUE` plano.
- `profesor.numero_documento`: `UNIQUE` plano.

**Por qué el documento solo y no el par nombre + documento:** `RN-25` nombra el par, pero un documento único por agregado **implica** el par único y satisface la regla siendo más estricta. `HU 16` y `HU 17` piden rechazar "igual nombre y número de documento que otro ya registrado", y la única forma legítima de corregir un nombre es editar la fila existente, no dar de alta una segunda. Además, el número de documento identifica a la persona: dos personas distintas con el mismo documento no existen en el alcance del sistema, así que la restricción más fuerte no bloquea ningún caso real. La contraparte práctica es que el índice compuesto exigía `lower(nombre)`, y `lower()` no resuelve acentos ni espacios internos: habría dado una sensación de unicidad que la base no garantiza.

**Por qué no índices parciales:** `AGENTS.md` §6.3 los pide cuando una clave debe poder reutilizarse después de la baja. Acá no corresponde: `RN-32` exige email único y `HU 16` y `HU 17` rechazan un email ya usado por otro usuario; liberar el email de una baja dejaría dos identidades con el mismo acceso y volvería ambiguo el login de `HU 14`. Además abre una elusión de `RN-34`: bastaría con crear un usuario nuevo con el email de alguien dado de baja para que ese email vuelva a autenticar. `RN-25` habla de alumnos y profesores *registrados* y el documento tampoco se recicla, porque `RN-33` usa el documento como credencial inicial; `RN-30` y `HU 24` resuelven el regreso por reactivación, no por un alta nueva. Un código de rol o de permiso reutilizado señalaría a otro conjunto de permisos con un historial de auditoría que ya no le corresponde. La unicidad plana es además la que rechaza el duplicado aunque dos comandos concurrentes pasen la lectura previa (`AGENTS.md` §5.7).

**Decisión confirmada por el usuario el 2026-11-03:** la unicidad del email es un requisito de autenticación —la base no debe admitir dos filas con el mismo email— y no se negocia por comodidad de reutilización. La misma sesión confirmó el `UNIQUE` por documento y la reactivación como único camino de regreso.

**Alternativas descartadas:**

- Índice único parcial `WHERE deleted_at IS NULL` en las cuatro claves: permitiría dos identidades con el mismo email, dos roles con el mismo código y un login indeterminado. Mantener la baja fuera de la restricción obliga además a reactivar para reingresar, que ya es la regla.
- `UNIQUE (lower(nombre), numero_documento)`: es el par de `RN-25`, pero es más débil que el documento solo —admite el mismo documento con otro nombre— y su normalización no cubre acentos ni espacios, así que deja la regla a medias.
- Validar la unicidad solo con una lectura previa: no resiste concurrencia.

### D10 — Referencias entre agregados con la clase de la entidad y acceso no persistido al identificador

`Usuario.rol`, `Alumno.profesorAsignado`, `Alumno.usuario`, `Profesor.usuario` y `Rol.permisos` se mapean como relaciones de MikroORM sobre la clase de la entidad; las referencias a un único objeto exponen el identificador mediante un accesor no persistido. `Usuario` no tiene la relación inversa con el perfil y `Permiso` no la tiene con los roles.

**Por qué:** `arquitectura.md` §5.4 exige exponer identificador y referencia sobre una única relación persistida, y prohíbe duplicarla en dos columnas. Importar la clase de la entidad de otro módulo es inevitable en un único bounded context con un ORM: lo que `AGENTS.md` §5.4 prohíbe es importar *providers* internos de otro módulo, y esta importación es de vocabulario de dominio compartido, no de implementación.

**Alternativas descartadas:**

- Persistir solo identificadores numéricos: cumple el borde entre módulos pero contradice la convención de `arquitectura.md` §5.4 y obliga a cada lectura a resolver la referencia a mano.
- Duplicar identificador y referencia: dos fuentes que pueden divergir, prohibido por la misma sección.

### D11 — Filtro global de baja lógica en la configuración de MikroORM

La configuración declara un filtro `bajaLogica` con condición «fecha de baja nula», activo por defecto, y las lecturas que necesiten el histórico lo desactivan explícitamente en la consulta.

**Por qué:** `AGENTS.md` §5.8 y §6.3 exigen que la exclusión de dados de baja la aplique la implementación del puerto y no cada consulta a mano; declararlo una vez en la configuración evita que cada lector futuro repita la condición y la olvide. Es verificable ahora aunque todavía no haya lectores.

**Alternativas descartadas:**

- Dejarlo para el primer puerto de lectura: cada lector nuevo podría omitirlo, y el filtro es precisamente la pieza que no debe depender de la memoria de quien escribe la consulta.
- Una columna de estado consultada a mano: vuelve a D8.

**Riesgo asumido:** el filtro por defecto oculta la fila dada de baja; la reactivación de `RN-30` debe desactivarlo explícitamente. Queda registrado como invariante de la prueba de persistencia.

### D12 — Las columnas de auditoría se declaran en cada entidad, sin base ni suscriptor

Cada una de las cinco entidades declara las seis columnas y las completa el flujo que la crea o la modifica. No hay clase base, mixin ni suscriptor.

**Por qué:** decisión explícita del usuario (la repetición se acepta) y `AGENTS.md` §6.2.1, que además descarta el suscriptor porque esconde el efecto y deja la auditoría fuera del caso de uso que la origina.

**Alternativa descartada:** base abstracta `@Entity({ abstract: true })` con las seis columnas y un suscriptor que las complete. Se implementó y se retiró en `b9144fd`.

### D13 — Columnas de actor nulas en la primera migración; `created_at` no

`created_at` es `NOT NULL` desde la primera migración: todo flujo que crea una fila lo completa, incluido el seeder. `created_by_id` es nullable porque el primer actor recién existe con `implement-login`; `updated_at`, `updated_by_id`, `deleted_at` y `deleted_by_id` son nullable por definición.

**Por qué:** `AGENTS.md` §8 pide definir la nulabilidad en el diseño. En este cambio no existe ningún `Usuario` que pueda ser actor del alta: el primer administrador se crea en `implement-login`, porque su hash necesita Argon2, y `AGENTS.md` §6.2.2 prohíbe inventar un usuario «sistema» fuera del proceso interno declarado (D6). Volver `created_by_id` `NOT NULL` ahora haría imposible el único alta que puede originar la cadena.

**Alternativas descartadas:**

- `created_by_id` con un valor centinela: inventa un actor, prohibido por §6.2.2.
- Dejar la migración para `implement-login`: separa el esquema del modelo y deja las entidades sin tabla verificable en este cambio.
- `created_at` nullable «por simetría»: permitiría filas sin momento de alta, que ninguna regla justifica.

**Confirmado por el usuario el 2026-11-03:** las filas del seed dejan `created_by_id` en `NULL`. Es la excepción de proceso interno de `AGENTS.md` §6.2.2 y se cierra en `implement-login`, cuando exista el primer `Usuario` que pueda ser actor.

### D14 — `fechaNacimiento` es fecha de calendario; el resto son instantes

`fechaNacimiento` se persiste como `date` sin zona; `fechaIngreso`, los momentos de auditoría y las marcas de baja como `timestamptz` en UTC.

**Por qué:** `AGENTS.md` §6.2.5 fija `timestamptz` para las fechas y habla de instantes; una fecha de nacimiento no es un instante y, guardada como `timestamptz`, un valor de medianoche se corre de día al leerse desde otra zona. Se registra la excepción de forma explícita porque el texto de §6.2.5 no la menciona.

**Alternativas descartadas:** `timestamptz` a medianoche UTC (desplaza el día); `text` con formato `YYYY-MM-DD` (pierde el tipo y la comparación de fechas).

**Confirmado por el usuario el 2026-11-03:** `fechaNacimiento` es `date` sin zona ni hora. La excepción a la letra de `AGENTS.md` §6.2.5 queda aceptada y justificada. En TypeScript se representa como cadena `YYYY-MM-DD` y no como `Date`, para no reintroducir la zona horaria al construirla desde el calendario.

### D15 — `numeroDocumento` es texto

Se persiste como `text`, no como entero, porque `RN-33` lo usa como contraseña inicial y un documento con ceros a la izquierda debe conservarlos.

**Alternativa descartada:** entero: pierde los ceros a la izquierda y cambia la credencial inicial.

### D16 — El email se normaliza en la entidad y se valida en el DTO

La entidad recorta espacios y pasa a minúsculas antes de comparar y persistir; el formato de email no se valida en este cambio. La validación de formato corresponde al DTO del alta (`AGENTS.md` §5.6), que no forma parte de este cambio. Los códigos de rol y de permiso se normalizan en mayúsculas por el mismo motivo.

**Por qué:** la unicidad sin distinguir mayúsculas es una invariante de identidad y no puede depender de que cada controller normalice; el formato es contrato de transporte.

### D17 — Restricciones de coherencia en la base

Cada tabla de entidad declara un `CHECK` que exige fecha y autor de baja juntos o ninguno, y el equivalente para autor y momento de edición. La tabla intermedia `rol_permiso` no necesita un `CHECK` de no duplicación: la clave primaria compuesta que emite el ORM desde el `@ManyToMany` ya lo impide. Las claves foráneas son `RESTRICT` en la baja física.

**Por qué:** `AGENTS.md` §6.1 lo exige como invariante y una escritura futura que saltee el caso de uso —o un `nativeUpdate`— no debe poder dejarla inconsistente.

### D18 — Retiro de `MockEntity`

Se elimina `src/mock/mock.entity.ts` y su referencia en el arnés de pruebas.

**Por qué:** existía solo para que el ORM tuviera una entidad; con entidades reales pierde función y su presencia permitiría que un filtro o una migración lo arrastren por accidente.

### D19 — Sincronización de la documentación de dominio

`Analisis de dominio.md` suma `Usuario`, `Rol` y `Permiso` al lenguaje ubicuo y al modelo, y completa los atributos de `Alumno` y `Profesor` con los que exigen `HU 16` a `HU 19`. Se registra que `activo` es el estado derivado de la baja lógica y que la autorización se decide por permiso.

**Por qué:** `AGENTS.md` §1 y §4 hacen de `docs/dominio/` la fuente del lenguaje ubicuo y prohíben renombrar conceptos solo en el código; dejar el modelo desactualizado haría que la próxima lectura del dominio contradiga las entidades.

## Modelo de datos

Los identificadores son `integer identity`, no `bigint`: el driver de PostgreSQL devuelve `bigint` como `string`, y `AGENTS.md` §6.1 fija `number` para los identificadores de auditoría. Los nombres de columna los genera `UnderscoreNamingStrategy` a partir de la propiedad en camelCase; las propiedades nullable declaran `type` explícito por la limitación de `ReflectMetadataProvider` registrada en `Risks`.

**`Usuario` — tabla `usuario`**

| Propiedad | Columna | Tipo PostgreSQL | Nullable | Restricción | Origen |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` | `integer identity` | no | PK | — |
| `email` | `email` | `text` | no | `UNIQUE`, normalizado a minúsculas | `RN-32`, `HU 16`, `HU 17` |
| `passwordHash` | `password_hash` | `text` | no | — | `RN-33`, `HU 14` |
| `rol` | `rol_id` | `integer` | no | FK → `rol(id)`, `ON DELETE RESTRICT` | `RN-32`, `HU 14` |
| `createdAt` | `created_at` | `timestamptz` | no | — | `AGENTS.md` §6.1 |
| `createdById` | `created_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1, D13 |
| `updatedAt` | `updated_at` | `timestamptz` | sí | `CHECK` de par con `updated_by_id` | §6.1 |
| `updatedById` | `updated_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1 |
| `deletedAt` | `deleted_at` | `timestamptz` | sí | `CHECK` de par con `deleted_by_id` | §6.3 |
| `deletedById` | `deleted_by_id` | `integer` | sí | FK → `usuario(id)` | §6.3 |

Derivados, sin columna: `activo` (fecha de baja nula) y `permisosEfectivos()` (unión de los permisos del rol).

**`Rol` — tabla `rol`**

| Propiedad | Columna | Tipo PostgreSQL | Nullable | Restricción | Origen |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` | `integer identity` | no | PK | — |
| `codigo` | `codigo` | `text` | no | `UNIQUE`, normalizado a mayúsculas | `RN-11`, `RN-12`, `RN-34` |
| `nombre` | `nombre` | `text` | no | — | `HU 14` |
| `descripcion` | `descripcion` | `text` | sí | — | — |
| `permisos` | — | tabla `rol_permiso` | — | N-M, modificable solo por la raíz | D5 |
| `createdAt` | `created_at` | `timestamptz` | no | — | §6.1 |
| `createdById` | `created_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1, D13 |
| `updatedAt` | `updated_at` | `timestamptz` | sí | `CHECK` de par con `updated_by_id` | §6.1 |
| `updatedById` | `updated_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1 |
| `deletedAt` | `deleted_at` | `timestamptz` | sí | `CHECK` de par con `deleted_by_id` | §6.3 |
| `deletedById` | `deleted_by_id` | `integer` | sí | FK → `usuario(id)` | §6.3 |

**`Permiso` — tabla `permiso`**

| Propiedad | Columna | Tipo PostgreSQL | Nullable | Restricción | Origen |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` | `integer identity` | no | PK | — |
| `codigo` | `codigo` | `text` | no | `UNIQUE`, normalizado a mayúsculas | `HU 16`–`HU 24`, `RN-11` |
| `nombre` | `nombre` | `text` | no | — | — |
| `descripcion` | `descripcion` | `text` | sí | — | — |
| `createdAt` | `created_at` | `timestamptz` | no | — | §6.1 |
| `createdById` | `created_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1, D13 |
| `updatedAt` | `updated_at` | `timestamptz` | sí | `CHECK` de par con `updated_by_id` | §6.1 |
| `updatedById` | `updated_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1 |
| `deletedAt` | `deleted_at` | `timestamptz` | sí | `CHECK` de par con `deleted_by_id` | §6.3 |
| `deletedById` | `deleted_by_id` | `integer` | sí | FK → `usuario(id)` | §6.3 |

**`rol_permiso` — tabla intermedia generada por el ORM, sin entidad**

| Columna | Tipo PostgreSQL | Nullable | Restricción |
| --- | --- | --- | --- |
| `rol_id` | `integer` | no | FK → `rol(id)`, `ON DELETE RESTRICT` |
| `permiso_id` | `integer` | no | FK → `permiso(id)`, `ON DELETE RESTRICT` |

Clave primaria compuesta `(rol_id, permiso_id)`, que es la que impide repetir un permiso dentro del rol. La tabla no se escribe a mano: la genera MikroORM desde el `@ManyToMany` unidireccional de `Rol` con `pivotTable: 'rol_permiso'`. Sin columnas de auditoría propias: el cambio de la colección actualiza `updated_at` y `updated_by_id` de la fila de `rol`.

**`Alumno` — tabla `alumno`**

| Propiedad | Columna | Tipo PostgreSQL | Nullable | Restricción | Origen |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` | `integer identity` | no | PK | — |
| `nombre` | `nombre` | `text` | no | — | `RN-25`, `HU 16`, `HU 18` |
| `fechaNacimiento` | `fecha_nacimiento` | `date` | no | — | `HU 16`, `HU 18` |
| `numeroDocumento` | `numero_documento` | `text` | no | `UNIQUE` | `RN-25`, `RN-33`, `HU 16` |
| `numeroTelefono` | `numero_telefono` | `text` | no | — | `HU 16`, `HU 18` |
| `fechaIngreso` | `fecha_ingreso` | `timestamptz` | no | — | `HU 16` |
| `observaciones` | `observaciones` | `text` | sí | — | `HU 16` |
| `profesorAsignado` | `profesor_asignado_id` | `integer` | sí | FK → `profesor(id)` | `RN-27`, `RN-28`, `RN-31` |
| `usuario` | `usuario_id` | `integer` | no | FK → `usuario(id)`, `UNIQUE` | `RN-32` |
| `createdAt` | `created_at` | `timestamptz` | no | — | §6.1 |
| `createdById` | `created_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1, D13 |
| `updatedAt` | `updated_at` | `timestamptz` | sí | `CHECK` de par con `updated_by_id` | §6.1 |
| `updatedById` | `updated_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1 |
| `deletedAt` | `deleted_at` | `timestamptz` | sí | `CHECK` de par con `deleted_by_id` | §6.3 |
| `deletedById` | `deleted_by_id` | `integer` | sí | FK → `usuario(id)` | §6.3 |

**`Profesor` — tabla `profesor`**

| Propiedad | Columna | Tipo PostgreSQL | Nullable | Restricción | Origen |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` | `integer identity` | no | PK | — |
| `nombre` | `nombre` | `text` | no | — | `RN-25`, `HU 17`, `HU 19` |
| `fechaNacimiento` | `fecha_nacimiento` | `date` | no | — | `HU 17`, `HU 19` |
| `numeroDocumento` | `numero_documento` | `text` | no | `UNIQUE` | `RN-25`, `RN-33`, `HU 17` |
| `numeroTelefono` | `numero_telefono` | `text` | no | — | `HU 17`, `HU 19` |
| `fechaIngreso` | `fecha_ingreso` | `timestamptz` | no | — | `HU 17` |
| `usuario` | `usuario_id` | `integer` | no | FK → `usuario(id)`, `UNIQUE` | `RN-32` |
| `createdAt` | `created_at` | `timestamptz` | no | — | §6.1 |
| `createdById` | `created_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1, D13 |
| `updatedAt` | `updated_at` | `timestamptz` | sí | `CHECK` de par con `updated_by_id` | §6.1 |
| `updatedById` | `updated_by_id` | `integer` | sí | FK → `usuario(id)` | §6.1 |
| `deletedAt` | `deleted_at` | `timestamptz` | sí | `CHECK` de par con `deleted_by_id` | §6.3 |
| `deletedById` | `deleted_by_id` | `integer` | sí | FK → `usuario(id)` | §6.3 |

**Notas de esquema:**

- La tabla `rol_permiso` la emite MikroORM a partir de la relación; la migración se genera con el ORM y solo se revisa. Si `pivotTable` no se fija explícitamente, el ORM elige otro nombre y el esquema se aparta del diseño: la prueba de esquema compara el DDL con la tabla de atributos.
- El único de identidad de `alumno` y `profesor` es `UNIQUE` sobre `numero_documento` y lo expresa el decorador de la entidad: no requiere índice funcional ni depende de la colación, los acentos o la capitalización del nombre. Es más estricto que `RN-25` y por eso la satisface.
- «Un `ADMINISTRADOR` no tiene perfil» no se puede expresar como `CHECK` —requiere leer otra tabla— y se garantiza en el caso de uso del alta, más la prueba de integración.
- La baja de un rol asignado a un `Usuario` no se bloquea por clave foránea: la baja es lógica y la fila sigue existiendo. Qué hacer con esos usuarios es una regla de `implement-login`, no de este esquema.

## Módulos, entidades y migraciones afectadas

- `src/modules/auth/domain/entities/usuario.entity.ts` — `Usuario`.
- `src/modules/auth/domain/entities/rol.entity.ts` — `Rol` y su colección de `Permiso`.
- `src/modules/auth/domain/entities/permiso.entity.ts` — `Permiso`.
- `src/modules/auth/domain/` — constantes de los códigos de rol y de permiso que usan el alta y la autorización.
- `src/modules/auth/domain/interfaces/rol.repository.interface.ts` y `permiso.repository.interface.ts` — puertos de escritura, con la consulta por código que hace idempotente la carga.
- `src/modules/auth/application/use-cases/create-permiso.use-case.ts` y `create-rol.use-case.ts` — los dos únicos casos de uso de este cambio.
- `src/modules/auth/infrastructure/repositories/mikro-orm-rol.repository.ts` y `mikro-orm-permiso.repository.ts` — implementaciones de los puertos.
- `src/modules/auth/auth.module.ts` — composition root: `MikroOrmModule.forFeature`, vínculo puerto → implementación y registro de los casos de uso.
- `src/modules/alumnos/domain/entities/alumno.entity.ts` — `Alumno`.
- `src/modules/profesores/domain/entities/profesor.entity.ts` — `Profesor`.
- `src/migrations/` — una migración nueva con las cinco tablas, la tabla intermedia `rol_permiso` generada por el ORM, índices únicos, claves foráneas y `CHECK` de coherencia. Sin datos.
- `src/seeder/` — entrypoint `catalogo-identidad` registrado en `registry.ts`.
- `src/app.module.ts` — importa `AuthModule`.
- `src/mikro-orm.config.ts` — filtro `bajaLogica` activo por defecto.
- `src/mock/mock.entity.ts` — se retira.
- `docs/dominio/Analisis de dominio.md` — lenguaje ubicuo y modelo de identidad y autorización.
- **Sin** controllers, DTO, `ValidationPipe` ni endpoints: la capa de aplicación existe para poder cargar el catálogo.

## Risks / Trade-offs

- **[Cambio de esquema de alto riesgo]** (`AGENTS.md` §8) Cinco tablas más la intermedia `rol_permiso` en una única migración, sin datos previos. → `down` elimina las tablas y las filas cargadas; no hay datos que perder. Se aplica y se revierte en una base temporal de prueba antes de integrar.
- **[Catálogo de permisos incompleto]** Solo se cargan los permisos con `RN`/`HU` explícitos; el de catálogo depende de `DW-13`. → Queda registrado como fuera de alcance; agregar un permiso es una fila nueva más su asignación, no un cambio de modelo.
- **[Seeder en dos pasos]** Si la carga se corta entre permisos y roles, el catálogo queda incompleto hasta repetirla. → La carga es idempotente y converge al reejecutarla; la prueba de integración la corre dos veces y verifica que la segunda no escribe.
- **[Seeder sin actor]** Las filas cargadas quedan con `created_by_id` nulo. → Es la excepción de proceso interno declarada en `AGENTS.md` §6.2.2 (D6) y queda visible en la auditoría; `implement-login` no vuelve a sembrar el catálogo.
- **[Importación cruzada de entidades entre módulos]** `alumno.entity.ts` importa `Profesor` y `Usuario`. → Decisión D10 con la justificación de `arquitectura.md` §5.4.
- **[Filtro por defecto y reactivación]** Una reactivación que olvide desactivar el filtro no encontrará la fila. → La prueba de persistencia cubre baja y reactivación con y sin filtro.
- **[Tabla intermedia emitida por el ORM]** `rol_permiso` depende de que `pivotTable` esté fijado y de que el ORM la genere en la migración. → El nombre se declara explícitamente en la relación y la prueba de esquema compara el DDL con el esperado.
- **[Unicidad plana del email, de los códigos y del documento]** Un email, un código o un documento de una fila dada de baja nunca se reutiliza. → Es la lectura de `RN-32` y `HU 16`/`HU 17` sobre el documento, y protege la unicidad del login, de la credencial inicial (`RN-33`) y de la auditoría. El reingreso es por reactivación (`RN-30`, `HU 24`); cambiarlo es un cambio de regla, no de esquema.
- **[Reactivación de profesor decidida sobre una base implícita]** `RN-30` y `RN-31` rigen al alumno y `HU 24` es específica de él; para el profesor la única mención es `HU 25`, que habilita "reactivarla" sobre cualquier persona de la nómina. → Decidido el 2026-11-03: el profesor se reactiva, sin reasignarle alumnos (`RN-27`), y su `Usuario` se reactiva en la misma unidad de trabajo (D8).
- **[Escritura atómica sobre dos módulos]** El caso de uso del perfil escribe también la fila de `Usuario`, que pertenece a `auth`. → El puerto del módulo del perfil expone una operación con nombre propio y abre la transacción él mismo (`AGENTS.md` §5.7); importa la entidad, no providers internos, y no introduce `forwardRef`. La prueba de integración compara las dos filas.
- **[Columnas de auditoría nulas]** `created_by_id` admite `NULL` hasta `implement-login`. → Se documenta en D13 y se cierra en ese cambio.
- **[`ReflectMetadataProvider` y uniones con `null`]** Un `string | null` se infiere como `Object` y la columna cae en `varchar`. → Toda propiedad nullable declara `type` explícito, y la prueba de esquema compara el DDL generado con el esperado.
- **[Fecha de nacimiento con tipo `date`]** Se aparta de la lectura literal de `AGENTS.md` §6.2.5. → Excepción registrada en D14 con su motivo.
- **[Autorización por permiso sin consumidor todavía]** El contrato de D4 se implementa en `implement-login`. → Queda especificado y probado en el modelo de datos; el guard llega con el endpoint.

## Migration Plan

1. Escribir las cinco entidades con sus invariantes y las pruebas de dominio en rojo.
2. Implementar las invariantes hasta verde, incluida la normalización de email, de códigos y la lectura de permisos efectivos.
3. Declarar los puertos de `Rol` y `Permiso`, implementarlos con MikroORM, registrar `AuthModule` en `AppModule` y escribir los dos casos de uso con sus pruebas de aplicación sobre dobles de los puertos.
4. Generar la migración con `yarn db:migration:create` y revisar el SQL: cinco tablas más la intermedia `rol_permiso` que emite el ORM desde el `@ManyToMany`, índices únicos sobre email, códigos y documento, claves foráneas, `CHECK` de baja y de edición, `date` para nacimiento y `timestamptz` para el resto. Revisar que no contenga datos.
5. Configurar el filtro `bajaLogica` y retirar `MockEntity`; ajustar el arnés de pruebas si lo referencia.
6. Registrar el entrypoint `catalogo-identidad` en `src/seeder/registry.ts` y verificar con la base temporal que dos ejecuciones consecutivas dejan el catálogo completo y sin duplicados.
7. Sincronizar `docs/dominio/Analisis de dominio.md` y `yarn check:docs`.
8. Ejecutar `yarn typecheck && yarn lint && yarn test` y registrar el resultado de cada comando.

**Rollback:** revertir los commits del cambio y ejecutar `yarn db:migration:down`, que elimina las tablas. No hay datos de producción ni dependientes: `implement-login` todavía no existe, y el catálogo cargado por el seeder desaparece con las tablas. Retirar el filtro `bajaLogica` es inocuo si no queda ninguna entidad.

## Testing Strategy

- **Dominio (unitario, junto al código):** invariantes de `Usuario` (email obligatorio y normalizado, rol obligatorio, hash presente, permisos efectivos), de `Rol` (código normalizado, permiso no repetido, asignación y remoción por la raíz) y de `Permiso` (código obligatorio); de `Alumno` (nombre y documento obligatorios, profesor opcional) y de `Profesor`. Trazabilidad en el nombre del test con `[RN-25]`, `[RN-32]`, `[RN-33]` y `[RN-34]` donde la regla se pueda verificar en la entidad.
- **Aplicación (unitaria, con dobles de los puertos):** los dos casos de uso verifican que un código ya existente no produce escritura, que el rol se construye con los permisos que resolvió el puerto, que la referencia a un permiso inexistente se rechaza antes de escribir y que la auditoría del alta queda con su momento y sin actor.
- **Persistencia (integración contra PostgreSQL 18 real con Testcontainers):** unicidad de email sin distinguir mayúsculas, unicidad de códigos de rol y de permiso, unicidad de documento por agregado —incluido que el mismo documento con distinto nombre también se rechaza y que el mismo documento convive entre un `Alumno` y un `Profesor`—, unicidad del vínculo de perfil, no duplicación de un permiso en el mismo rol, `CHECK` de coherencia de baja y de edición, baja lógica y reactivación con el filtro activo, y auditoría completa de alta, edición y baja.
- **Seeder (integración contra PostgreSQL 18 real):** ejecutar `yarn db:seed catalogo-identidad` sobre la base migrada deja los tres roles, los tres permisos y sus asignaciones; una segunda ejecución no agrega filas; y el rol `ALUMNO` queda con su conjunto de permisos vacío.
- **Esquema:** `up` y `down` de la migración en una base temporal, comparación del DDL generado con el esperado para detectar columnas que caigan en un tipo por defecto, y verificación de que la migración no inserta datos.
- **Sin e2e:** este cambio no expone HTTP.

## Open Questions

- Ninguna que bloquee la implementación. El permiso de gestión del catálogo queda pendiente de `DW-13` y fuera de alcance por eso. La unicidad plana del email y de los códigos de una fila dada de baja está confirmada por el usuario en D9; cambiarla es un cambio de regla de negocio (`RN-32`), no una decisión de diseño.
