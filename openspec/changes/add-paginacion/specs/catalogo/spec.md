# Spec Delta

## ADDED Requirements

### Requirement: Alta y edición de objetivos de plan

El sistema SHALL permitir dar de alta, consultar por identificador y editar objetivos de plan. El nombre MUST ser obligatorio y único dentro del catálogo sin distinguir mayúsculas (`RN-36`), la unicidad MUST estar garantizada por una restricción de la base y no solo por una lectura previa, y la descripción MUST ser opcional.

#### Scenario: Alta de un objetivo

- **WHEN** un usuario autorizado registra un objetivo con nombre `Hipertrofia` y descripción `Ganancia de masa muscular`
- **THEN** el objetivo queda disponible en el catálogo con su identificador, nombre y descripción

#### Scenario: Alta con nombre repetido

- **WHEN** se intenta registrar un objetivo cuyo nombre solo difiere en mayúsculas del de uno existente
- **THEN** la operación se rechaza como nombre duplicado y no se persiste

#### Scenario: Alta con nombre vacío

- **WHEN** se intenta registrar un objetivo sin nombre o con solo espacios
- **THEN** la operación se rechaza como solicitud inválida con el detalle del campo y no se persiste

#### Scenario: Detalle de un objetivo inexistente

- **WHEN** se consulta por identificador un objetivo que no existe
- **THEN** la operación se rechaza como recurso no encontrado

#### Scenario: Edición del nombre y la descripción

- **WHEN** un usuario autorizado cambia el nombre de un objetivo a uno no usado y ajusta su descripción
- **THEN** el objetivo conserva su identificador y queda con el nombre y la descripción pedidos

#### Scenario: Edición de un objetivo inexistente

- **WHEN** se intenta editar un objetivo que no existe
- **THEN** la operación se rechaza como recurso no encontrado

### Requirement: Protección por permiso de las operaciones del catálogo

Cada operación sobre objetivos de plan MUST exigir su permiso del catálogo: `objetivo-plan:consultar` para las lecturas, `objetivo-plan:crear` para el alta, `objetivo-plan:editar` para la edición y `objetivo-plan:eliminar` para la baja.

#### Scenario: Operación sin el permiso que exige

- **WHEN** un usuario autenticado intenta una operación sobre objetivos sin el permiso que esa operación exige
- **THEN** la operación se rechaza como prohibida y no se modifica ningún dato

#### Scenario: Operación sin sesión

- **WHEN** se invoca cualquier operación sobre objetivos sin una sesión válida
- **THEN** la operación se rechaza como no autenticada

### Requirement: Parámetros de paginación

El sistema MUST aceptar los parámetros `skip` —cantidad de elementos a omitir— y `take` —tamaño de la página—. `take` MUST valer 10 cuando no se envía, MUST aceptar como máximo 100 y `skip` MUST aceptar desde 0. Los valores no enteros, negativos o fuera de rango MUST rechazarse con `400`.

#### Scenario: Tamaño de página por defecto

- **WHEN** se consultan los objetivos sin enviar `skip` ni `take`
- **THEN** la respuesta usa `skip` en 0 y `take` en 10

#### Scenario: Tamaño de página fuera del máximo

- **WHEN** se consulta con `take=500`
- **THEN** la operación se rechaza como solicitud inválida con el detalle del campo

#### Scenario: Valor no numérico

- **WHEN** se consulta con `skip=abc`
- **THEN** la operación se rechaza como solicitud inválida con el detalle del campo

#### Scenario: Desplazamiento negativo

- **WHEN** se consulta con `skip=-1`
- **THEN** la operación se rechaza como solicitud inválida con el detalle del campo

### Requirement: Respuesta paginada del listado

El sistema SHALL devolver los objetivos en páginas y la respuesta MUST tener la forma `{ items, total, skip, take }`. `total` MUST contar todos los elementos que cumplen la búsqueda, no solo los de la página devuelta.

#### Scenario: Primera página

- **WHEN** se consultan los objetivos y existen 25 objetivos
- **THEN** la respuesta trae los primeros 10 y `total` es 25

#### Scenario: Segunda página

- **WHEN** se consultan los objetivos con `skip=10` y `take=10` y existen 25 objetivos
- **THEN** la respuesta trae los elementos 11 a 20 del orden establecido y `total` es 25

### Requirement: Orden estable del listado

El listado MUST ordenarse por identificador ascendente, para que dos páginas consecutivas no repitan ni omitan elementos.

#### Scenario: Orden estable entre páginas

- **WHEN** se recorren dos páginas consecutivas con `take` menor que la cantidad total de objetivos
- **THEN** ningún elemento aparece en las dos páginas y ninguno queda omitido

### Requirement: Búsqueda de objetivos por nombre

El sistema SHALL permitir filtrar el listado por un texto que coincida parcialmente con el nombre, sin distinguir mayúsculas ni tildes. Cuando no hay coincidencias, la respuesta MUST informarlo con `items` vacío y `total` en cero.

#### Scenario: Búsqueda parcial sin distinguir mayúsculas ni tildes

- **WHEN** se consultan los objetivos con el texto `fuerza` y existen `Fuerza` y `Fuerza máxima`
- **THEN** la respuesta trae ambos y `total` es 2

#### Scenario: Búsqueda con tilde

- **WHEN** se consulta con el texto `máximo` y existe `Maximo`
- **THEN** la respuesta incluye `Maximo`

#### Scenario: Sin coincidencias

- **WHEN** se consulta con un texto que no coincide con ningún objetivo
- **THEN** la respuesta trae `items` vacío y `total` en cero

### Requirement: Exclusión de la baja en las lecturas

Las lecturas MUST excluir los objetivos dados de baja: no aparecen en el listado, no se cuentan en `total` y su detalle responde como recurso no encontrado.

#### Scenario: Objetivo dado de baja fuera del listado

- **WHEN** se consulta el listado y existe un objetivo eliminado cuyo nombre coincide con la búsqueda
- **THEN** el objetivo no aparece entre los elementos ni se cuenta en `total`

#### Scenario: Detalle de un objetivo dado de baja

- **WHEN** se consulta por identificador un objetivo eliminado
- **THEN** la operación se rechaza como recurso no encontrado

### Requirement: Eliminación condicionada al uso

El sistema MUST impedir la eliminación de un objetivo asociado a uno o más planes (`RN-37`) e informar el motivo, y MUST rechazar la eliminación de un objetivo inexistente. La eliminación de un objetivo no usado SHALL ser lógica: la fila queda en la base con su auditoría de baja y el objetivo sale del catálogo activo.

#### Scenario: Eliminación de un objetivo no usado

- **WHEN** un usuario autorizado elimina un objetivo que ningún plan utiliza
- **THEN** la operación se acepta, el objetivo deja de aparecer en el catálogo y la fila conserva quién la dio de baja y cuándo

#### Scenario: Eliminación de un objetivo en uso

- **WHEN** se intenta eliminar un objetivo asociado a uno o más planes
- **THEN** la operación se rechaza como conflicto con el motivo y el objetivo permanece en el catálogo

#### Scenario: Eliminación de un objetivo inexistente

- **WHEN** se intenta eliminar un objetivo que no existe
- **THEN** la operación se rechaza como recurso no encontrado
