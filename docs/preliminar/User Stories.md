# User Stories — Gym MVP

Historias de usuario derivadas de `docs/Funcionalidades preliminares detectadas.md`.

> **Actualización de dominio (autoritativa):** el análisis vigente es `docs/Analisis de dominio.md`,
> que **redefine y renumera** las reglas (23 reglas, agrupadas por agregado). Las referencias `RN-n`
> de este documento siguen la numeración **antigua** de `docs/Reglas de negocio.md`; ver el mapeo al
> final. Los términos (`Número de plan`, `Día del plan`, `Prescripción semanal`, `Mejor serie`,
> `Evolución por ejercicio`) se toman del lenguaje ubicuo del análisis de dominio.

---

## Convenciones

- **Formato**: `Como <rol> quiero <acción> para <beneficio>`.
- **ID**: `US-NN`, estable. Los cambios de alcance agregan criterios, no reescriben el ID.
- **Criterios de aceptación**: Gherkin (`Dado / Cuando / Entonces`).
- **Trazabilidad**: cada historia referencia las `RN-n` que la condicionan (índice en la sección final).
- **Prioridad**: MoSCoW *propuesto* (Must / Should / Could) — a validar con el negocio.
- **Decisiones abiertas**: marcadas con `❓ D-nn` (resumen en la sección final). No se inventó
  comportamiento para ellas; quedan como vacío explícito.

### Actores

| Actor | Estado | Alcance |
| --- | --- | --- |
| **Alumno** | Definido | Registra entrenamientos y consulta su propia información. |
| **Profesor** | Definido | Arma planes, hace seguimiento de sus alumnos asignados. |
| **Administrador / Encargado** | Definido (`D-01`) | Realiza altas y bajas de profesores y alumnos. Catálogo: pendiente `D-01a`. |
| **Sistema** | Soporte | Reglas automáticas (derivación de récord, validación de solapamiento, etc.). |

---

## Épica 1 — Catálogo y configuración

Base de datos maestra sobre la que se construyen los planes. CRUDs estándar; se listan primero
porque las demás épicas dependen de ellos.

> `D-01a`: quién gestiona el catálogo (¿Administrador o Profesor?) está por confirmar. Por ahora
> estas historias se modelan con el actor **Administrador**.

### US-01 — CRUD de Máquinas (Material)

**Como** Administrador, **quiero** gestionar las máquinas y materiales (mancuernas, barras, etc.),
**para** que los ejercicios declaren qué material necesitan y el alumno sepa con qué los hace.

**Reglas:** — · **Prioridad:** Must · **Entidades:** `Material`

```gherkin
Escenario: Alta de una máquina
  Dado que soy Administrador autenticado
  Cuando doy de alta una máquina con nombre y datos válidos
  Entonces la máquina queda disponible para asignarse a ejercicios

Escenario: Nombre duplicado
  Dado que ya existe una máquina con el mismo nombre
  Cuando intento dar de alta otra con ese nombre
  Entonces el sistema rechaza la operación con un error de duplicado

Escenario: Edición y baja
  Dado una máquina existente
  Cuando la edito o la doy de baja
  Entonces los cambios se reflejan en los ejercicios que la referencian
  Y el sistema advierte si la máquina está en uso antes de eliminarla
```

### US-02 — CRUD de Ejercicios

**Como** Administrador, **quiero** gestionar el catálogo de ejercicios (su definición, no su
ejecución), **para** poder armar planes y que el alumno registre entrenamientos contra un catálogo único.

**Reglas:** RN-14, RN-20, RN-26 · **Prioridad:** Must · **Entidades:** `Ejercicio`, `Unidad`, `Material`, `CategoriaEjercicio`

