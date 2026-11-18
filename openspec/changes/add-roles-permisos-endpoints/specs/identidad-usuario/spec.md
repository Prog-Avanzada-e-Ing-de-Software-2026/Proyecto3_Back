# Spec Delta

## MODIFIED Requirements

### Requirement: Catálogo de permisos

El sistema SHALL persistir los permisos como entidades con nombre único sin distinguir mayúsculas y descripción, y MUST contener los permisos `Gestionar alumnos`, `Gestionar profesores`, `Crear plan`, `Gestionar roles` y `Gestionar permisos`, que habilitan las operaciones que `HU 16` a `HU 24`, `RN-11` y la administración del catálogo reservan a un rol determinado. El nombre de un permiso MUST NOT reutilizarse.

#### Scenario: Nombre de permiso repetido

- **WHEN** se intenta registrar un permiso con un nombre ya existente, comparado sin espacios circundantes y sin distinguir mayúsculas
- **THEN** la operación se rechaza como nombre duplicado

#### Scenario: Permisos requeridos disponibles

- **WHEN** se ejecuta la carga inicial del catálogo sobre un esquema recién aplicado
- **THEN** el catálogo contiene `Gestionar alumnos`, `Gestionar profesores`, `Crear plan`, `Gestionar roles` y `Gestionar permisos`

## ADDED Requirements

### Requirement: Administración del catálogo de roles y permisos

El sistema SHALL permitir consultar, dar de alta y editar roles y permisos, y MUST proteger esas operaciones con un permiso del catálogo. Las lecturas habituales MUST excluir los registros dados de baja. El nombre de un rol o de un permiso MUST ser único sin distinguir mayúsculas (`RN-36`), y la unicidad MUST estar garantizada por una restricción de la base y no solo por una lectura previa.

#### Scenario: Alta de un permiso nuevo

- **WHEN** un usuario con `Gestionar permisos` registra un permiso con un nombre inexistente
- **THEN** el permiso queda disponible en el catálogo con su nombre y descripción

#### Scenario: Nombre que difiere solo en mayúsculas

- **WHEN** se intenta registrar un rol o un permiso cuyo nombre solo difiere en mayúsculas del de uno existente
- **THEN** la operación se rechaza como nombre duplicado

#### Scenario: Alta con nombre ya usado por un registro dado de baja

- **WHEN** se intenta registrar un permiso o un rol con el nombre de uno dado de baja
- **THEN** el alta se rechaza como nombre duplicado y el nombre no se libera

#### Scenario: Listado del catálogo

- **WHEN** se consulta el catálogo de roles o de permisos
- **THEN** la respuesta incluye solo los registros vigentes

#### Scenario: Reemplazo de los permisos de un rol

- **WHEN** se reemplaza el conjunto de permisos de un rol con otro conjunto
- **THEN** el rol queda exactamente con los permisos indicados, sin los anteriores y sin repetidos

#### Scenario: Permiso repetido en el mismo rol

- **WHEN** el conjunto enviado repite el mismo permiso
- **THEN** la operación se rechaza y el conjunto del rol no cambia

### Requirement: Nadie otorga un permiso que no tiene

Una operación que asigne permisos a un rol MUST rechazarse si el actor no tiene, entre sus permisos efectivos, todos los permisos que intenta asignar (`RN-43`).

#### Scenario: Alta de un rol con un permiso que el actor no tiene

- **WHEN** un usuario con `Gestionar roles` pero sin `Gestionar permisos` crea un rol que incluye `Gestionar permisos`
- **THEN** la operación se rechaza y no se persiste el rol

#### Scenario: Reemplazo con un permiso que el actor no tiene

- **WHEN** un usuario reemplaza los permisos de un rol incluyendo uno que no tiene
- **THEN** el conjunto del rol no cambia y la operación se rechaza

### Requirement: Inmutabilidad de los nombres requeridos

Los nombres de los roles `Administrador`, `Profesor` y `Alumno` y los de los permisos que el catálogo obliga a contener MUST NOT modificarse, porque el catálogo dejaría de contenerlos (`RN-44`).

#### Scenario: Renombrar un rol requerido

- **WHEN** se intenta cambiar el nombre de `Administrador`
- **THEN** la operación se rechaza y el rol conserva su nombre

#### Scenario: Editar la descripción de un rol requerido

- **WHEN** se cambia solo la descripción de `Profesor`
- **THEN** la edición se acepta y el nombre no cambia
