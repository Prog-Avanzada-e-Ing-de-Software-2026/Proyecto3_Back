# Estado del cambio `add-usuario-identity`

**Fecha de corte:** 2026-11-02
**Última revisión:** 2026-11-03 — el usuario respondió las dudas de modelo: `created_by_id` nulo en el seed, `fechaNacimiento` como `date`, unicidad plana del email y de los códigos (con reactivación como único reingreso), `UNIQUE` solo sobre `numero_documento` en lugar del par con nombre, la tabla N-M delegada al ORM, la reactivación de profesor aceptada y el acoplamiento perfil ↔ `Usuario` en una única unidad de trabajo. Quedan abiertas la aprobación de implementación, `DW-13` y el archivado previo.
**Rama:** `feature/add-usuario-identity` (apilada sobre `feature/setup-http-foundation`, upstream configurado en `origin`)
**Estado:** planificación cerrada y validada. **La implementación no empezó**: `AGENTS.md` §3.7 separa planificación de implementación y falta la aprobación explícita del usuario.

## 1. Dónde vive cada cosa

| Archivo | Contenido |
| --- | --- |
| `openspec/changes/add-usuario-identity/proposal.md` | Por qué, qué cambia, capacidades, impacto y **fuera de alcance** explícito. |
| `openspec/changes/add-usuario-identity/specs/identidad-usuario/spec.md` | **16 requisitos** con escenarios `WHEN/THEN`, trazados a `RN-nn` y `HU-n`. |
| `openspec/changes/add-usuario-identity/design.md` | **19 decisiones** (`D1` a `D19`) con alternativas descartadas, **tablas de atributos por entidad** (§ *Modelo de datos*), módulos afectados, riesgos, rollback y estrategia de pruebas. |
| `openspec/changes/add-usuario-identity/tasks.md` | **18 tareas** en 7 secciones, cada una con su prueba asociada y el requisito que la origina. |
| `openspec/changes/add-usuario-identity/estado.md` | Este archivo: estado operativo, revisión de decisiones abiertas y resumen del modelo de datos. |
| `docs/temp/plan_auth_logging_proyecto3.md` | Plan general de auth y logging del que sale este cambio (etapas 3–6). |

Validación vigente: `openspec validate add-usuario-identity --strict` → **valid**.

## 2. Estado del repositorio

- Rama actual `feature/add-usuario-identity`, con upstream `origin/feature/add-usuario-identity`.
- Últimos commits de la rama: `b9144fd` (retira la base auditable compartida), `49b9624` (entrypoint de seeds), `380dd13` (base auditable), `b238fd1` (auditoría nullable y numérica).
- **Commiteado** en `feature/add-usuario-identity`, en el commit `docs(openspec): propose add-usuario-identity change`. Para seguir desde otra PC falta el **push**: un commit local no viaja.
- `openspec/changes/setup-http-foundation`: completo (14/14 tareas) y **sin archivar**. Pendiente de `openspec archive setup-http-foundation` cuando el usuario lo autorice.
- `develop` no existe todavía en el clon local; la rama está apilada sobre `feature/setup-http-foundation`, no sobre `develop` como pide `AGENTS.md` §10.

## 3. Decisiones tomadas, con su motivo

Todas están desarrolladas en `design.md`; acá solo el índice para ubicarlas rápido.

**Modelo**