```gherkin
Escenario: Alta de un ejercicio
  Dado que soy Administrador autenticado
  Cuando doy de alta un ejercicio con nombre, categoría, unidad y material
  Entonces el ejercicio queda disponible en el catálogo

Escenario: Unidad obligatoria
  Dado que creo un ejercicio
  Cuando no especifico la unidad de medida (repeticiones, minutos, kilómetros)
  Entonces el sistema rechaza el alta, porque sin unidad no se puede medir ni calcular el récord

Escenario: El ejercicio es una definición reutilizable
  Dado un ejercicio del catálogo
  Cuando se usa en varios planes o entrenamientos
  Entonces el catálogo guarda una sola definición y las ejecuciones la referencian
```

### US-03 — CRUD de Categorías de Ejercicio

**Como** Administrador, **quiero** gestionar las categorías de ejercicio, **para** clasificar el
catálogo y facilitar la búsqueda al armar planes.

**Reglas:** — · **Prioridad:** Should · **Entidades:** `CategoriaEjercicio`

```gherkin
Escenario: Alta y clasificación
  Dado que soy Administrador autenticado
  Cuando doy de alta una categoría
  Entonces puedo asignar ejercicios a esa categoría

Escenario: Baja de categoría en uso
  Dado una categoría con ejercicios asignados
  Cuando intento darla de baja
  Entonces el sistema bloquea la operación o exige reasignar los ejercicios primero
```

### US-04 — CRUD de Objetivos de Plan

**Como** Administrador, **quiero** gestionar los objetivos de plan (clasificación), **para** que los
profesores puedan clasificar los planes por propósito.

**Reglas:** — · **Prioridad:** Should · **Entidades:** `ObjetivoPlan`

```gherkin
Escenario: Alta de objetivo
  Dado que soy Administrador autenticado
  Cuando doy de alta un objetivo de plan
  Entonces queda disponible para clasificar planes al crearlos

Escenario: Baja de objetivo en uso
  Dado un objetivo asignado a planes existentes
  Cuando intento darlo de baja
  Entonces el sistema bloquea o exige reasignar los planes primero
```

### US-05 — CRUD de Unidades

**Como** Administrador, **quiero** gestionar las unidades de medida (repeticiones, minutos,
kilómetros), **para** medir los ejercicios de forma consistente y poder comparar progreso.

**Reglas:** RN-14, RN-20 · **Prioridad:** Must · **Entidades:** `Unidad`, `Cantidad` (VO)

```gherkin
Escenario: Alta de unidad
  Dado que soy Administrador autenticado
  Cuando doy de alta una unidad
  Entonces queda disponible al definir ejercicios y series

Escenario: Unidad en uso no se elimina
  Dado una unidad usada por ejercicios existentes
  Cuando intento darla de baja
  Entonces el sistema bloquea la operación para no romper registros históricos
```

---

## Épica 2 — Gestión de alumnos y profesores

Altas, bajas y ciclos de vida de las personas.

### US-06 — Alta de alumno

**Como** Administrador, **quiero** dar de alta un alumno y asignarle un profesor, **para** que tenga
seguimiento desde el día uno.

**Reglas:** RN-9, RN-17, RN-19 · **Prioridad:** Must

```gherkin
Escenario: Alta con profesor
  Dado que soy Administrador autenticado
  Cuando doy de alta un alumno con datos válidos y le asigno un profesor
  Entonces el alumno queda activo y visible para su profesor asignado

Escenario: Alta sin profesor
  Dado que doy de alta un alumno sin asignarle profesor
  Cuando confirmo el alta
  Entonces el alumno queda activo y aparece como "sin profesor asignado"
  Y queda disponible para reasignación (US-11)

Escenario: Privacidad
  Dado un alumno activo
  Cuando otro profesor (no asignado) consulta sus datos
  Entonces no puede ver su plan ni sus entrenamientos (RN-9)
```

### US-07 — Baja de alumno

**Como** Administrador, **quiero** dar de baja a un alumno, **para** que no pueda operar pero sin
perder su historial.

**Reglas:** RN-16, RN-17 · **Prioridad:** Must

