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
- Que el catálogo crezca sin abrir una escalada de privilegios.

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

### D3 — Nadie otorga lo que no tiene

El caso de uso que asigna permisos compara el conjunto pedido contra los permisos efectivos del actor y rechaza si falta alguno.

**Por qué:** sin esa regla, un rol con `Gestionar roles` se autoescala creando un rol con todos los permisos y asignándoselo. El modelo de permisos pasa a ser decorativo en cuanto hay más de un administrador.

**Cómo se obtiene el actor:** el controller recibe `@ActorActual()` y el caso de uso lo resuelve con `IUsuarioRepository.findById`. Es una lectura extra por escritura, no por request, y evita construir un segundo camino para los permisos del actor.

**Alternativas descartadas:**

- **Pasar los permisos del actor desde la petición:** el guard ya los tiene, pero el caso de uso quedaría confiando en que el transporte los complete; un segundo llamador (el seed) tendría que inventarlos.
- **Permitir la escalada y auditar:** auditarla no la impide.

### D4 — Los nombres requeridos son inmutables

`PATCH` acepta cambiar descripción y nombre, salvo cuando el nombre actual es uno de los requeridos por la spec. En ese caso solo se acepta la descripción.

**Por qué:** el catálogo MUST contener `Administrador`, `Profesor`, `Alumno` y los cinco permisos. Renombrar cualquiera de ellos lo saca del catálogo y rompe un requisito sin que nada lo note.

**Alternativas descartadas:**

- **Prohibir renombrar siempre:** bloquea corregir un nombre mal escrito de un rol que no es requerido.
- **Renombrar y recrear el requerido:** dos operaciones para un cambio que no debería existir.

### D5 — Lecturas nuevas en los puertos, sin Query Object

`IRolRepository` e `IPermisoRepository` suman `findAll()` y `findById(id)`; el adaptador de roles populatea `permisos`.

**Por qué:** son lecturas de un agregado con sus relaciones, sin filtros dinámicos, ordenamiento ni agregaciones. §5.8 reserva el Query Object para cuando la consulta lo justifica; acá no.

**Alternativas descartadas:**

- **Query Object con proyección:** misma consulta, más piezas.
- **Paginación:** el catálogo son decenas de filas y la spec no la pide.

### D6 — Los dos permisos nuevos van en la carga inicial

`Gestionar roles` y `Gestionar permisos` se agregan a `PERMISOS_INICIALES` y a la asignación de `Administrador` en el seed.

**Por qué:** el seed es donde se declara el catálogo mínimo, y `Administrador` es el único rol que puede administrarlo.

**Límite conocido:** `CreateRolUseCase` es idempotente y no modifica los permisos de un rol que ya existe, así que el seed solo garantiza el catálogo completo sobre una base recién sembrada. Se acepta porque los entornos de este proyecto se crean desde cero; si alguna vez hay un catálogo sembrado que deba converger, eso pide un seed que actualice la asignación, no un cambio en el caso de uso.

## Risks / Trade-offs

- **[Escalada de privilegios]** Si la comparación del actor se implementa mal, o se saltea en el alta, un usuario con `Gestionar roles` puede darse todos los permisos. → Regla cubierta por su propio requisito y por escenarios de rechazo en las dos operaciones que asignan.
- **[Nombre requerido renombrado]** Un `PATCH` podría sacar `Administrador` del catálogo. → Rechazo explícito y prueba por rol y por permiso.
- **[Permisos huérfanos]** Un permiso puede quedar en el catálogo sin ningún rol que lo use. → Es válido: un permiso se prepara antes de asignarlo.

## Migration Plan

1. Sembrar el catálogo (`yarn db:seed catalogo-identidad`) en los entornos que se creen desde cero después del despliegue. Sin los dos permisos, los nueve endpoints quedan cerrados para todos.
2. **Rollback:** revertir el commit; los dos permisos nuevos quedan en la base sin uso, lo cual es inocuo.

## Open Questions

Ninguna.