- `D1` Cinco entidades en tres módulos (`auth` con `Usuario`, `Rol` y `Permiso`; `alumnos`; `profesores`). Sin `*.module.ts` salvo `auth`, que sí lo necesita por los casos de uso del seeder.
- `D2` `Rol` y `Permiso` son **entidades persistidas**, no un enum. Decisión explícita del usuario.
- `D3` Los códigos (`ADMINISTRADOR`, `CREAR_PLAN`, …) son datos; el código de la aplicación declara constantes solo para tipar búsquedas.
- `D4` La autorización se decide por **permiso**, no comparando el código del rol. `RN-12` y `RN-35` son pertenencia, no permisos.
- `D5` La asignación rol-permiso pertenece a la raíz `Rol`; la tabla intermedia la genera el ORM desde un `@ManyToMany` unidireccional con `pivotTable: 'rol_permiso'`, sin entidad y sin auditoría propia. Decisión explícita del usuario.
- `D7` El vínculo 1-a-1 con el perfil vive en `Alumno`/`Profesor` (`usuario_id UNIQUE`); `Usuario` solo tiene `rol`.
- `D8` El estado activo se **deriva** de la baja lógica; no se persiste un booleano `activo`. El alta, la baja y la reactivación de un perfil y de su `Usuario` comparten la misma unidad de trabajo.
- `D9` Unicidades **planas** (email, código de rol, código de permiso, nombre+documento): ninguna clave de identidad se reutiliza después de una baja.
- `D10` Referencias entre agregados con la clase de la entidad y accesor no persistido del identificador (`arquitectura.md` §5.4).
- `D14` `fechaNacimiento` es `date` sin zona — **excepción deliberada** a la letra de `AGENTS.md` §6.2.5.
- `D15` `numeroDocumento` es `text` para conservar ceros a la izquierda (`RN-33` lo usa como contraseña inicial).
- `D16` El email se normaliza en la entidad; el formato se valida en el DTO de un cambio posterior.
- `D19` `docs/dominio/Analisis de dominio.md` se sincroniza: `Usuario`, `Rol` y `Permiso` entran al lenguaje ubicuo y `Alumno`/`Profesor` suman los atributos de `HU 16`–`HU 19`.

**Persistencia**

- `D6` La carga inicial va en el **seeder** `catalogo-identidad`, sobre dos casos de uso del módulo `auth`; es idempotente y no hay transacción única para todo el catálogo. Decisión explícita del usuario (reemplaza la carga por migración).
- `D11` Filtro global `bajaLogica` en MikroORM activo por defecto.
- `D12` Las columnas de auditoría se declaran en **cada** entidad, sin base abstracta ni suscriptor.
- `D13` `created_at` no nulo; columnas de actor nullables hasta `implement-login`.
- `D17` `CHECK` de coherencia de baja y de edición en cada tabla.
- `D18` Se retira `MockEntity`.
- Identificadores `integer identity`, no `bigint` (el driver devuelve `bigint` como `string`).

**Carga inicial**

| Rol | Permisos | Trazabilidad |
| --- | --- | --- |
| `ADMINISTRADOR` | `GESTIONAR_ALUMNOS`, `GESTIONAR_PROFESORES` | `HU 16`–`HU 21`, `HU 23`, `HU 24` |
| `PROFESOR` | `CREAR_PLAN` | `RN-11`, `HU 1` |
| `ALUMNO` | ninguno | sus operaciones son por identidad (`RN-35`) |

## 4. Decisiones abiertas — revisión del 2026-11-03

Se presentaron al usuario el 2026-11-02 y respondió el 2026-11-03. Cinco quedaron cerradas; tres siguen abiertas.

| # | Punto | Decisión vigente | Estado |
| --- | --- | --- | --- |
| 1 | Aprobación para implementar | — | **Pendiente** — es el único bloqueante real (`AGENTS.md` §3.7) |
| 2 | Catálogo de permisos y `DW-13` | Tres permisos; el de gestión de catálogo queda fuera | **Pendiente** — decisión de producto, no de este cambio |
| 3 | `created_by_id` nulo en las filas del seed | `NULL` (`D6`, `D13`) | **Resuelto 2026-11-03** |
| 4 | `fechaNacimiento` como `date` | `date` sin zona ni hora (`D14`) | **Resuelto 2026-11-03** |
| 5 | Unicidad del email, de los códigos y del documento | `UNIQUE` plano, sin índice parcial; el documento solo, sin el par con nombre (`D9`) | **Resuelto 2026-11-03** |
| 6 | Mapeo N-M rol-permiso | `@ManyToMany` unidireccional en `Rol` con `pivotTable: 'rol_permiso'` (`D5`) | **Resuelto 2026-11-03** |
| 7 | Reactivación de profesor | Permitida, sin reasignarle alumnos (`D8`) | **Resuelto 2026-11-03** |
| 8 | Rama base y cambio anterior | Apilada sobre `feature/setup-http-foundation`, completo y sin archivar | **Pendiente** |