```gherkin
Escenario: Baja conserva historial
  Dado un alumno activo con historial de entrenamientos
  Cuando lo doy de baja
  Entonces el alumno no puede registrar entrenamientos
  Y su historial de entrenamientos se conserva intacto (RN-16)

Escenario: No se le puede asignar plan
  Dado un alumno dado de baja
  Cuando un profesor intenta crearle un plan
  Entonces el sistema lo impide (RN-17)

Escenario: Baja es reversible por reactivación
  Dado un alumno dado de baja
  Cuando se lo reactiva (US-08)
  Entonces recupera la capacidad de entrenar con su progreso previo
```

### US-08 — Reactivación de alumno

**Como** Administrador, **quiero** reactivar a un alumno dado de baja que retoma el gym, **para**
continuar su seguimiento de progreso donde quedó.

**Reglas:** RN-19 · **Prioridad:** Should

```gherkin
Escenario: Reactivación continúa el progreso
  Dado un alumno dado de baja con historial previo
  Cuando lo reactivo
  Entonces vuelve a estar activo
  Y su historial de progreso se continúa donde quedó (RN-19)

Escenario: Reactivación y profesor
  Dado un alumno reactivado que había quedado sin profesor
  Cuando se lo reactiva
  Entonces queda disponible para reasignársele un profesor

❓ D-05: al reactivar, ¿se reasigna automáticamente al profesor previo si sigue activo, o queda sin asignar?
```

### US-09 — Alta de profesor

**Como** Administrador, **quiero** dar de alta un profesor, **para** que pueda armar planes y hacer
seguimiento de sus alumnos.

**Reglas:** RN-1, RN-18 · **Prioridad:** Must

```gherkin
Escenario: Alta de profesor
  Dado que soy Administrador autenticado
  Cuando doy de alta un profesor con datos válidos
  Entonces el profesor queda activo
  Y puede iniciar sesión y armar planes (RN-1)
```

### US-10 — Baja de profesor

**Como** Administrador, **quiero** dar de baja a un profesor, **para** que pierda el acceso y sus
alumnos queden disponibles para reasignación.

**Reglas:** RN-15, RN-18 · **Prioridad:** Must

```gherkin
Escenario: Pérdida de acceso
  Dado un profesor activo
  Cuando lo doy de baja
  Entonces no puede acceder a la aplicación (RN-18)

Escenario: Alumnos quedan sin profesor
  Dado un profesor dado de baja con alumnos asignados
  Cuando se confirma la baja
  Entonces sus alumnos quedan sin profesor asignado (RN-15)
  Y quedan disponibles para reasignación (US-11)

Escenario: Los planes existentes no se destruyen
  Dado un profesor dado de baja que había creado planes
  Cuando se confirma la baja
  Entonces los planes y el historial de sus alumnos permanecen accesibles para los profesores
```

### US-11 — Reasignación de alumnos

**Como** Administrador o Profesor, **quiero** reasignar alumnos a otros profesores, **para** que
ningún alumno quede sin seguimiento cuando su profesor se da de baja.

**Reglas:** RN-9, RN-15 · **Prioridad:** Must

```gherkin
Escenario: Reasignar alumnos huérfanos
  Dado alumnos sin profesor asignado (por baja de su profesor)
  Cuando los reasigno a un profesor activo
  Entonces ese profesor pasa a ver sus planes y entrenamientos (RN-9)

Escenario: Reasignación selectiva
  Dado varios alumnos sin profesor
  Cuando reasigno solo algunos
  Entonces los no reasignados siguen listados como "sin profesor asignado"
```

---

## Épica 3 — Planes de entrenamiento

Corazón del dominio. Un plan es de **4 semanas** (RN-10), dividido en **core, movilidad y fuerza**
(RN-3), con **movilidad y core iguales** en todos los días y **fuerza particular** por día (RN-5).

### US-12 — CRUD de Plan

**Como** Profesor, **quiero** crear, editar, copiar, listar y eliminar planes personalizados,
**para** prescribir el entrenamiento de mis alumnos según su objetivo.

