# Spec Delta

## Purpose

Define cómo un usuario acredita su identidad ante el sistema, cómo renueva una sesión de vida corta, cuándo esa sesión deja de conceder acceso y qué garantías de rechazo sostiene el acceso a las operaciones protegidas.

## ADDED Requirements

### Requirement: Inicio de sesión con credenciales válidas

El sistema SHALL conceder una sesión a un usuario activo que presente el email y la contraseña correctos, y MUST devolver en la misma respuesta el rol y los permisos efectivos del usuario para que el cliente muestre solo las funciones que le corresponden.

#### Scenario: Credenciales correctas

- **WHEN** un `Usuario` activo inicia sesión con su email y su contraseña
- **THEN** el sistema concede la sesión y responde con el rol del usuario y sus permisos efectivos

#### Scenario: Email con distinta capitalización

- **WHEN** un `Usuario` inicia sesión con su email escrito en mayúsculas y la contraseña correcta
- **THEN** el sistema concede la sesión igual que con el email en minúsculas

#### Scenario: Funciones correspondientes al rol

- **WHEN** inicia sesión un usuario cuyo rol es `Alumno`
- **THEN** los permisos devueltos son solo los del rol y no incluyen los del catálogo de autorización

### Requirement: Rechazo de credenciales inválidas sin revelar el dato fallido

El sistema MUST rechazar el inicio de sesión cuando el email no corresponde a ningún usuario o la contraseña no verifica, y MUST responder el mismo mensaje en ambos casos, sin indicar cuál de los dos datos falló.

#### Scenario: Contraseña incorrecta

- **WHEN** se intenta iniciar sesión con un email registrado y una contraseña incorrecta
- **THEN** el sistema rechaza la operación y no concede sesión

#### Scenario: Email no registrado

- **WHEN** se intenta iniciar sesión con un email que no pertenece a ningún usuario
- **THEN** el sistema rechaza la operación con el mismo mensaje y el mismo estado que en el caso de contraseña incorrecta

### Requirement: Acceso de usuarios dados de baja

El sistema MUST rechazar el inicio de sesión de un `Usuario` dado de baja y MUST dejar de conceder acceso a una sesión ya emitida cuando el usuario es dado de baja, sin esperar a que la sesión expire.

#### Scenario: Inicio de sesión de un usuario dado de baja

- **WHEN** un `Usuario` dado de baja intenta iniciar sesión con credenciales que antes eran válidas
- **THEN** el sistema rechaza la operación y no concede sesión

#### Scenario: Baja posterior al inicio de sesión

- **WHEN** un usuario con sesión activa es dado de baja y luego intenta una operación protegida
- **THEN** el sistema rechaza la operación como no autenticada

### Requirement: Protección de las operaciones que exigen sesión

Toda operación protegida MUST rechazar la petición cuando no presenta una sesión válida, antes de ejecutar cualquier efecto sobre los datos, y MUST responder con el estado y el cuerpo de error que el contrato HTTP define para una credencial ausente o inválida.

#### Scenario: Operación protegida sin sesión

- **WHEN** se invoca una operación protegida sin sesión
- **THEN** el sistema responde `401` con el código estable del contrato de error y no persiste ningún cambio

#### Scenario: Operación protegida con sesión vencida

- **WHEN** se invoca una operación protegida con una sesión cuyo token ya venció
- **THEN** el sistema responde `401` y no ejecuta la operación

#### Scenario: Operación protegida con token manipulado

- **WHEN** se invoca una operación protegida con un token alterado o firmado con otra clave
- **THEN** el sistema responde `401` y no ejecuta la operación

### Requirement: Duración y renovación de la sesión

El sistema SHALL conceder un token de acceso de vida corta y un token de renovación de vida larga, y SHALL emitir un token de acceso nuevo cuando se presente un token de renovación válido, sin pedir la contraseña otra vez.

#### Scenario: Sesión recién iniciada

- **WHEN** un usuario inicia sesión con credenciales válidas
- **THEN** recibe un token de acceso de vida corta y uno de renovación de vida larga

#### Scenario: Renovación del acceso

- **WHEN** se presenta un token de renovación válido
- **THEN** el sistema emite un token de acceso nuevo y devuelve el rol y los permisos efectivos

#### Scenario: Renovación sin token

- **WHEN** se invoca la renovación sin token de renovación
- **THEN** el sistema responde `401` y no emite ningún token

#### Scenario: Token de acceso presentado como renovación

- **WHEN** se presenta un token de acceso donde se espera el de renovación
- **THEN** el sistema responde `401` y no emite ningún token

#### Scenario: Renovación de un usuario dado de baja

- **WHEN** se presenta el token de renovación de un usuario dado de baja
- **THEN** el sistema responde `401` y no emite ningún token

### Requirement: Confidencialidad de la credencial y de la sesión

El sistema MUST NOT incluir el hash de contraseña ni el token de sesión en el cuerpo de ninguna respuesta, y MUST NOT aceptar el actor de una operación desde la entrada del cliente.

#### Scenario: Respuesta del inicio de sesión

- **WHEN** se inspecciona la respuesta de un inicio de sesión exitoso
- **THEN** ninguna propiedad del cuerpo contiene el hash de contraseña ni el valor del token

#### Scenario: Actor enviado por el cliente

- **WHEN** una petición incluye un identificador de actor en el cuerpo o en la cabecera de consulta
- **THEN** ese valor se ignora y la operación usa el actor de la sesión
