# Proposal

## Why

Ocho historias piden paginar sus listados y **ninguna lectura del backend lo hace hoy**: cada endpoint existente devuelve el array completo. Sin un contrato común, cada módulo va a inventar sus parámetros, su sobre y su default, y cambiarlos después rompe a los consumidores que ya existan. Este cambio fija ese contrato una sola vez.

Lo estrena con el primer agregado que lo necesita: el catálogo de **objetivos de plan** (`HU 2`), que además es lo que falta para clasificar un plan (`HU 1`, `HU 3`). Ese catálogo tampoco existe —no hay tabla, no hay endpoints y ninguna de las tres capacidades especificadas lo cubre—, así que entra acá como primer consumidor real del contrato, no como un cambio aparte que dejaría la paginación sin nada que paginar.

## What Changes

- Se agrega la capacidad **`catalogo`** con su primer agregado, **ObjetivoPlan**: alta, consulta paginada con búsqueda por nombre, detalle, edición y eliminación. Cinco endpoints bajo `/api/objetivos-plan`.
- Se fija el **contrato de paginación** del backend: parámetros `skip` y `take`, respuesta con sobre `{ items, total, skip, take }`, `take` por defecto 10 y máximo 100, `400` con `errores` por campo ante un valor inválido, y orden estable por `nombre` con desempate por `id`.
- Se agregan al catálogo de autorización los cuatro permisos de la operación —`objetivo-plan:consultar`, `objetivo-plan:crear`, `objetivo-plan:editar` y `objetivo-plan:eliminar`— en `NOMBRES_PERMISO`, en el seed y en la asignación de `Administrador`, con la forma `recurso:acción` de `AGENTS.md` §5.10.
- Se crea la migración de la tabla `objetivo_plan` con las seis columnas de auditoría (`AGENTS.md` §6.1), el índice único sobre `lower(nombre)` que exige `RN-36` y el índice de búsqueda por nombre.
- Se incorpora a `src/common/` el **núcleo de paginación** reutilizable: el DTO de parámetros y el tipo del sobre. No se crea servicio, repositorio ni interfaz genérica.

## Capabilities

### New Capabilities

- `catalogo`: administración del catálogo de objetivos de plan, con nombre único sin distinguir mayúsculas (`RN-36`), consulta paginada con búsqueda por nombre y eliminación condicionada al uso (`RN-37`).

Se elige una capacidad `catalogo` y no una por agregado porque los cinco agregados del catálogo comparten reglas (nombre único, baja condicionada al uso, búsqueda y paginación) y cada historia posterior agrega requisitos a la misma capacidad. El aislamiento por agregado se mantiene donde corresponde: un submódulo NestJS y un cambio de OpenSpec por agregado (`AGENTS.md` §5.3).

### Modified Capabilities

- `identidad-usuario`: el catálogo de permisos requerido crece con los cuatro permisos de `objetivo-plan`.

## Impact

- **Código afectado:**
  - `src/modules/catalogo/objetivos-plan/`: controller, DTOs, casos de uso, Query Object con su puerto de lectura, entidad, puerto de escritura, adaptadores y `ObjetivosPlanModule`.
  - `src/modules/catalogo/catalogo.module.ts`: agrupa el submódulo.
  - `src/common/presentation/dto/`: DTO de paginación reutilizable.
  - `src/common/application/pagination/`: tipo del sobre paginado.
  - `src/modules/auth/domain/catalogos.ts` y `src/seeder/catalogo-identidad.seed.ts`: los cuatro permisos nuevos.
  - `src/migrations/`: la tabla y sus índices.
- **Base de datos:** una migración nueva. Tabla `objetivo_plan` con `id`, `nombre`, `descripcion` y las seis columnas de auditoría; índice único `lower(nombre)`; índice para la búsqueda por nombre. `up` y `down` verificados.
- **API:** cinco endpoints nuevos, todos protegidos con `@RequierePermiso`.
- **Contrato compartido:** el sobre paginado y los nombres `skip`/`take` pasan a ser el contrato de toda lectura paginada del backend.

## Fuera de alcance

- Los otros cuatro agregados del catálogo: ejercicios, categorías de ejercicio, materiales y unidades (`HU 26` a `HU 29`).
- Asignar un objetivo a un plan: depende de `HU 1` y del agregado `Plan`.
- Reactivación de objetivos: `HU 2` no la pide y la eliminación es definitiva.
- Paginar o filtrar el catálogo de roles y permisos: ya está decidido que no pagina.
- Cambiar el contrato de los endpoints existentes.

## Supuestos y preguntas abiertas

- **S1 — Actor.** `HU 2` dice "como administrador", así que las cuatro operaciones exigen permiso de `Administrador`. La decisión `DW-13` (¿quién gestiona el catálogo: Administrador, Profesor o ambos?) sigue abierta y puede ampliar el alcance, no reducirlo: si se resuelve por Profesor, se agregan permisos, no se quitan requisitos.
- **S2 — `RN-37` hoy no es verificable.** "No se puede eliminar un objetivo asociado a un plan" no se puede comprobar porque el agregado `Plan` no existe todavía. Este cambio define el requisito y la operación de baja, y deja la comprobación de uso como tarea condicionada al cambio que cree `Plan`; hasta entonces ningún objetivo puede estar en uso. Se registra como límite conocido en `design.md`, no se simula con una comprobación vacía.
- **S3 — Búsqueda sin tildes.** `HU 2` pide "contiene, sin distinguir mayúsculas y/o tildes". Se resuelve con la extensión `unaccent` de PostgreSQL y no se agrega índice trigram: el catálogo son decenas de filas y el índice se justifica con volumen real. Queda anotado en `design.md` como revisión futura.
