# Proposal

## Why

El backend todavía no tiene ninguna entidad persistente: `src/mock/mock.entity.ts` existe solo para que MikroORM arranque y las tablas de PostgreSQL están vacías. Sin el modelo de identidad y de autorización no se puede implementar ninguna historia de usuario, porque `HU 14`, `HU 16` a `HU 24` operan sobre `Usuario`, `Rol`, `Permiso`, `Alumno` y `Profesor`, y las reglas de acceso (`RN-11`, `RN-12`, `RN-32` a `RN-35`) suponen que esas identidades existen, que cada una tiene un rol y que un rol agrupa los permisos que habilitan sus operaciones.

Este cambio define y persiste ese modelo, con la auditoría de `AGENTS.md` §6 y las restricciones de integridad en PostgreSQL. Es el paso previo obligatorio de `implement-login`: sin identidad persistida no hay credenciales que verificar ni actor que auditar.

## What Changes

- Se crea la entidad **`Usuario`** con `email` obligatorio y único, `passwordHash`, la referencia obligatoria a un **`Rol`** y las seis columnas de auditoría de `AGENTS.md` §6.1 declaradas en la propia entidad.
- Se crea la entidad **`Rol`** con `codigo` único, `nombre` y `descripción`, y su colección de **`Permiso`**.
- Se crea la entidad **`Permiso`** con `codigo` único, `nombre` y `descripción`.
- Se modela la **asignación muchos a muchos entre `Rol` y `Permiso`**, modificable solo a través de la raíz del rol, y se define que los permisos efectivos de un usuario son la unión de los de su rol.
- Se cargan con el seeder `catalogo-identidad` —ejecutable con `yarn db:seed catalogo-identidad`— los tres roles, los permisos con trazabilidad a `RN`/`HU` y sus asignaciones iniciales.
- Se entrega la **primera capa de aplicación del módulo `auth`** que el seeder necesita: los casos de uso de alta de permiso y de rol con sus puertos de persistencia, sus implementaciones MikroORM y `AuthModule` como composition root. Es la excepción de `AGENTS.md` §5.2: la persistencia y su contrato nacen con su primer caso de uso.
- Se crea la entidad **`Alumno`**, raíz de su propio agregado, con `nombre`, `fechaNacimiento`, `numeroDocumento`, `numeroTelefono`, `fechaIngreso`, `observaciones`, su `usuario` (1 a 1) y su `profesorAsignado` (opcional).
- Se crea la entidad **`Profesor`**, raíz de su propio agregado, con `nombre`, `fechaNacimiento`, `numeroDocumento`, `numeroTelefono`, `fechaIngreso` y su `usuario` (1 a 1).
- Se agrega **una migración** que crea las cinco tablas y la tabla de asignación, con sus índices únicos, sus claves foráneas y las restricciones de coherencia de la baja lógica.
- Se define el **estado activo derivado** de la baja lógica: no se persiste un booleano `activo` paralelo a la fecha de baja, y se configura el filtro global de MikroORM que excluye las filas dadas de baja en las lecturas habituales.
- Se retira **`MockEntity`**, que ya no tiene función con entidades reales.
- Se sincroniza la documentación de dominio: `Usuario`, `Rol` y `Permiso` entran al lenguaje ubicuo y `Alumno` y `Profesor` incorporan los atributos que exigen `HU 16` a `HU 19` y `RN-25` y que hoy el modelo no declara.

## Capabilities

### New Capabilities

- `identidad-usuario`: comportamiento observable del modelo de identidad y autorización —identificador de acceso, catálogo de roles y permisos, permisos efectivos, vínculo entre `Usuario` y su perfil de `Alumno` o `Profesor`, unicidad de las claves de identidad— y de la baja lógica de todas sus entidades, verificable a través de la interfaz pública de dominio y de las restricciones de PostgreSQL.

### Modified Capabilities

Ninguna. `openspec/specs/` todavía no contiene capacidades archivadas.

## Impact

- **Código afectado:** `src/modules/auth/` (`domain/entities/` con `Usuario`, `Rol` y `Permiso`; `domain/interfaces/` con los puertos de `Rol` y `Permiso`; `application/use-cases/` con los dos casos de uso de alta; `infrastructure/repositories/` con sus implementaciones MikroORM; `auth.module.ts`), `src/modules/alumnos/domain/` (`Alumno`), `src/modules/profesores/domain/` (`Profesor`), `src/migrations/` (esquema nuevo), `src/seeder/` (entrypoint `catalogo-identidad` y su registro), `src/app.module.ts` (importa `AuthModule`), `src/mikro-orm.config.ts` (filtro global de baja lógica), y la baja de `src/mock/mock.entity.ts`.
- **Sin endpoints, sin controllers, sin DTO y sin `ValidationPipe`.** La capa de aplicación de este cambio existe solo para poder cargar el catálogo; no expone ninguna ruta.
- **Base de datos:** cinco tablas de entidad más la tabla de asignación rol-permiso, con sus índices. Los cambios de esquema son de alto riesgo según `AGENTS.md` §8, así que el diseño incluye la estrategia de rollback. La carga del catálogo no vive en la migración.
- **Dependencias:** ninguna nueva.
- **API:** sin cambios. `GET /` conserva su respuesta.
- **Fuera de alcance:**
  - Login, cookies, JWT, guards, CSRF y Argon2id (`implement-login`).
  - El alta del administrador inicial, que necesita el hashing de `implement-login` y no puede ejecutarse acá.
  - Los casos de uso de alta, baja, reactivación, modificación y asignación de `Alumno` y `Profesor` (`HU 16` a `HU 24`).
  - La administración de roles y permisos por API: no existe `HU` ni `RN` que la pida. Los casos de uso de este cambio existen solo para la carga inicial; no se crean controllers ni se editan ni dan de baja roles desde la aplicación en este alcance.
  - El permiso de gestión del catálogo: depende de `DW-13`, que sigue abierta.
  - La validación de formato de email, documento y teléfono, que vive en el DTO de esos casos de uso.
  - `ValidationPipe` global, `SwaggerModule` y cualquier endpoint (`implement-login`).
  - Las reglas de negocio que cruzan agregados (`RN-09`, `RN-10`, `RN-12`, `RN-26` a `RN-31`, `RN-35`), que se implementan en los casos de uso que las poseen.