**Reglas:** RN-1, RN-2, RN-3, RN-4, RN-5, RN-6, RN-7, RN-8, RN-10, RN-12, RN-13, RN-23 · **Prioridad:** Must
**Entidades:** `Plan`, `DiaDelPlan`, `Semana` (VO), `Progresión semanal` (VO), `detalleDiaPlan` (VO)

```gherkin
Escenario: Solo profesores crean planes
  Dado un alumno autenticado
  Cuando intenta crear un plan
  Entonces el sistema lo impide (RN-1)

Escenario: Duración fija de 4 semanas
  Dado que creo un plan
  Cuando defino su rango de fechas
  Entonces el plan abarca 4 semanas (RN-10)

Escenario: Cantidad de días válida
  Dado que armo un plan
  Cuando defino los días
  Entonces debe tener al menos 1 día y como máximo 5 (RN-2)

Escenario: Las tres partes obligatorias
  Dado que armo un plan
  Cuando defino sus bloques
  Entonces debe tener core, movilidad y fuerza (RN-3)
  Y no puede faltar core ni movilidad (RN-4)

Escenario: Movilidad y core compartidos
  Dado un plan con varios días
  Cuando defino movilidad y core
  Entonces esos bloques son iguales para todos los días
  Y solo el bloque de fuerza es particular de cada día (RN-5)

Escenario: Ejercicio no repetido en un día
  Dado un día del plan
  Cuando intento agregar el mismo ejercicio dos veces
  Entonces el sistema lo rechaza (RN-23)

Escenario: Progresión semanal compartida
  Dado un plan con una progresión semanal
  Cuando la defino
  Entonces aplica igual a todos los ejercicios
  Y una diferencia puntual se expresa como comentario (RN-8)

Escenario: Copiar plan personalizado
  Dado un plan personalizado que creé antes
  Cuando lo copio para crear uno nuevo
  Entonces el nuevo plan parte de una copia de ese plan (RN-7)
  Y también puedo crear un plan desde cero

Escenario: No solapamiento de planes del alumno
  Dado un alumno con un plan que abarca tal rango de fechas
  Cuando intento crearle otro plan con fechas solapadas
  Entonces el sistema lo rechaza (RN-13)

Escenario: Planes futuros permitidos
  Dado un alumno con un plan vigente
  Cuando creo un plan con fecha de inicio posterior al fin del actual
  Entonces se guarda como plan futuro (RN-11)

Escenario: Plan mostrado al alumno
  Dado un alumno con varios planes en el tiempo
  Cuando el alumno consulta su plan
  Entonces se le muestra el plan que abarca la fecha actual (RN-12)

Escenario: Eliminar plan
  Dado un plan personalizado
  Cuando lo elimino
  Entonces desaparece de la lista de planes del profesor
```

### US-13 — Ver plan del alumno

**Como** Alumno **quiero** ver los ejercicios de mi plan filtrando por día; **como** Profesor
**quiero** elegir un alumno y ver su plan, **para** conocer qué le toca hacer.

**Reglas:** RN-9, RN-12, RN-25 · **Prioridad:** Must

```gherkin
Escenario: El alumno ve su plan
  Dado un alumno autenticado con un plan vigente
  Cuando abre su plan
  Entonces ve los ejercicios organizados por día
  Y puede filtrar por día

Escenario: El alumno solo ve el suyo
  Dado un alumno autenticado
  Cuando intenta consultar el plan de otro alumno
  Entonces el sistema se lo impide (RN-9)

Escenario: El profesor elige un alumno
  Dado un profesor autenticado con alumnos asignados
  Cuando selecciona un alumno
  Entonces ve el plan de ese alumno

Escenario: Guía con la carga de la semana
  Dado un plan vigente mostrado al alumno
  Cuando ve los ejercicios del día
  Entonces se muestran como guía con la carga de trabajo correspondiente a la semana actual (RN-25)
```

---

## Épica 4 — Entrenamiento

### US-14 — Registrar entrenamiento

**Como** Alumno, **quiero** registrar mi entrenamiento del día (series, repeticiones y peso) tomando
el plan como guía, **para** dejar la evidencia de lo que hice y alimentar mi progreso.

