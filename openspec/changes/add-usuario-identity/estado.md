# Estado del cambio `add-usuario-identity`

**Fecha de corte:** 2026-11-02
**Rama:** `feature/add-usuario-identity` (apilada sobre `feature/setup-http-foundation`, upstream configurado en `origin`)
**Estado:** planificación cerrada y validada. **La implementación no empezó**: `AGENTS.md` §3.7 separa planificación de implementación y falta la aprobación explícita del usuario.

## 1. Dónde vive cada cosa

| Archivo | Contenido |
| --- | --- |
| `openspec/changes/add-usuario-identity/proposal.md` | Por qué, qué cambia, capacidades, impacto y **fuera de alcance** explícito. |
| `openspec/changes/add-usuario-identity/specs/identidad-usuario/spec.md` | **16 requisitos** con escenarios `WHEN/THEN`, trazados a `RN-nn` y `HU-n`. |
| `openspec/changes/add-usuario-identity/design.md` | **19 decisiones** (`D1` a `D19`) con alternativas descartadas, **tablas de atributos por entidad** (§ *Modelo de datos*), módulos afectados, riesgos, rollback y estrategia de pruebas. |
| `openspec/changes/add-usuario-identity/tasks.md` | **18 tareas** en 7 secciones, cada una con su prueba asociada y el requisito que la origina. |
| `openspec/changes/add-usuario-identity/estado.md` | Este archivo: estado operativo de la sesión y cómo retomar. |
| `docs/temp/plan_auth_logging_proyecto3.md` | Plan general de auth y logging del que sale este cambio (etapas 3–6). |

Validación vigente: `openspec validate add-usuario-identity --strict` → **valid**.

## 2. Estado del repositorio

- Rama actual `feature/add-usuario-identity`, con upstream `origin/feature/add-usuario-identity`.
- Últimos commits de la rama: `b9144fd` (retira la base auditable compartida), `49b9624` (entrypoint de seeds), `380dd13` (base auditable), `b238fd1` (auditoría nullable y numérica).
- **Commiteado** en `feature/add-usuario-identity`, en el commit `docs(openspec): propose add-usuario-identity change`. Para seguir desde otra PC falta el **push**: un commit local no viaja.
- `openspec/changes/setup-http-foundation`: completo (14/14 tareas) y **sin archivar**. Pendiente de `openspec archive setup-http-foundation` cuando el usuario lo autorice.

## 3. Decisiones tomadas, con su motivo

Todas están desarrolladas en `design.md`; acá solo el índice para ubicarlas rápido.

**Modelo**

- `D1` Cinco entidades en tres módulos (`auth` con `Usuario`, `Rol` y `Permiso`; `alumnos`; `profesores`). Sin `*.module.ts` salvo `auth`, que sí lo necesita por los casos de uso del seeder.
- `D2` `Rol` y `Permiso` son **entidades persistidas**, no un enum. Decisión explícita del usuario.
- `D3` Los códigos (`ADMINISTRADOR`, `CREAR_PLAN`, …) son datos; el código de la aplicación declara constantes solo para tipar búsquedas.
- `D4` La autorización se decide por **permiso**, no comparando el código del rol. `RN-12` y `RN-35` son pertenencia, no permisos.
- `D5` La asignación rol-permiso pertenece a la raíz `Rol`; la tabla intermedia no es entidad ni lleva auditoría propia.
- `D7` El vínculo 1-a-1 con el perfil vive en `Alumno`/`Profesor` (`usuario_id UNIQUE`); `Usuario` solo tiene `rol`.
- `D8` El estado activo se **deriva** de la baja lógica; no se persiste un booleano `activo`.
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

## 4. Puntos que el usuario todavía no confirmó

1. **Aprobación para implementar.** Es el único bloqueante real.
2. **Catálogo de permisos:** son tres y salen de reglas e historias explícitas. El permiso de gestión del catálogo quedó afuera porque `DW-13` sigue abierta.
3. **`created_by_id` nulo en las filas del seed:** el seeder es el proceso interno declarado por `AGENTS.md` §6.2.2, porque todavía no existe ningún `Usuario` que pueda ser actor.
4. **`fechaNacimiento` como `date`** en lugar de `timestamptz` (`D14`).

## 5. Próximos pasos, en orden

1. Aprobar el cambio.
2. Implementar siguiendo `tasks.md` de punta a punta. Las secciones 1–2 son test-first (RED → GREEN); la migración de la sección 3 se revisa a mano porque los decoradores no expresan el índice funcional `lower(nombre)`.
3. Verificación de cierre: `yarn typecheck && yarn lint && yarn test`, más la suite de integración contra PostgreSQL 18 con Testcontainers (`yarn db:seed catalogo-identidad` se prueba dos veces seguidas).
4. `openspec validate add-usuario-identity --strict`.
5. Archivar solo con todas las tareas verificadas.

## 6. Cómo retomar

```bash
git checkout feature/add-usuario-identity
git pull
openspec status --change add-usuario-identity
openspec validate add-usuario-identity --strict
```

Después leer, en este orden: `proposal.md` → `specs/identidad-usuario/spec.md` → `design.md` (§ *Decisiones* y § *Modelo de datos*) → `tasks.md`.

## 7. Archivos que tocará la implementación

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
