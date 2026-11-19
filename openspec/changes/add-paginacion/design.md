# Design

## Context

`HU 2` es la primera lectura del backend que pide búsqueda, paginación y filtros, y la primera del catálogo. El estado actual que condiciona el enfoque:

- No existe ningún agregado de catálogo: `src/modules/` solo tiene `auth`, `alumnos` y `profesores` como carpetas de dominio sin endpoints.
- `src/common/` tiene `domain/` y `presentation/` (`validation/`, `auth/`, `swagger/`, `filters/`), no `application/`.
- El catálogo de permisos ya usa la forma `recurso:acción` (`AGENTS.md` §5.10) y el seed lo crea; `Administrador` recibe todos los permisos existentes.
- El contrato de error ya devuelve `400` con `errores: [{ campo, mensaje }]` y `ValidationPipe` global con `transform: true`, `whitelist` y `forbidNonWhitelisted`.
- `docs/openapi.json` se genera desde la app y no se versiona.

## Goals / Non-Goals

**Goals:**

- Entregar el catálogo de objetivos de plan con alta, consulta paginada con búsqueda, detalle, edición y eliminación.
- Fijar una sola vez el contrato de paginación que reutilizan los otros cuatro agregados del catálogo y las lecturas de planes y entrenamientos.

**Non-Goals:**

- Los otros cuatro agregados del catálogo.
- Paginar o filtrar roles y permisos.
- Reactivación de objetivos.

## Decisions

### D1 — Una capacidad `catalogo`, un submódulo por agregado

La capacidad de OpenSpec es `catalogo`; el código vive en `src/modules/catalogo/objetivos-plan/` con su controller, casos de uso, entidad y adaptadores, y `CatalogoModule` solo agrupa.

**Por qué:** los cinco agregados comparten las reglas de catálogo (nombre único, baja condicionada, búsqueda, paginación), así que `HU 26` a `HU 29` agregan requisitos a la misma capacidad en lugar de crear cuatro capacidades que repiten los mismos requisitos. El aislamiento por agregado que exige `AGENTS.md` §5.3 se mantiene en el código, que es donde importa.

**Alternativas descartadas:**

- **Una capacidad por agregado (`catalogo-objetivos-plan`, `catalogo-ejercicios`, …):** cinco capacidades con requisitos de unicidad y paginación duplicados.
- **Un único controller de catálogo:** prohibido por §5.3.

### D2 — El núcleo de paginación son dos artefactos, sin servicio ni repositorio

- `src/common/presentation/dto/paginacion-query.dto.ts`: los parámetros, con `class-validator`, default y máximo.
- `src/common/application/pagination/pagina.ts`: el tipo `Pagina<T> = { items: T[]; total: number; skip: number; take: number }`.

El DTO se ubica bajo `dto/` para que el gate `mensajes-en-dtos.spec.ts` lo cubra: su glob es `src/**/dto/*.dto.ts`.

**Por qué:** lo reutilizable es la validación de los parámetros y la forma del sobre. Aplicar el límite es una línea (`qb.limit(take, skip)`) y el `total` necesita el mismo `QueryBuilder` con los mismos filtros, así que vive en cada reader, que es quien los conoce.

**Alternativas descartadas:**

- **`IPaginadorRepository<T>` o un reader genérico:** §5.9, interfaz que envuelve a otra sin comportamiento propio.
- **Un helper `aplicarPaginacion(qb)` en `common/infrastructure/`:** envolvería `qb.limit()` y obligaría a decidir dentro del helper el orden entre `getCount()` y el límite, que depende de cada consulta.
- **`PaginadorService`:** componente global con dependencias del ORM en `application/` (§5.4).

### D3 — Los parámetros se llaman `skip` y `take`

`skip` es la cantidad de elementos a omitir y `take` el tamaño de la página.

**Por qué:** decisión de producto del equipo. Se documenta el costo: son los nombres de MikroORM, así que el contrato HTTP queda espejando el ORM.

**Punto de cambio:** antes de que exista un segundo consumidor. Renombrarlos después es un cambio incompatible del contrato público (`X` en `versionado.md`), así que la convención se fija con este primer endpoint.

**Alternativas descartadas:**

- **`pagina`/`limite`:** nombres de dominio, pero descartados por decisión del equipo.
- **`offset`/`limit`:** el vocabulario más habitual de HTTP, también descartado.

### D4 — El sobre incluye `total` y repite `skip` y `take`

`{ items, total, skip, take }`.

**Por qué:** `HU 25` pide navegar por páginas ("páginas de 10 elementos"), y eso necesita el total; `HU 2`, `HU 26` a `HU 29` piden "trayendo inicialmente de a 10", que también se resuelve con el total. Repetir `skip` y `take` deja al cliente saber qué ventana recibió sin recalcular los defaults.

**Riesgo asociado:** `total` cuenta con los mismos filtros que el listado. Si el conteo no aplica la búsqueda, el total miente. Se prueba explícitamente (§Testing).