**Reglas:** RN-20, RN-21, RN-22, RN-24, RN-25, RN-26 · **Prioridad:** Must
**Entidades:** `Entrenamiento`, `EjercicioRealizado`, `Serie` (VO), `Cantidad` (VO)

```gherkin
Escenario: Un único entrenamiento en curso
  Dado un alumno que ya tiene un entrenamiento en curso
  Cuando intenta iniciar otro
  Entonces el sistema lo impide (RN-21)

Escenario: Guía desde el plan
  Dado un alumno que inicia un entrenamiento
  Cuando se le ofrecen los ejercicios
  Entonces se muestran los ejercicios del día del plan con la carga de la semana (RN-25)

Escenario: Se puede registrar cualquier ejercicio del catálogo
  Dado un alumno en un entrenamiento
  Cuando registra un ejercicio que no está en el plan del día
  Entonces el sistema lo permite (RN-26)
  Y no es obligatorio registrar todos los ejercicios del día del plan

Escenario: Ejercicio no repetido en el entrenamiento
  Dado un entrenamiento en curso
  Cuando intento registrar dos veces el mismo ejercicio
  Entonces el sistema lo rechaza (RN-24)

Escenario: Validación de series
  Dado que cargo una serie
  Cuando ingreso una cantidad de repeticiones menor a 1
  Entonces el sistema la rechaza (reps >= 1)
  Y el peso puede ser 0 o quedar ausente, pero no negativo (RN-20)

Escenario: Finalización inmutable
  Dado un entrenamiento en curso con series cargadas
  Cuando lo finalizo
  Entonces queda inmutable: no se puede modificar después (RN-22)

Escenario: Notas del alumno
  Dado un entrenamiento
  Cuando el alumno agrega notas
  Entonces las notas se guardan asociadas a ese entrenamiento
```

### US-15 — Ver última carga usada

**Como** Alumno, **quiero** ver lo que hice en las sesiones anteriores de un ejercicio al iniciar el
entrenamiento, **para** saber con qué carga retomar sin buscar en el historial.

**Reglas:** RN-25, RN-26 · **Prioridad:** Should

> `D-03` resuelto: se muestran **todas las series de los días anteriores**.

```gherkin
Escenario: Mostrar las series previas
  Dado un alumno que inicia un entrenamiento con un ejercicio que ya hizo antes
  Cuando se muestra ese ejercicio
  Entonces ve todas las series registradas en los días anteriores

Escenario: Ejercicio sin antecedentes
  Dado un ejercicio que el alumno nunca registró
  Cuando se muestra en el entrenamiento
  Entonces se indica que no hay carga previa
```

---

## Épica 5 — Seguimiento y analítica

### US-16 — Ver evolución por ejercicio

**Como** Alumno o Profesor, **quiero** ver cómo evoluciona la **mejor serie** de un ejercicio
sesión a sesión dentro de un período, **para** ver el progreso más allá del récord puntual.

**Reglas (dominio):** evolución = comparación de la mejor serie por fecha de entrenamiento;
visibilidad (RN-9 antigua / RN-23 nueva); "mejor serie" del lenguaje ubicuo · **Prioridad:** Should

> `D-02` resuelto y **especificado**. `D-02a`: el gráfico grafica **un punto por entrenamiento =
> mejor serie de esa sesión** (con peso: el mayor peso, mostrando las reps de esa serie; sin peso:
> la mayor cantidad de la sesión). La **lista de sesiones** sí muestra todas las series.
> `D-02b`: con peso el eje Y es kg; sin peso el eje Y es la cantidad (reps/min/km) y **desaparece el
> toggle de volumen**. `D-02c`: Volumen (Σ peso × reps) es métrica secundaria **opcional**, lo primero
> a cortar del MVP.
> **Solo entran entrenamientos finalizados** (inmutables). **Período**: 1M / 3M / 6M / 1A / Todo
> (por defecto 3M). Un alumno dado de baja y reactivado continúa con su historial previo.
> Pantallas: `docs/Arquitectura de pantallas.md` → A-05 Evolución (+ variante del profesor).

