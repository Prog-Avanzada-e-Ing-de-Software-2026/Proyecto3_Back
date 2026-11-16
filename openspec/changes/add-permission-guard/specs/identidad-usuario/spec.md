# Spec Delta

## ADDED Requirements

### Requirement: Autorización de la operación por permiso declarado

Una operación SHALL poder declarar el permiso que exige. Cuando lo declara, el sistema MUST rechazarla con el estado del contrato de error para una operación prohibida si el usuario autenticado no tiene ese permiso entre sus permisos efectivos, y MUST hacerlo antes de ejecutar cualquier efecto sobre los datos.

#### Scenario: Operación con el permiso requerido

- **WHEN** un usuario cuyo rol incluye el permiso declarado invoca la operación
- **THEN** la operación se ejecuta con normalidad

#### Scenario: Operación sin el permiso requerido

- **WHEN** un usuario autenticado cuyo rol no incluye el permiso declarado invoca la operación
- **THEN** el sistema responde `403` con el código de permiso insuficiente y no persiste ningún cambio

#### Scenario: Permiso de un rol dado de baja

- **WHEN** el rol del usuario fue dado de baja después de asignársele un permiso
- **THEN** ese permiso no cuenta como efectivo y la operación que lo declara se rechaza

### Requirement: Prioridad del rechazo de sesión sobre el de permiso

El sistema MUST rechazar como no autenticada, y no como prohibida, toda operación que declare un permiso cuando la petición no presenta una sesión válida.

#### Scenario: Operación con permiso declarado y sin sesión

- **WHEN** se invoca una operación que declara un permiso sin sesión válida
- **THEN** el sistema responde `401` y no evalúa permisos

#### Scenario: Operación sin permiso declarado

- **WHEN** un usuario autenticado invoca una operación que no declara ningún permiso
- **THEN** la operación se ejecuta con normalidad, sin comprobar permisos