**Alternativa descartada:**

- **`{ items, hayMas }`:** no permite saltar a una página concreta.
- **Array pelado:** el cliente no sabe cuántos elementos hay.

### D5 — Default 10, máximo 100, inválidos rechazados con `400`

`take` vale 10 por defecto, acepta de 1 a 100 y `skip` acepta desde 0. Un valor no entero, negativo o fuera del rango se rechaza con `400` y `errores` por campo.

**Por qué:** el default lo fija `HU 2`; el máximo evita que `?take=100000` sea una negación de servicio; y rechazar es el contrato que ya existe: `whitelist` con `forbidNonWhitelisted` hace lo mismo con las propiedades no declaradas.

**Alternativa descartada:**

- **Recortar en silencio al rango válido:** el cliente cree que pidió 500 y recibe 100.

### D6 — El orden por defecto es el identificador, y cada lectura puede anteponer su criterio

`ORDER BY id ASC`. El `ORDER BY` lo decide cada reader, no el DTO ni un helper. Cuando una lectura necesite otro criterio —fecha descendente en un historial— lo antepone y conserva `id` como desempate.

**Por qué:** `id` es único y estable, así que el orden por defecto ya es total: dos páginas consecutivas no repiten ni omiten filas sin necesidad de un segundo criterio. Ordenar por nombre obliga a arrastrar el desempate y a decidir la collation en cada consulta.

**Costo aceptado:** el catálogo no se muestra alfabéticamente; el cliente que quiera verlo así ordena en memoria o se agrega `nombre` como criterio cuando una historia lo pida.

**Alternativa descartada:**

- **Ordenar por `nombre` con desempate por `id`:** más amable para el usuario final, pero decide por todas las lecturas una collation y un criterio que ninguna historia exige.

### D7 — La consulta es un Query Object con puerto de lectura propio

`ListObjetivosPlanQuery` en `application/use-cases/objetivos-plan.query.ts`, con `IObjetivosPlanReader` en `objetivos-plan.query.interface.ts` y la implementación con `QueryBuilder` en `infrastructure/queries/`. La proyección es `ObjetivoPlanResumen`.

**Por qué:** `HU 2` pide búsqueda parcial, paginación, conteo y orden: es exactamente el caso que §5.8 reserva para el Query Object. El detalle, el alta, la edición y la baja son casos de uso simples sobre el puerto de escritura.

### D8 — La búsqueda usa `unaccent` y no lleva índice trigram todavía

La consulta compara `lower(unaccent(nombre)) LIKE '%' || lower(unaccent($1)) || '%'`. La migración habilita la extensión `unaccent`.

**Por qué:** `HU 2` exige buscar sin distinguir tildes, y `ILIKE` no lo resuelve. El catálogo son decenas de filas, así que el escaneo secuencial es irrelevante y un índice `pg_trgm` sería costo sin consulta que lo justifique (`AGENTS.md` §8).

**Revisión futura:** cuando el catálogo crezca o la búsqueda aparezca en un listado grande, se agrega un índice GIN trigram sobre `lower(unaccent(nombre))` en una migración propia.

**Alternativas descartadas:**

- **Normalizar el nombre al escribir en una columna aparte:** duplica el dato y hay que mantenerlo sincronizado en cada edición.
- **Búsqueda exacta sin tildes:** no cumple el criterio de aceptación.

### D9 — La unicidad es `lower(nombre)`, sin `unaccent`

Índice único sobre `lower(nombre)`, igual que en `rol` y `permiso` (`RN-36`: "sin distinguir mayúsculas").

**Por qué:** `RN-36` no pide ignorar tildes en la unicidad, y hacerlo prohibiría nombres legítimamente distintos (`Pecho` y `Pechó` no existen, pero el criterio no es nuestro para ampliarlo). La búsqueda sí ignora tildes porque lo pide la historia.

**Alternativa descartada:**

- **Único sobre `lower(unaccent(nombre))`:** amplía la regla de negocio sin respaldo documental.

### D10 — La eliminación es lógica y las lecturas excluyen la baja

Borrar un objetivo completa `deletedAt` y `deletedById` y actualiza `updatedAt` y `updatedById` en la misma escritura (`AGENTS.md` §6.3). La fila permanece; el objetivo desaparece del catálogo activo y no se puede reactivar porque `HU 2` no lo pide. `RN-37` se cumple con la clave foránea: cuando exista `plan.objetivo_id REFERENCES objetivo_plan(id)`, el plan solo puede apuntar a filas vigentes y el uso se consulta antes de dar de baja.

**Por qué:** es el comportamiento por defecto del repositorio y el que el modelo ya asume en el resto de los agregados (`darDeBaja()` en `Alumno` y `Profesor`, `deletedAt` y `estaActivo()` en `Usuario`, `Rol` y `Permiso`). Conserva quién dio de baja y cuándo, y permite auditar el catálogo sin una tabla de historial.

