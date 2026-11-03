# Spec Delta

## Purpose

Define el modelo de identidad y autorización del sistema —quién puede acceder, con qué rol, qué permisos tiene ese rol y con qué perfil— y las reglas de baja lógica que comparten sus entidades, de modo que la autenticación y la autorización posteriores puedan apoyarse en un estado persistido y auditable.

## ADDED Requirements

### Requirement: Identificador de acceso único

Todo `Usuario` SHALL tener exactamente un email obligatorio y único en todo el sistema, comparado sin distinguir mayúsculas ni espacios circundantes, y MUST rechazar el alta de un usuario cuyo email ya pertenezca a otro usuario, incluso si ese otro usuario está dado de baja.

#### Scenario: Alta con email repetido en distinta capitalización

- **WHEN** se crea un `Usuario` con el email `Alumno@Gym.com` y ya existe otro con `alumno@gym.com`
- **THEN** el alta se rechaza como identidad duplicada

#### Scenario: Reutilización de email de una identidad dada de baja

- **WHEN** se intenta crear un `Usuario` con el email de un usuario dado de baja
- **THEN** el alta se rechaza como identidad duplicada y el email existente no se libera

### Requirement: Rol de usuario existente y único

Todo `Usuario` SHALL tener exactamente un rol del catálogo de roles. El sistema MUST rechazar el alta o la modificación que deje a un usuario sin rol, que lo vincule a un rol inexistente o que lo vincule a un rol dado de baja.

#### Scenario: Usuario sin rol

- **WHEN** se intenta crear un `Usuario` sin rol
- **THEN** la operación se rechaza y no se persiste ningún usuario

#### Scenario: Rol inexistente

- **WHEN** se intenta vincular un `Usuario` a un rol que no existe en el catálogo
- **THEN** la operación se rechaza y la vinculación anterior no cambia

#### Scenario: Rol dado de baja

- **WHEN** se intenta vincular un `Usuario` a un rol dado de baja
- **THEN** la operación se rechaza

### Requirement: Catálogo de roles

El sistema SHALL persistir los roles como entidades con código único, nombre y descripción, y MUST contener los roles `ADMINISTRADOR`, `PROFESOR` y `ALUMNO`. El código de un rol MUST NOT reutilizarse, ni siquiera después de su baja.

#### Scenario: Código de rol repetido

- **WHEN** se intenta registrar un rol con un código ya existente, en distinta capitalización
- **THEN** la operación se rechaza como código duplicado

#### Scenario: Roles requeridos disponibles

- **WHEN** se ejecuta la carga inicial del catálogo sobre un esquema recién aplicado
- **THEN** el catálogo contiene `ADMINISTRADOR`, `PROFESOR` y `ALUMNO`

#### Scenario: Código de un rol dado de baja

- **WHEN** se intenta registrar un rol con el código de un rol dado de baja
- **THEN** la operación se rechaza como código duplicado

### Requirement: Catálogo de permisos

El sistema SHALL persistir los permisos como entidades con código único, nombre y descripción, y MUST contener los permisos `GESTIONAR_ALUMNOS`, `GESTIONAR_PROFESORES` y `CREAR_PLAN`, que habilitan las operaciones que `HU 16` a `HU 24` y `RN-11` reservan a un rol determinado. El código de un permiso MUST NOT reutilizarse.

#### Scenario: Código de permiso repetido

- **WHEN** se intenta registrar un permiso con un código ya existente
- **THEN** la operación se rechaza como código duplicado

#### Scenario: Permisos requeridos disponibles

- **WHEN** se ejecuta la carga inicial del catálogo sobre un esquema recién aplicado
- **THEN** el catálogo contiene `GESTIONAR_ALUMNOS`, `GESTIONAR_PROFESORES` y `CREAR_PLAN`

### Requirement: Carga inicial del catálogo

La carga inicial de roles, permisos y asignaciones SHALL ejecutarse como un proceso interno declarado, MUST poder repetirse sin duplicar filas y MUST registrar el momento de cada alta.

#### Scenario: Primera ejecución de la carga

- **WHEN** se ejecuta la carga inicial sobre un esquema sin roles ni permisos
- **THEN** quedan los tres roles con sus permisos asignados y los tres permisos

#### Scenario: Segunda ejecución de la carga

- **WHEN** se ejecuta la carga inicial dos veces seguidas
- **THEN** la segunda ejecución no agrega ni modifica ninguna fila

#### Scenario: Ejecución interrumpida