```gherkin
Escenario: Selección de ejercicio y período
  Dado un alumno con historial
  Cuando abre Evolución, elige un ejercicio y un período
  Entonces ve la evolución de ese ejercicio acotada al período (por defecto 3 meses)
  Y el selector de ejercicio prioriza los que el alumno ya registró

Escenario: Un punto por sesión (mejor serie)
  Dado un ejercicio con registros en varias sesiones
  Cuando se muestra el gráfico
  Entonces cada sesión aporta un punto con su mejor serie
  Y con peso se grafica el mayor peso del día; sin peso, la mayor cantidad

Escenario: Récord destacado
  Dado un historial con un récord en el período
  Cuando se muestra el gráfico
  Entonces el punto del récord aparece destacado

Escenario: Tarjetas derivadas
  Dado un período con datos
  Entonces se muestran Récord (valor y fecha), Última carga (valor, reps y fecha) y la variación del
  período (primer valor → último valor, con signo y %)
  Y ninguna se persiste: todas se derivan del historial

Escenario: Lista de sesiones
  Dado el período elegido
  Entonces se listan las sesiones de la más reciente a la más antigua con todas sus series
  Y con insignia de récord donde corresponda
  Y al tocar una fila se abre el detalle de ese entrenamiento (reutiliza la pantalla del historial)

Escenario: Sin datos
  Dado un ejercicio que el alumno nunca registró
  Entonces se muestra "Todavía no registraste este ejercicio", sin gráfico ni variación

Escenario: Un solo registro
  Dado un ejercicio con un único registro
  Entonces se muestra el valor sin línea de tendencia y sin variación

Escenario: Ejercicio sin peso
  Dado un ejercicio medido en reps, minutos o kilómetros
  Entonces el eje Y pasa a ser la cantidad y no se ofrece el toggle de volumen

Escenario: Privacidad
  Dado un alumno
  Cuando otro alumno intenta ver su evolución
  Entonces el sistema se lo impide (RN-9)
  Y solo el propio alumno y los profesores pueden verla
```

### US-17 — Ver récord por ejercicio

**Como** Alumno o Profesor, **quiero** ver el récord de un ejercicio, **para** saber rápidamente cuál
fue el mayor registro histórico.

**Reglas:** RN-9, RN-14 · **Prioridad:** Should

```gherkin
Escenario: Récord en ejercicios con peso
  Dado un ejercicio al que se le carga peso
  Cuando consulto el récord
  Entonces se muestra el mayor peso levantado registrado

Escenario: Récord en ejercicios sin peso
  Dado un ejercicio sin peso (por ejemplo, por cantidad)
  Cuando consulto el récord
  Entonces se muestra la mayor cantidad registrada (RN-14)

Escenario: El récord es derivado
  Dado un historial de entrenamientos
  Cuando consulto el récord
  Entonces el sistema lo calcula a partir del historial
  Y no se persiste como valor almacenado

Escenario: Aislamiento por alumno
  Dado dos alumnos distintos
  Cuando consulto el récord de un ejercicio
  Entonces solo veo el del alumno consultado (RN-9)
```

### US-18 — Consultar historial de entrenamientos

**Como** Alumno o Profesor, **quiero** consultar el historial de entrenamientos de un alumno,
**para** analizar el detalle de qué hizo en cada sesión.

**Reglas:** RN-9, RN-16, RN-22 · **Prioridad:** Must

```gherkin
Escenario: Listado de entrenamientos
  Dado un alumno con entrenamientos finalizados
  Cuando consulto su historial
  Entonces veo la lista de sus entrenamientos con su fecha

Escenario: Detalle de un entrenamiento
  Dado un entrenamiento del historial
  Cuando abro su detalle
  Entonces veo los ejercicios, series, cantidades y pesos registrados

Escenario: Historial de un alumno dado de baja
  Dado un alumno dado de baja con historial previo
  Cuando un profesor consulta su historial
  Entonces el historial está disponible, aunque el alumno no pueda entrenar (RN-16)

Escenario: Privacidad
  Dado un alumno
  Cuando otro alumno intenta ver su historial
  Entonces el sistema se lo impide (RN-9)
```

