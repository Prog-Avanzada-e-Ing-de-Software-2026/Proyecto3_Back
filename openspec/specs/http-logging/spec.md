# http-logging Specification

## Purpose
Define qué debe quedar registrado, con qué estructura y con qué datos excluidos, para que un operador pueda reconstruir una solicitud y un fallo sin que los logs expongan secretos ni datos personales.

## Requirements

### Requirement: Registro de cada solicitud HTTP

Cada solicitud HTTP atendida SHALL producir un evento de log con el método, la ruta solicitada, el estado de la respuesta, la duración en milisegundos y el identificador de solicitud.

#### Scenario: Solicitud exitosa

- **WHEN** una solicitud termina con estado 2xx
- **THEN** se emite un evento con método, ruta, estado, duración e identificador de solicitud

#### Scenario: Solicitud rechazada

- **WHEN** una solicitud termina con estado 4xx
- **THEN** se emite el mismo evento con el estado real de la respuesta

### Requirement: Exclusión del contenido de las solicitudes

El registro de solicitudes MUST NOT incluir el cuerpo de la petición, el cuerpo de la respuesta ni los valores de cookies o de la cabecera `authorization`.

#### Scenario: Petición con cuerpo y cookies

- **WHEN** una solicitud lleva cuerpo y cookies
- **THEN** el evento emitido no contiene ninguno de esos valores

### Requirement: Redacción de datos sensibles

Los logs MUST NOT contener contraseñas, documentos de identidad, tokens de acceso o de refresco, códigos de recuperación ni el valor completo de una cookie o de una cabecera de autorización, en ninguna solicitud, error ni mensaje de diagnóstico.

#### Scenario: Credenciales en un intento de login

- **WHEN** una solicitud transporta una contraseña o un documento
- **THEN** ningún evento de esa solicitud contiene el valor recibido

#### Scenario: Token en una cabecera

- **WHEN** una solicitud transporta un token en una cabecera de autorización
- **THEN** el evento registra la presencia de la cabecera sin su valor

### Requirement: Registro de fallos con causa suficiente

Todo fallo inesperado SHALL registrarse con su traza de pila y su causa, y todo fallo de negocio esperado SHALL registrarse sin traza de pila.

#### Scenario: Fallo inesperado

- **WHEN** una solicitud termina con estado 500
- **THEN** el log contiene la traza de pila y la causa original del fallo

#### Scenario: Fallo de negocio esperado

- **WHEN** una solicitud termina con estado 4xx por un error semántico
- **THEN** el log registra el código y el mensaje del error sin traza de pila

### Requirement: Registro único de cada fallo

Cada fallo SHALL registrarse exactamente una vez por solicitud, sin que el filtro global y el registro de solicitudes emitan eventos duplicados del mismo error.

#### Scenario: Fallo que atraviesa filtro y registro de solicitudes

- **WHEN** una solicitud falla y el filtro global arma la respuesta
- **THEN** existe un solo evento de error para esa solicitud y el evento de solicitud no repite la traza

### Requirement: Correlación de eventos por solicitud

Todos los eventos emitidos durante una misma solicitud SHALL compartir el identificador de solicitud que la respuesta de error expone en `X-Request-Id`.

#### Scenario: Solicitud con varios eventos

- **WHEN** una solicitud produce más de un evento de log
- **THEN** todos los eventos de esa solicitud llevan el mismo identificador

### Requirement: Nivel de log configurable por entorno

El nivel mínimo registrado SHALL configurarse por variable de entorno, con un valor por defecto cuando la variable no esté definida y un valor de reserva seguro cuando el valor recibido no sea un nivel admitido.

#### Scenario: Nivel no definido

- **WHEN** la variable de entorno del nivel no está definida
- **THEN** el servicio arranca con el nivel por defecto documentado y registra solicitudes

#### Scenario: Nivel inválido

- **WHEN** la variable de entorno contiene un valor que no es un nivel admitido
- **THEN** el servicio arranca con el valor de reserva y no falla el arranque

### Requirement: Salida estructurada apta para el entorno de despliegue

Cada evento de log SHALL emitirse en la salida estándar como un objeto JSON de una sola línea, sin formato de consola con colores ni texto libre multilínea.

#### Scenario: Evento de solicitud

- **WHEN** se emite un evento de solicitud
- **THEN** la línea correspondiente es un objeto JSON válido que puede parsearse de forma independiente