**Detalle de lo resuelto:**

- **Punto 3 — auditoría del seed.** Las filas cargadas quedan con `created_by_id` en `NULL`. Es la excepción de proceso interno declarada en `AGENTS.md` §6.2.2 y se cierra en `implement-login`, cuando exista el primer `Usuario` que pueda ser actor.
- **Punto 4 — `fechaNacimiento`.** Se persiste como `date`: una fecha de nacimiento no es un instante y como `timestamptz` a medianoche UTC se corre de día al leerse desde otra zona. Excepción registrada a la letra de `AGENTS.md` §6.2.5.
- **Punto 5 — unicidad del email.** `UNIQUE` plano. La base no admite dos filas con el mismo email: liberarlo en una baja haría ambiguo el login de `HU 14` y permitiría eludir `RN-34` creando un usuario nuevo con el email de alguien dado de baja. El regreso se resuelve por reactivación (`RN-30`, `HU 24`). Un código de rol o de permiso tampoco se recicla: se reactiva. **El documento se declara `UNIQUE` solo, sin el par con nombre:** un documento único por agregado implica el par de `RN-25`, el documento identifica a la persona, y así el índice no depende de acentos ni de capitalización. El mismo documento puede existir a la vez en un `Alumno` y en un `Profesor`.
- **Punto 6 — tabla N-M.** La genera MikroORM desde la colección de `Rol`; no se declara a mano y no es entidad. Se mantiene unidireccional, con el único camino de escritura en la raíz. Si el vínculo necesitara columnas propias (quién y cuándo asignó), recién ahí tendría que ser entidad.
- **Punto 7 — reactivación de profesor.** Se acepta: un `Profesor` dado de baja puede reactivarse, igual que un alumno. La base es `HU 25`, que incluye "reactivarla" sobre cualquier persona de la nómina; `RN-30` y `RN-31` son del alumno y no se oponen. No se le reasignan alumnos, porque `RN-27` ya los dejó sin profesor al darlo de baja. **El perfil y su `Usuario` se activan y desactivan en la misma unidad de trabajo:** el caso de uso del perfil es el único punto de entrada, el puerto abre la transacción, y las dos filas reciben el mismo actor y el mismo instante. Un `Usuario` sin perfil se administra por sí mismo.

**Detalle de lo abierto:**

- **Punto 2 — catálogo de permisos.** El cambio carga `GESTIONAR_ALUMNOS`, `GESTIONAR_PROFESORES` y `CREAR_PLAN`. La pregunta abierta (`DW-13`) es quién gestiona máquinas, ejercicios, categorías, objetivos y unidades: Administrador, Profesor o ambos. Mientras no se responda, el permiso correspondiente no existe y `AD-04` queda indefinido. Agregar un permiso después es una fila nueva más su asignación, no un cambio de modelo ni de esquema.
- **Punto 8 — operativo.** `feature/add-usuario-identity` está apilada sobre `feature/setup-http-foundation`. `AGENTS.md` §10 dice que `feature/*` nace de `develop`, y `develop` no existe localmente. Archivar `setup-http-foundation` sincroniza los specs principales y es el paso natural antes de abrir la implementación.

**Recomendación en bloque:** el modelo ya está cerrado; archivar `setup-http-foundation` para cerrar el ciclo anterior y después implementar. `DW-13` queda para cuando se decida producto.

## 5. Atributos de las entidades

Resumen derivado de `design.md` § *Modelo de datos*. **Ante discrepancia manda `design.md`.** Los ids son `integer identity`, no `bigint`: el driver devuelve `bigint` como `string` y `AGENTS.md` §6.1 fija `number` para la auditoría.