### US-19 — Consultar alumnos sin plan o con plan por terminar

**Como** Profesor, **quiero** ver qué alumnos están sin plan o con el plan por vencer esta semana,
**para** preparar a tiempo los planes nuevos.

**Reglas:** RN-9, RN-10, RN-12 · **Prioridad:** Should

> `D-04` resuelto: "por terminar" = **semana calendario en curso** y además se **incluyen los planes ya vencidos**.

```gherkin
Escenario: Alumnos sin plan
  Dado un profesor con alumnos asignados
  Cuando consulta sus alumnos
  Entonces ve los que no tienen ningún plan asignado

Escenario: Planes que vencen esta semana
  Dado un profesor con alumnos con planes vigentes
  Cuando consulta sus alumnos
  Entonces ve los que tienen el plan terminando dentro de la semana calendario en curso

Escenario: Planes ya vencidos
  Dado un alumno cuyo plan pasó su fecha de fin y no tiene uno nuevo vigente
  Cuando el profesor consulta sus alumnos
  Entonces ese alumno aparece en el listado, con su plan vencido incluido

Escenario: Alcance del listado
  Dado un profesor autenticado
  Cuando consulta el listado
  Entonces solo ve sus alumnos asignados (RN-9)
```

❓ D-04a: ¿el listado distingue visualmente "sin plan", "vence esta semana" y "vencido", o es una sola lista?

---

## Índice de reglas de negocio referenciadas

| Regla | Descripción | Historias |
| --- | --- | --- |
| RN-1 | Solo profesores arman planes | US-09, US-12 |
| RN-2 | Plan: 1 a 5 días | US-12 |
| RN-3 | Plan dividido en core, movilidad, fuerza | US-12 |
| RN-4 | Debe tener ejercicios de las tres partes | US-12 |
| RN-5 | Movilidad y core iguales todos los días; fuerza por día | US-12 |
| RN-6 | Bloques de movilidad, core y fuerza | US-12 |
| RN-7 | Copiar plan personalizado / crear desde cero | US-12 |
| RN-8 | Progresión semanal compartida; diferencia por comentario | US-12 |
| RN-9 | Visibilidad: profesores y el propio alumno | US-06, US-11, US-13, US-16, US-17, US-18, US-19 |
| RN-10 | Plan de 4 semanas | US-12, US-19 |
| RN-11 | Planes futuros permitidos | US-12 |
| RN-12 | Se muestra el plan que abarca la fecha actual | US-13, US-19 |
| RN-13 | Sin solapamiento de planes por alumno | US-12 |
| RN-14 | Récord = mayor peso / mayor cantidad | US-02, US-05, US-16, US-17 |
| RN-15 | Baja de profesor → alumnos sin asignar | US-10, US-11 |
| RN-16 | Baja de alumno: no entrena, historial se conserva | US-07, US-18 |
| RN-17 | No se hace plan a alumno dado de baja | US-06, US-07 |
| RN-18 | Profesor dado de baja no accede | US-09, US-10 |
| RN-19 | Reactivación continúa el progreso | US-06, US-08 |
| RN-20 | Reps >= 1, peso >= 0 o ausente | US-02, US-05, US-14 |
| RN-21 | Un único entrenamiento en curso | US-14 |
| RN-22 | Entrenamiento finalizado inmutable | US-14, US-18 |
| RN-23 | Ejercicio no repetido en un día del plan | US-12 |
| RN-24 | Ejercicio no repetido en un entrenamiento | US-14 |
| RN-25 | Ejercicios guía + carga de la semana | US-13, US-14, US-15 |
| RN-26 | Entrenamiento ligado al plan/día, pero se puede registrar cualquier ejercicio | US-02, US-14, US-15 |

