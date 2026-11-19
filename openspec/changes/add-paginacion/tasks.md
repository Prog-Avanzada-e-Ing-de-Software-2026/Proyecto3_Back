# Tasks

## 1. Núcleo de paginación

- [x] 1.1 Crear `PaginacionQueryDto` en `src/common/presentation/dto/paginacion-query.dto.ts` con `skip` (entero, mínimo 0, default 0) y `take` (entero, mínimo 1, máximo 100, default 10), cada decorador con su `message` en español. Verificación: `yarn test` sobre el gate `mensajes-en-dtos.spec.ts` y un test unitario del DTO que acepte el default y rechace `take=0`, `take=101`, `skip=-1` y `skip=abc`. Trazabilidad: `catalogo` — Parámetros de paginación; `design.md` D2, D5.
- [x] 1.2 Crear el tipo `Pagina<T>` en `src/common/application/pagination/pagina.ts` y actualizar el árbol de `AGENTS.md` §5.2 y de `docs/agreements/arquitectura.md` para incluir `common/application/`. Verificación: `yarn typecheck` y `yarn check:docs`. Trazabilidad: `design.md` D2, D12.

## 2. Dominio y persistencia

- [ ] 2.1 Implementar la entidad `ObjetivoPlan` como raíz de su agregado, con `id`, `nombre`, `descripcion`, las seis columnas de auditoría, `estaActivo()` y `darDeBaja()` —que rechaza una segunda baja—, y su contrato de construcción en `domain/entities/objetivo-plan.input.ts`. Verificación: test unitario que rechace un nombre vacío o de solo espacios, acepte descripción nula y rechace dar de baja dos veces. Trazabilidad: `catalogo` — Alta y edición de objetivos de plan, Exclusión de la baja; `RN-36`; `AGENTS.md` §6.3; `design.md` D9, D10.
- [ ] 2.2 Crear la migración de `objetivo_plan` con la extensión `unaccent`, el índice único **parcial** `lower(nombre) WHERE deleted_at IS NULL` y el índice de búsqueda por nombre. Verificación: `yarn db:migration:up` y `down` sobre PostgreSQL 16 comprobando que `Fuerza` y `fuerza` no conviven, que el nombre de una fila dada de baja se puede reutilizar, y `yarn db:migration:check`. Trazabilidad: `RN-36`; `AGENTS.md` §6.3; `design.md` D8, D9, D10.
- [ ] 2.3 Implementar `IObjetivoPlanRepository` con las operaciones de escritura y su adaptador MikroORM con `@Transactional` sobre el repositorio. Verificación: test de integración que cree, edite y dé de baja contra base real, comprobando las seis columnas de auditoría en el alta, la edición y la baja. Trazabilidad: `AGENTS.md` §5.7 y §6.1.
- [ ] 2.4 Implementar el puerto de lectura `IObjetivosPlanReader` y su adaptador en `infrastructure/queries/` con `QueryBuilder`: búsqueda `lower(unaccent(...))`, exclusión de `deleted_at` en el listado y en el `total`, `limit`/`offset` y `ORDER BY id`. Verificación: test de integración que compare el total con y sin búsqueda, que un objetivo dado de baja no aparezca ni se cuente, y que dos páginas consecutivas no repitan ni omitan filas. Trazabilidad: `catalogo` — Respuesta paginada del listado, Orden estable del listado; `design.md` D4, D6, D7, D8.

## 3. Casos de uso

- [ ] 3.1 Implementar `CreateObjetivoPlanUseCase` y `UpdateObjetivoPlanUseCase` con nombre único case-insensitive, descripción opcional y auditoría de alta y edición desde el actor. Verificación: tests con doble del puerto que cubran alta válida, nombre repetido, nombre repetido con otra capitalización, recurso inexistente y que el actor provenga del parámetro y no del DTO. Trazabilidad: `catalogo` — Alta y edición de objetivos de plan; `RN-36`; `AGENTS.md` §6.2.
- [ ] 3.2 Implementar `DeleteObjetivoPlanUseCase` con baja lógica: completa `deletedAt` y `deletedById`, actualiza `updatedAt` y `updatedById` desde el actor y rechaza el recurso inexistente. Verificación: test con doble del puerto que compruebe las cuatro columnas, que un identificador inexistente devuelve no encontrado y que el objetivo ya no se lee. Trazabilidad: `catalogo` — Eliminación condicionada al uso, Exclusión de la baja; `AGENTS.md` §6.3; `design.md` D10.
- [ ] 3.3 Implementar `ListObjetivosPlanQuery` y `FindObjetivoPlanByIdUseCase` con sus proyecciones `ObjetivoPlanResumen`. Verificación: tests con doble del reader que cubran página por defecto, segunda página, búsqueda y sin coincidencias. Trazabilidad: `catalogo` — Respuesta paginada del listado, Búsqueda de objetivos por nombre; `design.md` D4, D7.

## 4. Borde HTTP y permisos

- [ ] 4.1 Agregar los cuatro permisos `objetivo-plan:*` a `NOMBRES_PERMISO`, a `PERMISOS_INICIALES` y a la asignación de `Administrador`. Verificación: test del seed sobre base recién migrada que compruebe los once permisos y los once de `Administrador`. Trazabilidad: `identidad-usuario` — Catálogo de permisos; `AGENTS.md` §5.10; `design.md` D11.
- [ ] 4.2 Implementar `ObjetivosPlanController` con los cinco endpoints, sus DTOs, `@ActorActual()` y `@RequierePermiso`, y el `ObjetivosPlanModule` registrado en `CatalogoModule`. Verificación: e2e con `401` sin sesión y `403` sin permiso en las cuatro operaciones protegidas. Trazabilidad: `catalogo` — Protección por permiso de las operaciones del catálogo; `design.md` D1, D11.
- [ ] 4.3 Documentar los cinco endpoints en Swagger, incluido el sobre paginado con su tipo concreto en `presentation/swagger/`. Verificación: e2e que compruebe que `/api/docs-json` incluye las cinco rutas y el esquema del sobre. Trazabilidad: `AGENTS.md` §3 y §5.6.

## 5. Verificación

- [ ] 5.1 Ejecutar la verificación completa: `yarn typecheck && yarn lint && yarn check:docs && yarn test && yarn test:e2e` en verde, `openspec validate add-paginacion --strict` con código 0, y la migración `up`/`down` verificada en PostgreSQL 16.

## Workflow follow-up

- Registrar en el cambio que cree el agregado `Plan` la clave foránea `objetivo_id ... ON DELETE RESTRICT` y el escenario de `RN-37` que hoy queda especificado sin comprobación posible (proposal S2, design D10).
- Evaluar el índice trigram de búsqueda cuando el catálogo crezca (design D8).