### Atributos de dominio

| Entidad | Propiedad | Columna | Tipo PG | Null | Restricción |
| --- | --- | --- | --- | --- | --- |
| **`Usuario`** (`usuario`) | `id` | `id` | `integer identity` | no | PK |
| | `email` | `email` | `text` | no | `UNIQUE`, normalizado a minúsculas |
| | `passwordHash` | `password_hash` | `text` | no | — |
| | `rol` | `rol_id` | `integer` | no | FK → `rol(id)` `ON DELETE RESTRICT` |
| **`Rol`** (`rol`) | `id` | `id` | `integer identity` | no | PK |
| | `codigo` | `codigo` | `text` | no | `UNIQUE`, normalizado a mayúsculas |
| | `nombre` | `nombre` | `text` | no | — |
| | `descripcion` | `descripcion` | `text` | sí | — |
| | `permisos` | — | N-M vía `rol_permiso`, emitida por el ORM | — | modificable solo por la raíz (`D5`) |
| **`Permiso`** (`permiso`) | `id` | `id` | `integer identity` | no | PK |
| | `codigo` | `codigo` | `text` | no | `UNIQUE`, normalizado a mayúsculas |
| | `nombre` | `nombre` | `text` | no | — |
| | `descripcion` | `descripcion` | `text` | sí | — |
| **`Alumno`** (`alumno`) | `id` | `id` | `integer identity` | no | PK |
| | `nombre` | `nombre` | `text` | no | — |
| | `fechaNacimiento` | `fecha_nacimiento` | `date` | no | — |
| | `numeroDocumento` | `numero_documento` | `text` | no | `UNIQUE` |
| | `numeroTelefono` | `numero_telefono` | `text` | no | — |
| | `fechaIngreso` | `fecha_ingreso` | `timestamptz` | no | — |
| | `observaciones` | `observaciones` | `text` | sí | — |
| | `profesorAsignado` | `profesor_asignado_id` | `integer` | sí | FK → `profesor(id)` |
| | `usuario` | `usuario_id` | `integer` | no | FK → `usuario(id)`, `UNIQUE` |
| **`Profesor`** (`profesor`) | `id` | `id` | `integer identity` | no | PK |
| | `nombre` | `nombre` | `text` | no | — |
| | `fechaNacimiento` | `fecha_nacimiento` | `date` | no | — |
| | `numeroDocumento` | `numero_documento` | `text` | no | `UNIQUE` |
| | `numeroTelefono` | `numero_telefono` | `text` | no | — |
| | `fechaIngreso` | `fecha_ingreso` | `timestamptz` | no | — |
| | `usuario` | `usuario_id` | `integer` | no | FK → `usuario(id)`, `UNIQUE` |

### Auditoría — las seis columnas, idénticas en las cinco entidades

| Propiedad | Columna | Tipo PG | Null | Restricción |
| --- | --- | --- | --- | --- |
| `createdAt` | `created_at` | `timestamptz` | **no** | — |
| `createdById` | `created_by_id` | `integer` | sí | FK → `usuario(id)` |
| `updatedAt` | `updated_at` | `timestamptz` | sí | `CHECK` de par con `updated_by_id` |
| `updatedById` | `updated_by_id` | `integer` | sí | FK → `usuario(id)` |
| `deletedAt` | `deleted_at` | `timestamptz` | sí | `CHECK` de par con `deleted_by_id` |
| `deletedById` | `deleted_by_id` | `integer` | sí | FK → `usuario(id)` |

### Tabla intermedia `rol_permiso` — generada por el ORM, sin entidad

| Columna | Tipo PG | Null | Restricción |
| --- | --- | --- | --- |
| `rol_id` | `integer` | no | FK → `rol(id)` `ON DELETE RESTRICT` |
| `permiso_id` | `integer` | no | FK → `permiso(id)` `ON DELETE RESTRICT` |

