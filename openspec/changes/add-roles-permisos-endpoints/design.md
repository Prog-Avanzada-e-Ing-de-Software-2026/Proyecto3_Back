# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `CreateRolUseCase` y `CreatePermisoUseCase` existen y los usa el seed: son idempotentes por nombre y no reciben actor.
- `IRolRepository` expone `save` y `findByNombre` con `populate` de permisos; `IPermisoRepository` solo `save` y `findByNombre`. No hay listado ni búsqueda por id.
- `Rol.asignarPermiso` y `Rol.quitarPermiso` ya validan el permiso repetido y el no asignado.
- El guard ya resuelve sesión, usuario y permiso declarado, y deja el `Usuario` en la petición.
- `IRolRepository.save` está decorado con `@Transactional({ context: (self) => self.repositorio })`.
- El filtro `bajaLogica` excluye por defecto las filas dadas de baja en todas las lecturas.

## Goals / Non-Goals

**Goals:**

- Que agregar un permiso o un rol sea una operación de API y no un despliegue.

**Non-Goals:**

- Baja y reactivación: no hay caso de uso en este cambio.
- Historial de la asignación: la auditoría queda en la fila del rol.

## Decisions

### D1 — Recursos de primer nivel, no anidados bajo `auth`

`/api/roles` y `/api/permisos`, no `/api/auth/roles`. El módulo NestJS sigue siendo `auth`, pero el recurso es el catálogo público de autorización y no la operación de sesión.

**Por qué:** la ruta nombra el recurso, no el módulo. Anidar bajo `auth` haría que la ruta mienta sobre dónde vive la capacidad.

**Alternativas descartadas:**

- **`/api/auth/roles`:** agrupa por módulo, no por recurso; obliga a cambiar la ruta cuando el módulo se mueva.
- **Un controller de catálogo compartido con ejercicios:** son capacidades distintas y §5.3 exige un submódulo por agregado.

### D2 — La asignación se reemplaza completa con `PUT`

`PUT /api/roles/:id/permisos` recibe la lista de nombres y deja al rol exactamente con ese conjunto.

**Por qué:** es idempotente, es una sola escritura y una sola fila de auditoría, y evita el estado intermedio de un rol a medio asignar entre dos llamadas. `Rol` ya expone las operaciones de la raíz para aplicarlo.

**Alternativas descartadas:**

- **`POST`/`DELETE` por permiso individual:** permite sugerir quién agregó qué, pero eso es historial, no asignación; y deja al cliente responsable de calcular el conjunto final.
- **`PATCH` con agregados y quitados separados:** dos listas y dos reglas de validación para el mismo efecto.

### D3 — Los nombres requeridos son inmutables

`PATCH` acepta cambiar descripción y nombre, salvo cuando el nombre actual es uno de los requeridos por la spec. En ese caso solo se acepta la descripción.

**Por qué:** el catálogo MUST contener `Administrador`, `Profesor`, `Alumno` y los permisos del catálogo de autorización. Renombrar cualquiera de ellos lo saca del catálogo y rompe un requisito sin que nada lo note.

**Alternativas descartadas:**

- **Prohibir renombrar siempre:** bloquea corregir un nombre mal escrito de un rol que no es requerido.
- **Renombrar y recrear el requerido:** dos operaciones para un cambio que no debería existir.

### D4 — Lecturas nuevas en los puertos, sin Query Object

`IRolRepository` e `IPermisoRepository` suman `findAll()` y `findById(id)`; el adaptador de roles populatea `permisos`.

**Por qué:** son lecturas de un agregado con sus relaciones, sin filtros dinámicos, ordenamiento ni agregaciones. §5.8 reserva el Query Object para cuando la consulta lo justifica; acá no.

**Alternativas descartadas:**

- **Query Object con proyección:** misma consulta, más piezas.
- **Paginación:** el catálogo son decenas de filas y la spec no la pide.

### D5 — Los permisos del catálogo van en la carga inicial

Los siete permisos del catálogo de autorización se agregan a `PERMISOS_INICIALES` y a la asignación de `Administrador` en el seed.

**Por qué:** el seed es donde se declara el catálogo mínimo, y `Administrador` es el único rol que puede administrarlo.