## Decisiones abiertas (resumen)

| ID | Decisión | Impacto | Bloquea |
| --- | --- | --- | --- |
| D-01 | Resuelto: existe el rol Administrador (altas/bajas de profesores y alumnos) | Actores y permisos | — |
| D-01a | ¿Quién gestiona el catálogo (Máquinas, Ejercicios, Categorías, Objetivos, Unidades)? | US-01..US-05 | Sin definir |
| D-02 | Resuelto: pantalla Evolución (ver spec en US-16) | US-16 | — |
| D-02a | Resuelto: gráfico = 1 punto/sesión (mejor serie); la lista muestra todas las series | US-16 | — |
| D-02b | Resuelto: sin peso → eje = cantidad (reps/min/km); sin toggle de volumen | US-16 | — |
| D-02c | Volumen (Σ peso × reps) como métrica secundaria opcional; 1º a cortar del MVP | US-16 | — |
| D-03 | Resuelto: todas las series de los días anteriores | US-15 | — |
| D-04 | Resuelto: "por terminar" = semana calendario en curso + planes ya vencidos | US-19 | — |
| D-04a | ¿El listado distingue "sin plan" / "vence esta semana" / "vencido"? | US-19 | Sin definir |
| D-05 | En reactivación, ¿se reasigna al profesor previo? | US-08 | Sin definir |

## Notas de cobertura

- Las 19 funcionalidades del documento fuente están cubiertas: 5 CRUDs de catálogo (US-01..US-05),
  6 de personas (US-06..US-11), plan (US-12..US-13), entrenamiento (US-14..US-15) y analítica
  (US-16..US-19).
- El CRUD de Plan se modeló como una sola historia por ser una funcionalidad de la lista; se puede
  partir en sub-historias (crear / editar / copiar / eliminar) si el equipo usa una granularidad
  de una historia por flujo.
- Prioridades MoSCoW y decisión de actor para el catálogo son propuestas sujetas a validación.

## Mapeo de reglas (numeración antigua → `Analisis de dominio.md`)

| Vieja (`Reglas de negocio.md`) | Tema | Nueva (`Analisis de dominio.md`) |
| --- | --- | --- |
| RN-1 | solo profesores arman planes | RN-8 |
| RN-2 | plan 1..5 días | RN-4 |
| RN-3 / RN-6 | bloques movilidad/core/fuerza | RN-1 |
| RN-4 | debe tener las tres partes | RN-2 |
| RN-5 | movilidad y core iguales; fuerza por día | RN-3 |
| RN-7 | copiar plan personalizado | RN-9 |
| RN-8 | progresión semanal compartida | RN-7 |
| RN-9 | visibilidad (profesores + el propio alumno) | RN-23 |
| RN-10 | plan de 4 semanas | RN-5 |
| RN-11 / RN-13 | planes futuros / no solapamiento | RN-10 |
| RN-12 | se muestra el plan de la fecha actual | RN-11 |
| RN-14 | récord = mayor peso / mayor cantidad | *(lenguaje ubicuo: "mejor serie")* |
| RN-15 | baja de profesor → alumnos sin asignar | RN-19 |
| RN-16 | baja de alumno: no entrena, historial se conserva | RN-21 |
| RN-17 | no se hace plan a alumno dado de baja | RN-12 |
| RN-18 | profesor dado de baja no accede | RN-20 |
| RN-19 | reactivación continúa el progreso | RN-22 |
| RN-20 | reps ≥ 1, peso ≥ 0 o ausente | RN-17 |
| RN-21 | un único entrenamiento en curso | RN-15 |
| RN-22 | entrenamiento finalizado inmutable | RN-18 |
| RN-23 | ejercicio no repetido en un día del plan | RN-6 |
| RN-24 | ejercicio no repetido en un entrenamiento | RN-16 |
| RN-25 | guía + carga de la semana | RN-14 |
| RN-26 | entrenamiento ligado al plan/día, cualquier ejercicio | RN-13 |