PK compuesta `(rol_id, permiso_id)` — es lo que impide repetir un permiso dentro del rol. La tabla la emite MikroORM desde el `@ManyToMany` unidireccional de `Rol` con `pivotTable: 'rol_permiso'`; no se declara a mano. **No lleva auditoría propia:** asignar o quitar permisos actualiza `updated_at` y `updated_by_id` de la fila de `rol`.

### Atributos derivados, sin columna

| Entidad | Atributo | Cómo se obtiene |
| --- | --- | --- |
| Todas | `activo` | `deletedAt IS NULL` (`D8`) |
| `Usuario` | `permisosEfectivos()` | unión de los permisos de su `rol` (`D4`) |

### Índices escritos a mano en la migración

Los decoradores de MikroORM no expresan expresiones, así que estos van en el SQL:

- Los dos `CHECK` de coherencia (baja y edición) en las cinco tablas.

### Únicos que no requieren SQL a mano

- `UNIQUE` planos de `usuario.email`, `rol.codigo`, `permiso.codigo`, `alumno.numero_documento`, `profesor.numero_documento`, `alumno.usuario_id` y `profesor.usuario_id`. Los expresa el decorador de cada entidad.

### Límites que el esquema no puede expresar

- «Un `ADMINISTRADOR` no tiene perfil» requiere leer otra tabla: no se puede como `CHECK`, se garantiza en el caso de uso del alta más la prueba de integración.
- La baja de un rol asignado a un `Usuario` no la bloquea la clave foránea: la baja es lógica y la fila sigue existiendo. Qué hacer con esos usuarios es una regla de `implement-login`, no de este esquema.

## 6. Próximos pasos, en orden

1. Aprobar la implementación y decidir el archivado de `setup-http-foundation`. El modelo ya está cerrado: no queda ninguna decisión de diseño pendiente.
2. Archivar `setup-http-foundation` (`openspec archive setup-http-foundation`) cuando el usuario lo autorice.
3. Implementar siguiendo `tasks.md` de punta a punta. Las secciones 1–2 son test-first (RED → GREEN); la migración de la sección 3 se revisa a mano por los `CHECK` de coherencia y la tabla intermedia emitida por el ORM.
4. Verificación de cierre: `yarn typecheck && yarn lint && yarn test`, más la suite de integración contra PostgreSQL 18 con Testcontainers (`yarn db:seed catalogo-identidad` se prueba dos veces seguidas).
5. `openspec validate add-usuario-identity --strict`.
6. Archivar solo con todas las tareas verificadas.

## 7. Cómo retomar

```bash
git checkout feature/add-usuario-identity
git pull
openspec status --change add-usuario-identity
openspec validate add-usuario-identity --strict
```

Después leer, en este orden: este archivo → `proposal.md` → `specs/identidad-usuario/spec.md` → `design.md` (§ *Decisiones* y § *Modelo de datos*) → `tasks.md`.

## 8. Archivos que tocará la implementación

```text
src/modules/auth/
├── auth.module.ts
├── domain/
│   ├── entities/{usuario,rol,permiso}.entity.ts
│   └── interfaces/{rol,permiso}.repository.interface.ts
├── application/use-cases/{create-permiso,create-rol}.use-case.ts
└── infrastructure/repositories/mikro-orm-{rol,permiso}.repository.ts

src/modules/alumnos/domain/entities/alumno.entity.ts
src/modules/profesores/domain/entities/profesor.entity.ts
src/migrations/<timestamp>.ts
src/seeder/registry.ts
src/app.module.ts
src/mikro-orm.config.ts
src/mock/mock.entity.ts            (se retira)
docs/dominio/Analisis de dominio.md
```

Fuera de alcance, para no reabrirlo por accidente: login, JWT, cookies, guards, Argon2id, endpoints, DTO, `ValidationPipe`, administración de roles por API, alta del administrador inicial, casos de uso de `HU 16`–`HU 24`.