- **WHEN** una ejecución se interrumpe después de crear los permisos y antes de crear los roles
- **THEN** la ejecución siguiente completa el catálogo sin duplicar permisos

### Requirement: Asignación de permisos a roles

Un `Rol` SHALL agrupar cero o más permisos y MUST NOT repetir un permiso dentro del mismo rol; un `Permiso` MUST poder pertenecer a varios roles, y la asignación solo SHALL modificarse a través de la raíz del rol.

#### Scenario: Rol sin permisos

- **WHEN** se registra o se consulta un rol al que no se le asignó ningún permiso
- **THEN** el rol existe con su conjunto de permisos vacío

#### Scenario: Permiso repetido en el mismo rol

- **WHEN** se intenta asignar dos veces el mismo permiso al mismo rol
- **THEN** la segunda asignación se rechaza y el conjunto no cambia

#### Scenario: Permiso compartido entre roles

- **WHEN** se asigna el mismo permiso a dos roles distintos
- **THEN** ambos roles lo contienen

### Requirement: Permisos efectivos del usuario

Los permisos efectivos de un `Usuario` SHALL ser la unión de los permisos asignados a su rol, y la autorización de una operación protegida MUST decidirse por la presencia de un permiso, no comparando el código del rol.

#### Scenario: Profesor con el permiso de armar planes

- **WHEN** se consultan los permisos efectivos de un `Usuario` cuyo rol es `PROFESOR`
- **THEN** incluyen `CREAR_PLAN`

#### Scenario: Alumno con permisos de gestión

- **WHEN** se consultan los permisos efectivos de un `Usuario` cuyo rol es `ALUMNO`
- **THEN** no incluyen `GESTIONAR_ALUMNOS` ni `GESTIONAR_PROFESORES`

#### Scenario: Autorización por permiso

- **WHEN** una operación protegida exige un permiso que el rol del usuario no tiene
- **THEN** la operación se rechaza aunque el usuario autenticado tenga un rol válido

### Requirement: Perfil coherente con el rol

Un `Usuario` cuyo rol sea `ALUMNO` SHALL estar vinculado a exactamente un `Alumno`, uno cuyo rol sea `PROFESOR` a exactamente un `Profesor`, y uno cuyo rol sea `ADMINISTRADOR` MUST NOT estar vinculado a ninguno; un `Alumno` o un `Profesor` MUST NOT estar vinculado a más de un `Usuario`.

#### Scenario: Dos perfiles para el mismo usuario

- **WHEN** se intenta vincular un segundo `Alumno` a un `Usuario` que ya tiene uno
- **THEN** la operación se rechaza y el vínculo existente no cambia

#### Scenario: Administrador con perfil

- **WHEN** se intenta vincular un perfil de `Alumno` o `Profesor` a un `Usuario` con rol `ADMINISTRADOR`
- **THEN** la operación se rechaza

### Requirement: Credencial nunca almacenada en claro

Todo `Usuario` SHALL tener un hash de contraseña almacenado, y el sistema MUST NOT persistir ni devolver la contraseña en claro.

#### Scenario: Usuario sin hash de contraseña

- **WHEN** se crea un `Usuario` sin hash de contraseña
- **THEN** el alta se rechaza y no se persiste ningún usuario

#### Scenario: Inspección de la fila persistida

- **WHEN** se inspecciona el usuario persistido después de un alta con contraseña `30123456`
- **THEN** ninguna columna contiene `30123456` como contraseña

### Requirement: Unicidad de identidad de Alumno y Profesor

El sistema SHALL rechazar un `Alumno` cuyo número de documento ya pertenezca a otro `Alumno`, y un `Profesor` cuyo número de documento ya pertenezca a otro `Profesor`, considerando también los dados de baja. La identidad se evalúa por agregado: el mismo documento puede existir a la vez en un `Alumno` y en un `Profesor`.

#### Scenario: Alumno con documento repetido

- **WHEN** se intenta registrar un `Alumno` con el mismo número de documento que otro alumno existente
- **THEN** el alta se rechaza como identidad duplicada

#### Scenario: Documento repetido con distinto nombre

- **WHEN** se intenta registrar un `Alumno` con el mismo número de documento que otro alumno existente pero con otro nombre
- **THEN** el alta se rechaza como identidad duplicada, porque la corrección de un nombre es una edición del registro existente, no un alta

#### Scenario: Mismo documento en agregados distintos

- **WHEN** se registra un `Profesor` con el mismo número de documento que un `Alumno` existente
- **THEN** el alta se acepta, porque la unicidad se evalúa por agregado

