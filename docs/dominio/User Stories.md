

**Facultad Regional de Villa María**  
Ingeniería en Sistemas de Información  
Ingeniería y Calidad de Software 2026

**Proyecto 3: Historias de Usuario**

**Docente Del Curso:**   
Vanzetti, Juan Jose  
Toselli, Laura  

**Grupo:**   
10

**Integrantes:**   
Correa, Valentín \- 16.281 \- [correavale2004@gmail.com](mailto:correavale2004@gmail.com)  
Gómez Ferrero, Andrés \- 16.172 \- [andresgf925@gmail.com](mailto:andresgf925@gmail.com)   
Letona, Mateo \- 16.276 \- [mateolet883@gmail.com](mailto:mateolet883@gmail.com)   
Liendo Ortiz, Agustín \- 15.875 \- [agusliendo2004@gmail.com](mailto:agusliendo2004@gmail.com)   
Wursten Gill, Santiago \- 15.905- [santiwgwuri@gmail.com](mailto:-santiwgwuri@gmail.com) 

**Fecha de entrega:** 14/12/2026  
**Año de Cursado:** 2026

***Historial de versiones***

| Versión | Autores | Descripción de la versión | Fecha de finalización |
| :---- | :---- | :---- | :---- |
| Borrador | Correa, Valentin; Gómez Ferrero, Andrés ; Letona, Mateo; Liendo Ortiz, Agustín; Wursten Gill, Santiago | Borrador inicial creado para distribución y revisión.  | 27/10/26 |
| 1.0 | Correa, Valentin; Gómez Ferrero, Andrés ; Letona, Mateo; Liendo Ortiz, Agustín; Wursten Gill, Santiago | Historias estimadas y refinadas, definiendo claramente los criterios para comenzar la implementación. | 28/10/26 |

***ÍNDICE***

