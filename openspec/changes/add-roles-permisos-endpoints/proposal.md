# Proposal

## Why

El catálogo de autorización se carga hoy solo por seed: no hay forma de agregar un permiso, crear un rol nuevo ni cambiar qué puede un rol existente sin editar código y volver a sembrar. Con tres permisos alcanzaba; el modelo de autorización del MVP no vive con tres, y cada permiso nuevo hoy es un despliegue.

Tampoco hay ningún endpoint que lo exponga: el front no puede mostrar qué permisos existen ni qué tiene asignado cada rol.

## What Changes

- Se expone el **catálogo de permisos** para consultar, dar de alta y editar: `GET /api/permisos`, `GET /api/permisos/:id`, `POST /api/permisos`, `PATCH /api/permisos/:id`.
- Se expone el **catálogo de roles** para consultar, dar de alta, editar y **reemplazar su conjunto de permisos**: `GET /api/roles`, `GET /api/roles/:id`, `POST /api/roles`, `PATCH /api/roles/:id`, `PUT /api/roles/:id/permisos`.
- Se agregan al catálogo los siete permisos del catálogo de autorización (`rol:consultar`, `rol:crear`, `rol:editar`, `rol:permisos`, `permiso:consultar`, `permiso:crear` y `permiso:editar`), asignados solo a `Administrador`, que protegen las nueve operaciones. La forma `recurso:acción` queda fijada como convención para los módulos siguientes.
- Se fija que los **nombres requeridos por la spec son inmutables**: `Administrador`, `Profesor`, `Alumno` y los permisos que el catálogo obliga a contener no se pueden renombrar, porque renombrarlos los saca del catálogo.
- Las lecturas devuelven solo registros vigentes y no paginan: el catálogo es chico y la spec ya exige excluir los dados de baja.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `identidad-usuario`: el catálogo de permisos requerido crece con los permisos de administración, y se agrega el comportamiento de administrar el catálogo por API —alta con nombre único, edición, listado vigente, reemplazo del conjunto de permisos de un rol e inmutabilidad de los nombres requeridos—.

## Impact

- **Código afectado:**
  - `src/modules/auth/presentation/`: controllers de roles y permisos y sus DTOs.
  - `src/modules/auth/application/use-cases/`: alta, edición y listado de ambos agregados, y el reemplazo de permisos de un rol.
  - `src/modules/auth/domain/interfaces/`: `IRolRepository` e `IPermisoRepository` suman `findAll` y `findById`.
  - `src/modules/auth/infrastructure/repositories/`: las dos lecturas nuevas y el `save` de edición.
  - `src/seeder/`: los permisos del catálogo y su asignación a `Administrador`.
- **Base de datos:** sin migraciones. `rol` y `permiso` ya tienen nombre único, descripción y las seis columnas de auditoría.
- **API:** nueve endpoints nuevos, todos con `@RequierePermiso`.
- **Fuera de alcance:**
  - **Baja y reactivación** de roles y permisos: las reglas de baja lógica y de nombre no reutilizable ya están especificadas, pero su implementación queda para el cambio siguiente.
  - Asignar un rol a un `Usuario`: la dependerá de las altas de alumno y profesor.
  - Historial de cambios de la asignación: la auditoría registra el último responsable del rol, no cada permiso agregado o quitado.
  - Paginación, búsqueda y filtros del catálogo.
  - Administrar el catálogo de ejercicios, que es otra capacidad.
