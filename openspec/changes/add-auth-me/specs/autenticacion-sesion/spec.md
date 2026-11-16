# Spec Delta

## ADDED Requirements

### Requirement: Consulta del usuario autenticado

El sistema SHALL permitir al usuario autenticado consultar su propio rol y sus permisos efectivos sin renovar la sesión ni emitir tokens nuevos.

#### Scenario: Consulta con sesión válida

- **WHEN** un usuario autenticado consulta su propia identidad
- **THEN** el sistema responde con su email, el nombre de su rol y sus permisos efectivos

#### Scenario: La consulta no emite tokens

- **WHEN** se inspecciona la respuesta de la consulta
- **THEN** no contiene cookies nuevas ni token alguno en el cuerpo

#### Scenario: Consulta sin sesión

- **WHEN** se consulta la identidad sin una sesión válida
- **THEN** el sistema responde `401` con el contrato de error y no devuelve datos del usuario

#### Scenario: Consulta de un usuario dado de baja

- **WHEN** un usuario dado de baja intenta consultar su identidad con la sesión que tenía
- **THEN** el sistema responde `401` y no devuelve datos del usuario