**Límite conocido:** el alta rechaza duplicados en vez de ser idempotente, y no modifica los permisos de un rol que ya existe. El seed resuelve lo primero listando antes de crear, así que sigue pudiéndose ejecutar dos veces; lo segundo no lo resuelve: el catálogo queda completo solo sobre una base recién sembrada. Se acepta porque los entornos de este proyecto se crean desde cero; converger un catálogo existente pediría un seed que actualice la asignación.

### D6 — Un permiso por operación, con la forma `recurso:acción`

El catálogo protege una operación por permiso: `rol:consultar`, `rol:crear`, `rol:editar`, `rol:permisos`, `permiso:consultar`, `permiso:crear` y `permiso:editar`. La convención queda fijada en `AGENTS.md` §5.10 y en el requisito del catálogo.

**Por qué:** un permiso que agrupa varias operaciones (`Gestionar roles`) obliga a dar de alta y consultar juntos, y no permite separar lo que puede escalar privilegios (`rol:permisos`) del resto. Cada módulo nuevo declara sus permisos con la misma forma, en el cambio que expone la operación.

**Alternativas descartadas:**

- **Un permiso por módulo (`roles:gestionar`):** no distingue lectura de escritura ni de asignación, así que consultar el catálogo obligaría a poder modificarlo y a poder asignar permisos.
- **Dar el permiso por rol en lugar de por operación:** el rol ya agrupa permisos; un permiso con nombre de rol duplica el modelo.

### D7 — La unicidad del nombre la garantiza un índice sobre `lower(nombre)`

Las tablas `rol` y `permiso` cambian la restricción única plana por un índice único sobre `lower(nombre)`, y los adaptadores comparan con `ilike` escapando comodines.

**Por qué:** `RN-36` pide unicidad sin distinguir mayúsculas y, con `text`, `UNIQUE ("nombre")` deja convivir `Administrador` y `administrador`. La lectura previa del caso de uso no alcanza: dos altas concurrentes pasan las dos y solo la base las separa (`AGENTS.md` §5.7). El índice no es parcial porque el nombre tampoco se libera con la baja.

**Alternativas descartadas:**

- **Normalizar el nombre a minúsculas al persistir:** cambia el valor del nombre sin necesidad; la unicidad es una regla de comparación, y los roles conservan nombres visibles.
- **`citext`:** exige extensión y cambia el tipo de la columna de todo el catálogo por un problema de unicidad.
- **Confiar solo en la lectura previa:** no protege contra concurrencia y dejaría la invariante fuera de la base.

## Risks / Trade-offs

- **[Asignación sin comparación con el actor]** Quien tenga `rol:permisos` puede dar a un rol cualquier permiso del catálogo, incluido uno que su propio rol no tenga, y por lo tanto ampliar sus propios permisos si administra su rol. → Riesgo aceptado por decisión de producto: la asignación es una operación administrativa, queda auditada en la fila del rol y no se restringe por los permisos del actor. Es la razón por la que `rol:permisos` se separa de `rol:editar` y por la que el seed lo reserva a `Administrador`.
- **[Nombre requerido renombrado]** Un `PATCH` podría sacar `Administrador` del catálogo. → Rechazo explícito y prueba por rol y por permiso.
- **[Permisos huérfanos]** Un permiso puede quedar en el catálogo sin ningún rol que lo use. → Es válido: un permiso se prepara antes de asignarlo.

## Migration Plan

1. La migración del cambio reemplaza `permiso_nombre_unique` y `rol_nombre_unique` por los índices `lower(nombre)`; si un entorno ya tuviera nombres duplicados sin distinguir mayúsculas, el `up` falla en vez de fusionar filas, y el `down` restaura las restricciones originales.
2. Sembrar el catálogo (`yarn db:seed catalogo-identidad`) en los entornos que se creen desde cero después del despliegue. Sin los siete permisos, los nueve endpoints quedan cerrados para todos. Un entorno ya sembrado conserva los permisos anteriores en sus roles y hay que renombrarlos o resembrar: el seed no actualiza roles existentes.
3. **Rollback:** revertir el commit; los permisos nuevos quedan en la base sin uso, lo cual es inocuo.

## Open Questions

Ninguna.
