# Spec Delta

## ADDED Requirements

### Requirement: Alta del administrador inicial

El sistema SHALL poder crear un usuario con rol `Administrador` como proceso interno declarado, con su credencial almacenada de la forma que exige el modelo, y MUST rechazar el alta si el rol no existe, si está dado de baja o si el email ya pertenece a otro usuario, incluso dado de baja.

#### Scenario: Primera ejecución

- **WHEN** se ejecuta el proceso sobre una base con el catálogo cargado y sin usuarios
- **THEN** queda un usuario con rol `Administrador`, con su credencial almacenada y sin la contraseña en claro

#### Scenario: Segunda ejecución

- **WHEN** se ejecuta el proceso dos veces seguidas
- **THEN** la segunda no crea otro usuario ni modifica la credencial existente

#### Scenario: Catálogo sin el rol

- **WHEN** se ejecuta el proceso sin el rol `Administrador` en el catálogo
- **THEN** el proceso falla y no persiste ningún usuario
