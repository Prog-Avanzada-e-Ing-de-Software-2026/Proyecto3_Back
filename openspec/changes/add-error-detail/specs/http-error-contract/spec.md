# Spec Delta

## MODIFIED Requirements

### Requirement: Cuerpo único de respuesta de error

Toda respuesta HTTP con estado 4xx o 5xx SHALL tener un cuerpo JSON con los campos `statusCode`, `code`, `message` y `requestId`, donde `statusCode` coincide con el estado HTTP, `code` es un identificador estable en mayúsculas y guiones bajos, y `message` es un texto apto para mostrarse al cliente. Solo los fallos de validación de entrada agregan el campo `errores` con el detalle por campo; ninguna otra respuesta lo incluye.

#### Scenario: Fallo de negocio

- **WHEN** una solicitud provoca un fallo de negocio
- **THEN** la respuesta incluye `statusCode`, `code`, `message` y `requestId`, y `statusCode` coincide con el estado HTTP devuelto

#### Scenario: Fallo inesperado

- **WHEN** una solicitud provoca un fallo no previsto
- **THEN** la respuesta usa el mismo cuerpo de cuatro campos con estado 500

#### Scenario: Fallo de validación de entrada

- **WHEN** una solicitud incumple el formato o la presencia de un campo declarado en el DTO
- **THEN** el cuerpo conserva los cuatro campos y agrega `errores` con el detalle por campo

#### Scenario: Respuesta sin detalle de validación

- **WHEN** la respuesta proviene de un fallo que no es de validación de entrada
- **THEN** el cuerpo no tiene el campo `errores`

## ADDED Requirements

### Requirement: Detalle de validación por campo

Todo fallo de validación de entrada SHALL incluir en `errores` un elemento por campo inválido, con el nombre del campo tal como lo declara el DTO y un mensaje en español apto para mostrarse al cliente, sin el valor recibido, sin nombres de clases internas y sin identificadores de restricciones técnicas.

#### Scenario: Campo con formato inválido

- **WHEN** el cuerpo envía un `email` que no cumple el formato de email
- **THEN** responde `400` con `code` `SOLICITUD_INVALIDA` y una entrada de `errores` cuyo campo es `email` y cuyo mensaje explica el formato esperado

#### Scenario: Campo obligatorio ausente

- **WHEN** el cuerpo omite un campo obligatorio del DTO
- **THEN** `errores` contiene una entrada para ese campo que informa su ausencia

#### Scenario: Varios campos inválidos

- **WHEN** el cuerpo incumple más de una restricción
- **THEN** `errores` contiene una entrada por cada campo inválido y el orden es estable entre solicitudes equivalentes

#### Scenario: El detalle no revela datos del negocio

- **WHEN** el detalle describe un campo de credencial
- **THEN** el mensaje describe formato o presencia y no informa si la cuenta existe ni repite el valor recibido

### Requirement: Rechazo de propiedades no declaradas

Una solicitud cuyo cuerpo contenga una propiedad no declarada en el DTO SHALL rechazarse con `400` y una entrada de `errores` que nombre esa propiedad, en lugar de descartarla en silencio.

#### Scenario: Atributo mal escrito

- **WHEN** el cuerpo envía `correo` en lugar de `email`
- **THEN** responde `400` y `errores` nombra `correo` como propiedad no admitida

#### Scenario: Columna de auditoría en el cuerpo

- **WHEN** el cuerpo envía un campo de auditoría como `createdById`
- **THEN** responde `400` y `errores` nombra la propiedad, sin usarla

#### Scenario: Cuerpo con solo propiedades declaradas

- **WHEN** el cuerpo contiene únicamente propiedades declaradas en el DTO
- **THEN** la solicitud se procesa con normalidad

### Requirement: Normalización de excepciones HTTP del framework

Una excepción HTTP que no sea un error semántico SHALL normalizarse al cuerpo único con un `code` derivado del estado y un `message` coherente con la clase del estado: genérico de solicitud rechazada para todo `4xx` y genérico de fallo interno solo para `5xx`.

#### Scenario: Estado sin mensaje declarado

- **WHEN** una excepción HTTP trae un estado `4xx` que no figura en la tabla de mensajes
- **THEN** el `message` es un texto genérico de solicitud rechazada y no el de fallo inesperado

#### Scenario: Estado sin código declarado

- **WHEN** una excepción HTTP trae un estado sin código asociado
- **THEN** el `code` es un identificador estable genérico y el `statusCode` conserva el estado original

#### Scenario: Ruta inexistente

- **WHEN** se solicita una ruta que no existe
- **THEN** responde `404` con `code` `NO_ENCONTRADO` y el `message` correspondiente
