# http-error-contract Specification

## Purpose
Define el contrato HTTP uniforme con el que el backend informa cualquier fallo, de modo que todo cliente reciba un cuerpo estable, sin detalles internos y correlacionable con los logs de la solicitud.

## Requirements

### Requirement: Cuerpo único de respuesta de error

Toda respuesta HTTP con estado 4xx o 5xx SHALL tener un cuerpo JSON con exactamente los campos `statusCode`, `code`, `message` y `requestId`, donde `statusCode` coincide con el estado HTTP, `code` es un identificador estable en mayúsculas y guiones bajos, y `message` es un texto apto para mostrarse al cliente.

#### Scenario: Fallo de negocio

- **WHEN** una solicitud provoca un fallo de negocio
- **THEN** la respuesta incluye `statusCode`, `code`, `message` y `requestId`, y `statusCode` coincide con el estado HTTP devuelto

#### Scenario: Fallo inesperado

- **WHEN** una solicitud provoca un fallo no previsto
- **THEN** la respuesta usa el mismo cuerpo de cuatro campos con estado 500

### Requirement: Errores semánticos independientes del transporte

El dominio y la aplicación SHALL expresar sus fallos mediante errores semánticos que declaren una categoría y un código estable, y MUST NOT depender de tipos, códigos de estado ni conceptos de HTTP.

#### Scenario: Error semántico lanzado desde dominio o aplicación

- **WHEN** una capa de dominio o aplicación lanza un error semántico
- **THEN** el error conserva su categoría y su código hasta el límite HTTP, sin que esas capas importen dependencias de transporte

### Requirement: Traducción de categorías semánticas a estados HTTP

El límite HTTP SHALL traducir la categoría de un error semántico a `404` para no encontrado, `409` para conflicto, `401` para no autenticado, `403` para prohibido y `400` para entrada inválida, y MUST usar `500` cuando la categoría sea desconocida o el error no sea semántico.

#### Scenario: Error de conflicto

- **WHEN** se lanza un error semántico de categoría conflicto
- **THEN** la respuesta tiene estado 409 y el `code` del error semántico

#### Scenario: Error semántico sin categoría conocida

- **WHEN** se lanza un error semántico cuya categoría no está declarada
- **THEN** la respuesta tiene estado 500 y el cuerpo genérico, sin exponer la categoría original

### Requirement: No exposición de detalles internos

Una respuesta 4xx o 5xx MUST NOT incluir trazas de pila, sentencias o mensajes del motor de base de datos, nombres de tablas o columnas, rutas absolutas del sistema de archivos, credenciales ni nombres de clases internas.

#### Scenario: Fallo inesperado con detalle técnico

- **WHEN** un fallo inesperado transporta un mensaje técnico del motor de base de datos
- **THEN** la respuesta contiene un mensaje genérico y no contiene el mensaje técnico ni la sentencia

#### Scenario: Error de restricción de unicidad en persistencia

- **WHEN** un fallo inesperado transporta el texto de una restricción única del motor
- **THEN** la respuesta contiene un mensaje genérico y no incluye el nombre de la restricción ni el de la tabla

### Requirement: Identificador de solicitud en la respuesta

Toda respuesta de error SHALL incluir un identificador de solicitud en el campo `requestId` y en la cabecera `X-Request-Id`, reutilizando el valor entrante cuando sea un identificador válido y generando uno nuevo en caso contrario.

#### Scenario: Solicitud sin identificador entrante

- **WHEN** llega una solicitud sin cabecera `X-Request-Id`
- **THEN** la respuesta de error incluye un identificador generado en el cuerpo y en la cabecera

#### Scenario: Solicitud con identificador entrante válido

- **WHEN** llega una solicitud con una cabecera `X-Request-Id` válida
- **THEN** la respuesta de error repite ese mismo identificador en el cuerpo y en la cabecera

#### Scenario: Identificador entrante inválido

- **WHEN** llega una solicitud con una cabecera `X-Request-Id` que no cumple el formato admitido
- **THEN** la respuesta de error usa un identificador generado y no repite el valor entrante

### Requirement: Un solo lugar arma la respuesta de error

La respuesta HTTP de error SHALL construirse en un único mecanismo transversal, y los controllers MUST NOT armar cuerpos de error ni repetir capturas por endpoint.

#### Scenario: Dos orígenes distintos de fallo

- **WHEN** dos endpoints distintos fallan por causas distintas
- **THEN** ambas respuestas tienen la misma forma de cuerpo y provienen del mismo mecanismo transversal