**[Introducción	3](#introducción)**

[**Aclaraciones	4**](#aclaraciones)

[**Planes	4**](#planes)

[**Entrenamiento	10**](#entrenamiento)

[**Estadísticas	13**](#estadísticas)

[**Usuarios y Autenticación	15**](#usuarios-y-autenticación)

[**Alumnos y profesores	16**](#alumnos-y-profesores)

[**Catálogo de ejercicios	22**](#catálogo-de-ejercicios)

# 

## ***Introducción*** {#introducción}

Se detallan en esta sección las Historias de Usuario (US) derivadas a partir del análisis de dominio planteado para este proyecto. El contenido se organiza por área o módulo funcional.

La gestión del backlog, incluyendo la priorización de las historias de usuario, se realiza mediante el gestor de proyecto.

## ***Aclaraciones*** {#aclaraciones}

***Aclaración sobre las búsquedas por nombre:*** toda búsqueda por nombre del sistema se realiza por coincidencia parcial, es decir, se listan los elementos cuyo nombre contiene el texto ingresado, sin distinguir mayúsculas de minúsculas. La búsqueda no se ejecuta a medida que el usuario escribe, sino únicamente cuando presiona Enter.  
***Sobre los ABM del catálogo:*** las operaciones de crear, consultar, modificar y eliminar de cada elemento del catálogo (ejercicios, categorías, materiales, unidades y objetivos de plan) se agrupan en una única historia de usuario por entidad, con los criterios de aceptación organizados por operación. Se decidió así porque estas operaciones no aportan valor por separado: ninguna es útil sin las demás (no se puede consultar ni modificar lo que no se creó) y dividirlas por operación técnica generaría historias triviales y dependientes entre sí, contrario al criterio de independencia de INVEST. Cuando se vayan a implementar estas historias, cuya prioridad es bajo, se puede reconsiderar esta estrategia y refinar la especificación si se considera necesario.  
Se mantiene una historia por entidad, y no una única historia “Administrar catálogo”, porque cada entidad tiene reglas propias y un conjunto distinto de elementos que la referencian. Esto mantiene el backlog acotado.  
***User Story canónica:*** Se usó como User Story canónica para el poker planning “Administrar unidades”, un ABM sencillo cuya complejidad y esfuerzo requerido tenemos muy claro.

## ***Planes*** {#planes}

| HU 1 \- Registrar plan de entrenamiento Como profesor, quiero registrar un plan de entrenamiento para un alumno, organizando los entrenamientos por día e indicando su progresión semanal, para que el alumno sepa qué ejercicios realizar y cómo avanzar. Criterios de Aceptación: Se deben poder seleccionar ejercicios previamente cargados para incluirlos en el plan. El sistema debe permitir registrar planes únicamente a usuarios con rol profesor.  El sistema debe permitir buscar por nombre y seleccionar al alumno entre los alumnos activos asignados al profesor. El sistema debe permitir indicar fecha de inicio y cantidad de semanas, con una duración de entre 4 y 12 semanas.  El sistema debe mostrar la fecha de fin del plan, calculada a partir de la fecha de inicio y la cantidad de semanas. El sistema debe exigir un objetivo, seleccionado del catálogo de objetivos de plan. El sistema debe exigir al menos un ejercicio en el bloque de movilidad y al menos uno en el de core. Se debe tener un único bloque de core y un único bloque de movilidad para todo el plan.  El sistema debe permitir definir entre 1 y 5 días, cada uno con un bloque de fuerza de al menos un ejercicio.  El sistema debe permitir indicar el orden de los ejercicios dentro de cada bloque. El sistema no debe permitir repetir un ejercicio dentro del mismo día del plan, considerando sus tres bloques.  El sistema debe exigir una prescripción semanal (series, cantidad objetivo, RIR y segundos de descanso) por cada semana del plan, la cual aplica a todos los ejercicios. El sistema debe permitir dejar opcionalmente un comentario para realizar aclaraciones. El sistema no debe permitir que las fechas del plan se solapen con las de otro plan del alumno, pero sí aceptar planes futuros. El sistema debe asignar automáticamente el número de plan. El sistema debe indicar la fecha de registro y el profesor del plan. El sistema debe permitir crear el plan desde cero o copiando un plan anterior del mismo profesor, y permitir editar los datos copiados antes de guardar. Donde se muestre un ejercicio, el sistema debe permitir ver su foto cuando la tenga.  El sistema debe informar que el plan fue registrado correctamente. |  |  |  |  |  5  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 2 \- Administrar objetivos de planes Como administrador, quiero crear, modificar, eliminar y consultar los objetivos que pueden asignarse a un plan, para clasificar los planes según lo que busca lograr cada alumno.  Criterios de Aceptación: Crear El sistema debe permitir crear un objetivo indicando su nombre (obligatorio) y, opcionalmente, una descripción. El sistema debe generar un identificador único para el objetivo. El sistema no debe permitir crear un objetivo con un nombre ya usado por otro, sin distinguir mayúsculas.  El sistema debe informar que el objetivo fue registrado correctamente. Consultar El sistema debe mostrar los objetivos con, como mínimo, identificador y nombre, y permitir ver la descripción. El sistema debe permitir buscar por nombre (contiene, sin distinguir mayúsculas y/o tildes). El sistema debe usar paginación, trayendo inicialmente de a 10 objetivos. Si no existen objetivos, el sistema debe informarlo. Modificar El sistema debe permitir seleccionar un objetivo existente para modificar su nombre y/o descripción. El sistema debe validar que el nombre sea obligatorio y no coincida con el de otro objetivo.  El sistema debe informar que el objetivo fue modificado correctamente. Eliminar El sistema debe permitir seleccionar un objetivo existente para eliminarlo. El sistema debe solicitar confirmación antes de eliminarlo. El sistema debe impedir la eliminación de un objetivo asociado a uno o más planes, informando el motivo.  El sistema debe informar que el objetivo fue eliminado correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 3 \- Consultar plan Como alumno o profesor, quiero consultar el plan de entrenamiento de un alumno, para conocer qué ejercicios y progresión corresponden en cada día.  Criterios de Aceptación: El sistema debe mostrar el plan que abarca la fecha actual. El sistema debe mostrar objetivo, fechas de inicio, fin y registro, número de plan, bloques de movilidad y core, un bloque de fuerza por día (con sus ejercicios en orden) y las prescripciones semanales. Si no existe un plan vigente, el sistema debe informarlo. Si el usuario es alumno, el sistema debe mostrar únicamente su propia información. Si el usuario es profesor, el sistema debe pedirle que seleccione primero a uno de sus alumnos asignados, buscándolo por nombre. El sistema no debe permitir acceder a información de un alumno a otro alumno ni a un profesor que no lo tenga asignado. Donde se muestre un ejercicio, el sistema debe permitir ver su foto cuando la tenga.  Sólo alumnos o profesores activos pueden consultar planes. |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 4 \- Consultar historial de planes Como alumno o profesor, quiero consultar el historial de planes de un alumno, para conocer los planes que tuvo, su objetivo y cómo fueron cambiando a lo largo del tiempo.  Criterios de Aceptación: Si el usuario es profesor, el sistema debe pedirle que seleccione primero a uno de sus alumnos asignados, buscándolo por nombre. El sistema no debe permitir acceder a información de un alumno a otro alumno ni a un profesor que no lo tenga asignado. Sólo alumnos o profesores activos pueden consultar planes. El sistema debe listar todos los planes del alumno (finalizados, vigente y futuros), ordenados por fecha de inicio del más reciente al más antiguo. El sistema debe mostrar, por cada plan, número de plan, fechas de inicio y fin, objetivo, profesor que lo armó y situación (finalizado, vigente o futuro). El sistema debe usar paginación, trayendo inicialmente de a 10 planes. El sistema debe permitir ver el detalle de cualquier plan del listado, con la misma información que “Consultar plan de entrenamiento”. Donde se muestre un ejercicio, el sistema debe permitir ver su foto cuando la tenga.  Si el alumno no tiene planes, el sistema debe informarlo. |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 5 \- Consultar alumnos sin plan o plan por terminar Como profesor, quiero consultar qué alumnos no tienen plan o lo están por terminar, para anticiparme y armarles uno nuevo a tiempo. Criterios de Aceptación: El sistema debe listar a los alumnos activos del profesor que no tienen un plan vigente.  El sistema debe listar a los alumnos activos del profesor cuyo plan vigente termina dentro de los próximos N días (7 por defecto), pudiendo seleccionar el valor de N. El sistema no debe incluir a alumnos con un plan posterior ya cargado con fecha de  inicio en la semana próxima a la finalización de su plan. El sistema no debe incluir a alumnos dados de baja.  El sistema debe indicar para cada alumno si está “sin plan” o “por terminar” y, en ese caso, la fecha de fin. Si no hay alumnos en esas condiciones, el sistema debe informarlo. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 6 \- Modificar plan Como profesor, quiero modificar el plan de un alumno, para ajustarlo cuando cambian sus necesidades o hay errores. Criterios de Aceptación: El sistema debe permitir al profesor seleccionar un plan de uno de sus alumnos para modificarlo.  Se debe poder buscar el plan por nombre del alumno. El sistema debe permitir modificar fechas de inicio y fin, objetivo, bloques, días, ejercicios y prescripciones, aplicando las mismas validaciones que al registrar.  El sistema no debe permitir modificar un plan finalizado (con fecha de fin anterior a hoy). El sistema no debe permitir cambiar el alumno ni el número del plan. El sistema no debe permitir quitar un día que tenga entrenamientos asociados.  El sistema debe conservar sin cambios los entrenamientos ya registrados. Donde se muestre un ejercicio, el sistema debe permitir ver su foto cuando la tenga.  El sistema debe informar que el plan fue modificado correctamente. |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 7 \- Eliminar plan Como profesor, quiero eliminar un plan cargado que todavía no fue utilizado, para mantener solo los planes necesarios que corresponden a cada alumno sin afectar el historial de entrenamientos. Criterios de Aceptación: El sistema debe permitir al profesor seleccionar un plan de uno de sus alumnos para eliminarlo, pudiendo buscarlo por nombre del alumno. El sistema debe solicitar confirmación antes de eliminarlo. El sistema debe impedir la eliminación de un plan con entrenamientos asociados. El sistema debe informar que el plan fue eliminado correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## ***Entrenamiento*** {#entrenamiento}

| HU 8 \- Registrar entrenamiento Como alumno, quiero registrar un entrenamiento con los ejercicios y series que realicé, para dejar constancia de lo que hice y poder ver mi evolución. Criterios de Aceptación: El sistema debe permitir registrar entrenamientos solo a alumnos activos. El sistema debe asignar al entrenamiento la fecha actual, sin permitir modificarla.  El alumno debe poder salir del formulario de registro de entrenamiento y luego retomar el registro donde había dejado. El sistema no debe permitir iniciar un entrenamiento si el alumno ya tiene uno en curso, y debe ofrecer continuar el existente.  El alumno debe poder cancelar el registro de un entrenamiento, para que le permita registrar otro. Si el alumno tiene un plan vigente, el sistema debe asociar el entrenamiento a ese plan y permitir elegir el día y semana del plan. Si el alumno no tiene plan vigente, el sistema no debe permitir registrar el entrenamiento.  El sistema debe ofrecer como guía los ejercicios del día elegido (movilidad, core y fuerza) con la prescripción de la semana correspondiente.  El sistema debe permitir registrar cualquier ejercicio del catálogo, esté o no en el plan. No debe exigirse que se registren todos los ejercicios del día.  El sistema no debe permitir repetir un ejercicio dentro del mismo entrenamiento.  El sistema debe permitir cargar, por ejercicio, una o más series con cantidad (mayor o igual a 1\) y peso opcional (mayor o igual a 0). El sistema debe permitir corregir o completar series y ejercicios mientras el entrenamiento esté en curso. El sistema debe mostrar la última carga usada en un ejercicio al agregarlo al entrenamiento. El sistema debe permitir agregar un comentario opcional. Donde se muestre un ejercicio, el sistema debe permitir ver su foto cuando la tenga.  El sistema debe exigir, para finalizar, al menos un ejercicio realizado y que cada uno tenga al menos una serie. |  |  |  |  |  5  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 9 \- Consultar el historial de entrenamientos Como alumno o profesor, quiero consultar el historial de entrenamientos de un alumno, para hacer seguimiento de lo que se realizó y en qué fecha. Criterios de Aceptación: Si el usuario es alumno, el sistema debe mostrar únicamente su propia información. Si el usuario es profesor, el sistema debe pedirle que seleccione primero a uno de sus alumnos asignados, buscándolo por nombre. El sistema no debe permitir acceder a información de un alumno a otro alumno ni a un profesor que no lo tenga asignado. El sistema debe listar los entrenamientos del alumno ordenados del más reciente al más antiguo, con fecha, plan y día asociados. El sistema debe permitir ver el detalle de un entrenamiento: ejercicios, series (cantidad y peso) y comentario. El sistema debe permitir seleccionar un rango de fechas para acotar el listado. El sistema debe usar paginación, trayendo inicialmente de a 10 entrenamientos. Si no hay entrenamientos, el sistema debe informarlo. El historial de un alumno dado de baja debe conservarse, pero no es consultable mientras esté de baja.  Donde se muestre un ejercicio, el sistema debe permitir ver su foto cuando la tenga.  |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 10 \- Consultar última carga usada en un ejercicio Como alumno, quiero ver la última carga que usé en un ejercicio, para saber con qué peso o cantidad seguir al entrenar. Criterios de Aceptación: El sistema debe permitir seleccionar un ejercicio del catálogo, con búsqueda por nombre. El sistema debe mostrar fecha y series (cantidad y peso) de la última vez que se realizó el ejercicio en un entrenamiento.  Si el ejercicio nunca fue realizado, el sistema debe informarlo. |  |  |  |  |  0,5  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## ***Estadísticas*** {#estadísticas}

| HU 11 \- Consultar historial de asistencias Como alumno o profesor, quiero consultar las fechas en que un alumno entrenó y la cantidad de entrenamientos por semana o mes en un período, para evaluar su constancia. Criterios de Aceptación: Si el usuario es alumno, el sistema debe mostrar únicamente su propia información. Si el usuario es profesor, el sistema debe pedirle que seleccione primero a uno de sus alumnos asignados, buscándolo por nombre. El sistema no debe permitir acceder a información de un alumno a otro alumno ni a un profesor que no lo tenga asignado. El sistema debe exigir un período (fecha desde y hasta, con desde menor o igual a hasta). La fechaHasta debe ser por defecto la fecha actual y la fechaDesde debe ser por defecto la de hace un mes. El sistema debe listar las fechas en que el alumno realizó entrenamientos finalizados dentro del período. El sistema debe permitir elegir agrupar por semana o por mes y mostrar la cantidad de entrenamientos en cada una, incluyendo las que tienen cero.  La cantidad de entrenamientos por semana o mes debe poder verse como lista o como gráfica. Si no hay entrenamientos en el período, el sistema debe informarlo. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 12 \- Consultar record histórico por ejercicio Como alumno o profesor, quiero ver el récord histórico de un alumno en un ejercicio, para conocer su mejor marca y motivar su progreso. Criterios de Aceptación: Si el usuario es alumno, el sistema debe mostrar únicamente su propia información. Si el usuario es profesor, el sistema debe pedirle que seleccione primero a uno de sus alumnos asignados, buscándolo por nombre. El sistema no debe permitir acceder a información de un alumno a otro alumno ni a un profesor que no lo tenga asignado. El sistema debe permitir seleccionar un ejercicio del catálogo, buscando por nombre. El sistema debe mostrar la mejor serie de todo el historial (cantidad, peso y fecha).  Para ejercicios con peso, la mejor serie es la de mayor peso y, si empatan, la de mayor cantidad. Para ejercicios sin peso, la de mayor cantidad.  Si hay empate total, el sistema debe mostrar la más antigua.  Si el alumno nunca realizó el ejercicio, el sistema debe informarlo. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 13 \- Consultar evolución por ejercicio Como alumno o profesor, quiero ver la evolución de un alumno en un ejercicio durante un período, para saber si está progresando. Criterios de Aceptación: Si el usuario es alumno, el sistema debe mostrar únicamente su propia información. Si el usuario es profesor, el sistema debe pedirle que seleccione primero a uno de sus alumnos asignados, buscándolo por nombre. El sistema no debe permitir acceder a información de un alumno a otro alumno ni a un profesor que no lo tenga asignado. El sistema debe permitir seleccionar un ejercicio, buscándolo por nombre, y un período (fecha desde y hasta). La fecha hasta es por defecto la fecha actual y la fecha desde es por defecto 6 meses antes de la fecha actual. El sistema debe mostrar, por cada entrenamiento finalizado del período en que se realizó el ejercicio, la fecha y su mejor serie, ordenados cronológicamente.  El sistema debe mostrar la variación entre la primera y la última mejor serie del período. Si no hay registros en el período, el sistema debe informarlo. Los datos de mejor serie por ejercicio deben poder verse en formato de lista o en un gráfico. |  |  |  |  |  3  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## ***Usuarios y Autenticación*** {#usuarios-y-autenticación}

| HU 14 \- Iniciar sesión Como usuario, quiero iniciar sesión en el sistema, para acceder a las funciones que corresponden a mi rol. Criterios de Aceptación: El sistema debe permitir iniciar sesión con email y contraseña. Ante credenciales inválidas, el sistema debe informarlo sin indicar cuál de los dos datos falló. El sistema no debe permitir iniciar sesión a un profesor ni a un alumno dado de baja.  Al conceder el acceso se debe redirigir a la página principal, donde se debe mostrar solo las funciones correspondientes al rol del usuario. El sistema debe permitir cerrar sesión. |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 15 \- Restaurar contraseña Como usuario, quiero restaurar mi contraseña, para recuperar el acceso si la olvido. Criterios de Aceptación: El sistema debe permitir solicitar la restauración indicando el email. El sistema debe informar el resultado sin revelar si el email está registrado. El sistema debe permitir definir una nueva contraseña mediante un enlace o código de un solo uso con vencimiento que se envía al mail del usuario. El sistema debe invalidar el enlace o código después de usarlo. El sistema no debe aplicar la restauración a usuarios dados de baja que no puedan iniciar sesión. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## ***Alumnos y profesores*** {#alumnos-y-profesores}

| HU 16 \- Dar de alta alumno Como administrador, quiero dar de alta a un alumno, para que pueda acceder al sistema y comenzar a entrenar con seguimiento. Criterios de Aceptación: El sistema debe permitir dar de alta un alumno indicando nombre, fecha nacimiento, número de documento, número de teléfono, y email (obligatorios) y observaciones (opcional). El sistema debe exigir un profesor asignado, seleccionado entre profesores activos, buscando por nombre. El sistema debe rechazar un email ya usado por otro usuario.  Se deben rechazar emails y números de teléfonos inválidos. Se debe rechazar a un alumno con igual nombre y número de documento que otro ya registrado. El sistema debe asignar la fecha de ingreso (por defecto, la actual) y dejar al alumno activo. El sistema debe crear el usuario del alumno y generar una credencial inicial que sea su documento. El sistema debe informar que el alumno fue registrado correctamente. |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

	

| HU 17 \- Dar de alta profesor Como administrador, quiero dar de alta a un profesor, para que pueda gestionar los planes y el seguimiento de sus alumnos. Criterios de Aceptación: El sistema debe permitir dar de alta un profesor indicando nombre, número de documento, número de teléfono, fecha de nacimiento y email (obligatorios). El sistema debe rechazar un email ya usado por otro usuario.  El sistema debe rechazar un profesor con igual nombre y número de documento que otro ya registrado. El sistema debe asignar la fecha de ingreso (por defecto, la actual) y dejar al profesor activo. El sistema debe crear el usuario del profesor y generar una credencial inicial que sea su documento. El sistema debe informar que el profesor fue registrado correctamente. |  |  |  |  |  2  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 18 \- Modificar alumno Como administrador, quiero modificar los datos de un alumno, para mantener su información actualizada y corregir errores. Criterios de Aceptación: El sistema debe permitir buscar por nombre y seleccionar un alumno existente para modificarlo.  El sistema debe permitir modificar nombre, email, fecha nacimiento, número de documento, número de teléfono, fecha de ingreso y observaciones.  El sistema no debe permitir cambiar el profesor desde esta función.  El sistema debe validar que nombre, fecha nacimiento, número de documento, número de teléfono y email sean obligatorios. El sistema debe validar que el email no pertenezca a otro usuario ni que exista otro usuario con igual nombre y documento.  El sistema debe informar que el alumno fue modificado correctamente.  |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 19 \- Modificar profesor Como administrador, quiero modificar los datos de un profesor, para mantener su información actualizada y corregir errores. Criterios de Aceptación: El sistema debe permitir buscar por nombre y seleccionar un profesor existente para modificarlo.  El sistema debe permitir modificar nombre, email, fecha nacimiento, número de documento, número de teléfono y fecha de ingreso. El sistema debe validar que nombre, fecha nacimiento, número de documento, número de teléfono y email sean obligatorios. El sistema debe validar que el email no pertenezca a otro usuario ni que exista otro usuario con igual nombre y documento.  El sistema debe informar que el profesor fue modificado correctamente.  |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 20 \- Dar de de baja alumno Como administrador, quiero dar de baja a un alumno, para que deje de operar en el sistema sin perder su historial. Criterios de Aceptación: El sistema debe permitir seleccionar un alumno activo para darlo de baja. El sistema debe solicitar confirmación. El sistema debe conservar el historial de entrenamientos y los planes del alumno.  El sistema debe informar que el alumno fue dado de baja correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 21 \- Dar de baja profesor Como administrador, quiero dar de baja a un profesor, para que deje de operar en el sistema resguardando la continuidad de sus alumnos. Criterios de Aceptación: El sistema debe permitir seleccionar un profesor activo para darlo de baja. El sistema debe solicitar confirmación, indicando cuántos alumnos quedarán sin profesor. El sistema debe dejar sin profesor asignado a los alumnos del profesor, quedando disponibles para ser reasignados. El sistema debe informar que el profesor fue dado de baja correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 22 \- Consultar mis alumnos Como profesor, quiero consultar mis alumnos, para elegir con cuál trabajar y acceder a su plan e historial. Criterios de Aceptación: El sistema debe listar los alumnos activos asignados al profesor. El sistema debe mostrar, como mínimo, nombre y observaciones de cada alumno. El sistema debe permitir buscar al alumno por nombre. El sistema debe permitir acceder desde el alumno a su plan y a su historial de entrenamientos. Si el profesor no tiene alumnos, el sistema debe informarlo. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 23 \- Asignar alumnos Como administrador, quiero asignar o reasignar alumnos a un profesor, para que cada alumno tenga un responsable de su seguimiento. Criterios de Aceptación: El sistema debe permitir al administrador seleccionar un profesor activo y un alumno activos para asignárselo. El sistema debe permitir asignar alumnos sin profesor y reasignar alumnos que ya tienen uno. El sistema debe mostrar por defecto, antes de que se realice una búsqueda, los alumnos sin profesor asignado. El sistema debe conservar los planes y entrenamientos del alumno sin cambios. El sistema debe informar que la asignación fue realizada correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 24 \- Reactivar alumno Como administrador, quiero reactivar a un alumno dado de baja, para que retome su entrenamiento conservando su historial. Criterios de Aceptación: El sistema debe permitir seleccionar un alumno dado de baja para reactivarlo. Si su profesor anterior sigue activo, el alumno debe conservarlo; si no, debe quedar sin profesor hasta ser reasignado.  El sistema debe informar que el alumno fue reactivado correctamente.  |  |  |  |  |  0,5  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 25 \- Consultar nómina del gimnasio Como administrador, quiero consultar la nómina de alumnos y profesores con su estado y asignaciones, para ubicar a la persona sobre la que necesito operar (modificarla, darla de baja, reactivarla o reasignarla).  Criterios de Aceptación: El sistema debe listar alumnos y profesores con nombre, estado (activo o de baja) y, para los alumnos, el profesor asignado. El sistema debe permitir filtrar por rol y estado, y buscar por nombre. El sistema debe permitir seleccionar desde el listado a la persona para modificarla, darla de baja, reactivarla o asignarla. Si no hay resultados, el sistema debe informarlo. El sistema debe usar paginación, usando por defecto páginas de 10 elementos y pudiendo modificarlo. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## ***Catálogo de ejercicios***  {#catálogo-de-ejercicios}

| HU 26 \- Administrar ejercicios Como administrador, quiero crear, consultar, modificar y eliminar ejercicios del catálogo, para que los profesores y alumnos dispongan de ejercicios actualizados al armar planes y registrar entrenamientos. Criterios de Aceptación: Crear El sistema debe permitir crear un ejercicio indicando nombre, categoría y unidad (obligatorios), y material, foto y descripción (opcionales). El sistema debe permitir seleccionar la categoría, la unidad y el material entre los ya registrados en el catálogo. El sistema debe generar un identificador único para el ejercicio. El sistema no debe permitir crear un ejercicio con un nombre ya usado por otro, sin distinguir mayúsculas. El sistema debe informar que el ejercicio fue registrado correctamente. Consultar El sistema debe mostrar los ejercicios con, como mínimo, identificador, nombre, categoría, material y unidad, y permitir ver la descripción y foto si existen. El sistema debe permitir buscar por nombre. El sistema debe permitir filtrar por categoría. El sistema debe usar paginación, trayendo inicialmente de a 10 ejercicios. Si no existen ejercicios que cumplan la búsqueda, el sistema debe informarlo. Modificar El sistema debe permitir seleccionar un ejercicio existente para modificar su nombre, categoría, material, foto y/o descripción. El sistema debe validar que el nombre y la categoría sean obligatorios y que el nombre no coincida con el de otro ejercicio.  El sistema debe permitir cambiar la unidad de un ejercicio que nunca fue usado.  El sistema debe informar que el ejercicio fue modificado correctamente. Eliminar El sistema debe permitir seleccionar un ejercicio existente para eliminarlo. El sistema debe solicitar confirmación antes de eliminarlo. El sistema debe impedir la eliminación de un ejercicio que esté en algún plan o entrenamiento, informando el motivo. El sistema debe informar que el ejercicio fue eliminado correctamente. |  |  |  |  |  3  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 27 \- Administrar categorías de ejercicios Como administrador, quiero crear, modificar, eliminar y consultar categorías de ejercicios, para clasificarlos y facilitar su búsqueda. Criterios de Aceptación: *Crear* El sistema debe permitir crear una categoría indicando su nombre (obligatorio) y, opcionalmente, una descripción.  El sistema debe generar un identificador único para la categoría. El sistema no debe permitir crear una categoría con un nombre ya usado por otra, sin distinguir mayúsculas.  El sistema debe informar que la categoría fue registrada correctamente. *Consultar* El sistema debe mostrar las categorías con, como mínimo, identificador y nombre, y permitir ver la descripción. El sistema debe permitir buscar por nombre. El sistema debe usar paginación, trayendo inicialmente de a 10 categorías. Si no existen categorías, el sistema debe informarlo. *Modificar* El sistema debe permitir seleccionar una categoría existente para modificar su nombre y/o descripción. El sistema debe validar que el nombre sea obligatorio y no coincida con el de otra categoría.  El sistema debe informar que la categoría fue modificada correctamente. *Eliminar* El sistema debe permitir seleccionar una categoría existente para eliminarla. El sistema debe solicitar confirmación antes de eliminarla. El sistema debe impedir la eliminación de una categoría asociada a uno o más ejercicios, informando el motivo. El sistema debe informar que la categoría fue eliminada correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 28 \- Administrar materiales Como administrador, quiero crear, modificar, eliminar y consultar los materiales requeridos, para indicar qué necesita cada ejercicio. Criterios de Aceptación: Crear El sistema debe permitir crear un material indicando su nombre (obligatorio) y, opcionalmente, una descripción. El sistema debe generar un identificador único para el material. El sistema no debe permitir crear un material con un nombre ya usado por otro, sin distinguir mayúsculas. El sistema debe informar que el material fue registrado correctamente. Consultar El sistema debe mostrar los materiales con, como mínimo, identificador y nombre, y permitir ver la descripción. El sistema debe permitir buscar por nombre. El sistema debe usar paginación, trayendo inicialmente de a 10 materiales. Si no existen materiales, el sistema debe informarlo. Modificar El sistema debe permitir seleccionar un material existente para modificar su nombre y/o descripción. El sistema debe validar que el nombre sea obligatorio y no coincida con el de otro material.  El sistema debe informar que el material fue modificado correctamente. Eliminar El sistema debe permitir seleccionar un material existente para eliminarlo. El sistema debe solicitar confirmación antes de eliminarlo. El sistema debe impedir la eliminación de un material asociado a uno o más ejercicios, informando el motivo.  El sistema debe informar que el material fue eliminado correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

| HU 29 \- Administrar unidades Como administrador, quiero crear, modificar, eliminar y consultar las unidades de medida (minutos, repeticiones, etc.), para registrar cada ejercicio de la forma que corresponde. Criterios de Aceptación: Crear El sistema debe permitir crear una unidad indicando su nombre (obligatorio) y, opcionalmente, una descripción.  El sistema debe generar un identificador único para la unidad. El sistema no debe permitir crear una unidad con un nombre ya usado por otra, sin distinguir mayúsculas.  El sistema debe informar que la unidad fue registrada correctamente. Consultar El sistema debe mostrar las unidades con, como mínimo, identificador y nombre, y permitir ver la descripción. El sistema debe permitir buscar por nombre. El sistema debe usar paginación, trayendo inicialmente de a 10 unidades. Si no existen unidades, el sistema debe informarlo. Modificar El sistema debe permitir seleccionar una unidad existente para modificar su nombre y/o descripción. El sistema debe validar que el nombre sea obligatorio y no coincida con el de otra unidad. El sistema debe informar que la unidad fue modificada correctamente. Eliminar El sistema debe permitir seleccionar una unidad existente para eliminarla. El sistema debe solicitar confirmación antes de eliminarla. El sistema debe impedir la eliminación de una unidad asociada a uno o más ejercicios, informando el motivo.  El sistema debe informar que la unidad fue eliminada correctamente. |  |  |  |  |  1  |
| :---- | ----- | ----- | ----- | ----- | ----- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