### Requirement: Profesor asignado opcional

Un `Alumno` SHALL tener a lo sumo un `profesorAsignado`, y MUST NOT referenciar a un profesor inexistente.

#### Scenario: Alumno sin profesor

- **WHEN** se registra un `Alumno` sin profesor asignado
- **THEN** el alumno queda registrado con la asignación vacía

#### Scenario: Profesor inexistente

- **WHEN** se intenta asignar a un `Alumno` un profesor que no existe
- **THEN** la operación se rechaza y la asignación no cambia

### Requirement: Estado activo derivado de la baja lógica

El estado activo de toda entidad persistente del modelo de identidad SHALL derivarse de su baja lógica y MUST NOT persistirse como un dato independiente: un registro está activo cuando no tiene fecha de baja y deja de estarlo cuando la tiene.

#### Scenario: Alta y baja del mismo registro

- **WHEN** se registra un `Alumno` y luego se le da de baja
- **THEN** antes de la baja está activo y después deja de estarlo, sin que se modifique ningún otro dato de estado

#### Scenario: Reactivación de un Alumno

- **WHEN** se reactiva un `Alumno` dado de baja
- **THEN** vuelve a estar activo conservando su historial y su vínculo de usuario

#### Scenario: Reactivación de un Profesor

- **WHEN** se reactiva un `Profesor` dado de baja
- **THEN** vuelve a estar activo conservando su vínculo de usuario, y sus alumnos no se le reasignan automáticamente

### Requirement: Coherencia de la baja lógica

La fecha de baja y el autor de la baja de toda entidad persistente del modelo de identidad SHALL registrarse juntos o no registrarse ninguno, y la baja MUST conservar la fila y su historial.

#### Scenario: Baja sin autor

- **WHEN** se intenta dar de baja un registro sin identificar al actor que la ejecuta
- **THEN** la operación se rechaza y el registro conserva su estado anterior

#### Scenario: Baja conserva el historial

- **WHEN** se da de baja un `Alumno` con planes y entrenamientos asociados
- **THEN** las filas del alumno y sus datos asociados siguen existiendo y la baja queda registrada

### Requirement: Auditoría de alta, edición y baja

Toda alta, edición y baja de una entidad persistente del modelo de identidad SHALL registrar al actor y el momento de la operación, MUST NOT aceptar al actor desde la entrada del cliente, MUST NOT modificar los datos de alta una vez escritos, y el último responsable de una fila SHALL ser el autor de su última edición o, si nunca se editó, el autor de su alta.

#### Scenario: Alta registra autor y momento

- **WHEN** se crea un `Profesor` en el contexto de un actor identificado
- **THEN** el registro conserva ese actor como autor del alta y el momento en que ocurrió

#### Scenario: Actor enviado por el cliente

- **WHEN** una operación de alta incluye un actor en su entrada de cliente
- **THEN** ese valor se ignora y se registra el actor del contexto de autenticación

#### Scenario: Edición posterior

- **WHEN** se edita un registro creado por un actor y la edición la ejecuta otro
- **THEN** el último responsable pasa a ser el autor de la edición y los datos de alta permanecen intactos

#### Scenario: Cambio en la asignación de permisos de un rol

- **WHEN** se modifica el conjunto de permisos de un rol
- **THEN** el rol registra al actor y el momento de esa edición como cualquier otra modificación

### Requirement: Exclusión de registros dados de baja

Las lecturas habituales de las entidades del modelo de identidad SHALL excluir los registros dados de baja, y MUST incluirlos solo cuando la lectura los pida explícitamente.

#### Scenario: Listado después de una baja

- **WHEN** se consulta el conjunto de alumnos después de dar de baja a uno
- **THEN** el alumno dado de baja no aparece, y aparece si la consulta pide incluir el histórico

#### Scenario: Rol dado de baja en el catálogo habitual

- **WHEN** se consulta el catálogo de roles después de dar de baja a uno
- **THEN** el rol dado de baja no aparece entre los asignables

### Requirement: Fechas de calendario y de instante

La fecha de nacimiento de `Alumno` y `Profesor` SHALL conservarse como fecha de calendario sin desplazamiento por zona horaria, y la fecha de ingreso y los momentos de auditoría SHALL persistirse en UTC y exponerse en ISO-8601 con zona.

#### Scenario: Fecha de nacimiento sin corrimiento

- **WHEN** se registra un alumno nacido el 1 de marzo y el registro se lee desde una zona horaria de signo negativo
- **THEN** la fecha de nacimiento sigue siendo el 1 de marzo