**Efecto sobre las lecturas:** el listado, el conteo del `total` y el detalle filtran `deleted_at IS NULL` dentro de la consulta, antes del `skip` y del `take`. Si el filtro falta en el conteo, `total` cuenta filas invisibles y las páginas no cierran; si se aplica después de paginar, una página devuelve menos elementos de los que existen.

**Efecto sobre la unicidad:** el índice único es **parcial** (`WHERE deleted_at IS NULL`), como pide §6.3 para entidades con baja lógica, así que el nombre de un objetivo eliminado queda libre. `Rol` y `Permiso` decidieron lo contrario y su índice no es parcial; la diferencia se registra acá para que no se lea como descuido.

**Alternativas descartadas:**

- **Borrado físico:** pierde quién dio de baja y contradice la regla por defecto.
- **Comprobar el uso con una consulta al agregado `Plan`:** no existe todavía; simularlo con una comprobación vacía sería peor que dejar que la referencia lo garantice cuando la tabla exista.

### D11 — Cuatro permisos nuevos, en el mismo cambio que los endpoints

`objetivo-plan:consultar`, `objetivo-plan:crear`, `objetivo-plan:editar` y `objetivo-plan:eliminar` en `NOMBRES_PERMISO`, en `PERMISOS_INICIALES` y en la asignación de `Administrador`.

**Por qué:** `AGENTS.md` §5.10 exige un permiso por operación y agregarlo en el cambio que expone el endpoint; un permiso sin endpoint no se agrega.

### D12 — `common/` suma `application/` y la estructura se documenta

El tipo del sobre vive en `src/common/application/pagination/`, una carpeta que hoy no existe. Se actualiza el árbol de `AGENTS.md` §5.2 y de `docs/agreements/arquitectura.md`.

**Por qué:** `common/` es "solo lo transversal real, usado por dos o más módulos" (§5.2), y el sobre lo van a usar seis módulos. La carpeta se crea cuando se implementa la primera funcionalidad que la necesita: ahora.

## Risks / Trade-offs

- **[Contrato de paginación]** `skip`/`take` y el sobre quedan fijados por el primer módulo que pagina. Cambiarlos después es incompatible para el front y para los módulos siguientes. → Decisión D3 con su punto de cambio explícito; la convención se documenta en `AGENTS.md` §5.6 al implementar.
- **[Total incoherente]** Un `total` que no aplica la búsqueda devuelve páginas que no cierran. → Test de consulta que compara el total con y sin filtro.
- **[`RN-37` inaplicable hoy]** Sin tabla `plan` no hay uso que impedir; el requisito queda especificado y se cumple por clave foránea cuando exista. → Registrado en el proposal (S2) y en D10; la tarea de la restricción se agrega al cambio de `Plan`.
- **[Extensión `unaccent`]** La migración requiere `CREATE EXTENSION`, que necesita privilegios de superusuario en el entorno. → Verificado en PostgreSQL 16 con Testcontainers; en el despliegue lo ejecuta el usuario de migraciones.
- **[`DW-13` abierta]** Si el catálogo lo gestiona también el Profesor, hay que sumar permisos y escenarios; no se quitan requisitos.

## Migration Plan

1. La migración crea `objetivo_plan` con `id`, `nombre`, `descripcion` y las seis columnas de auditoría, habilita `unaccent`, crea el índice único `lower(nombre)` y el índice de búsqueda por nombre.
2. El seed `catalogo-identidad` crea los cuatro permisos y los asigna a `Administrador`; un entorno ya sembrado necesita `yarn db:seed catalogo-identidad` para que las rutas dejen de responder `403`.
3. **Rollback:** el `down` elimina índices, tabla y extensión en ese orden. Revertir el commit deja los permisos nuevos sin uso, lo cual es inocuo.

## Open Questions

Ninguna bloqueante. `DW-13` sigue abierta y amplía el alcance si se resuelve por Profesor; `S2` (`RN-37`) se cierra con el cambio de `Plan`.

## Testing

- **Dominio:** nombre obligatorio y normalizado, descripción opcional, unicidad case-insensitive contra el doble del puerto.
- **Aplicación:** alta, edición y eliminación con `actorId` de auditoría; recurso inexistente; permiso ausente en el borde.
- **Persistencia (PostgreSQL real):** índice único `lower(nombre)` rechaza `Fuerza` y `fuerza`; migración `up`/`down`; extensión `unaccent` disponible.
- **Consultas:** paginación con `total` correcto, `skip`/`take` combinados con búsqueda, orden estable entre páginas, búsqueda parcial case- y accent-insensitive, sin coincidencias.
- **HTTP:** DTO con `400` por campo en `take` fuera de rango y en `skip` no numérico, `401` sin sesión, `403` sin permiso, sobre paginado en la respuesta y los cinco endpoints documentados en Swagger.
