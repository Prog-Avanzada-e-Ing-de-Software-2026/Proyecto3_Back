# Decisiones abiertas — Gym MVP

Estado al 18 oct 2026. Reúne las decisiones pendientes que surgieron de revisar
`desing/gym-mvp-wireframes.op` (página *Dirección v2*) contra los documentos de dominio.
Complementa el resumen de `docs/dominio/User Stories.md` (§ *Decisiones abiertas*) y no lo reemplaza:
las decisiones ya listadas allí conservan su ID y aparecen acá referenciadas.

> **Nota de vigencia:** las referencias `RN-n` de este documento usan la numeración del análisis preliminar (26 reglas). La fuente de verdad vigente es `docs/dominio/Reglas de negocio.md` v2.0 (`RN-01`..`RN-42`); remapear cada referencia antes de implementar la decisión afectada.

**Convención de IDs:** `DW-nn` identifica una decisión abierta. La columna *ID doc* indica que la
decisión ya existía en la documentación; la fila lleva el ID original y no se renumera.

---

## Resumen

| ID | Tema | ID doc | Impacto principal |
| --- | --- | --- | --- |
| `DW-01` | P-04 Planes: ¿pantalla propia o selector de "copiar plan"? | — | Nav, P-03, P-04 |
| `DW-02` | AD-03 Reasignación: ¿pantalla o acción contextual? | — | Nav, AD-01, AD-02 |
| `DW-03` | Navegación por rol (Profesor vs Administrador) | — | Nav de todas las pantallas |
| `DW-04` | P-03: ¿solo lectura o edición del plan? | — | P-03, P-05 |
| `DW-05` | P-03 y los bloques compartidos (movilidad / core) | — | P-03 |
| `DW-06` | ¿Existe P-06? | — | P-03, P-06, A-05 |
| `DW-07` | Contenido del menú de fila (`⋯`) | — | AD-01, AD-02 |
| `DW-08` | Paleta de estados (activo / sin profesor / dado de baja) | — | Todas las pantallas con datos |
| `DW-09` | Jerarquía del estado de selección | — | A-04, P-03, nav |
| `DW-10` | ¿El descanso es parte de la prescripción semanal? | — | A-02, A-04, P-05 |
| `DW-11` | Reasignación automática al reactivar un alumno | `D-05` | AD-01, US-08 |
| `DW-12` | Estados del listado de alumnos del profesor | `D-04a` | P-02, P-03 |
| `DW-13` | ¿Quién gestiona el catálogo? | `D-01a` | Nav (`DW-03`), AD-04 |

---

## A. Estructura de pantallas y navegación

### `DW-01` · P-04 Planes: ¿pantalla propia o selector de "copiar plan"?

**Pregunta.** ¿P-04 existe como pantalla del nav, o el listado de planes se reduce a un selector
*"desde cero / copiar un plan anterior"* invocado desde P-03?

**Por qué importa.** Define si sobran un ítem de navegación y una pantalla completa. `US-12` pide
listar, copiar y eliminar planes; `RN-7` solo exige poder copiar un plan propio previo, y eso es un
selector, no una superficie.

**Opciones.**

| Opción | A favor | En contra |
| --- | --- | --- |
| **A.** Quitar P-04 del nav; "Crear plan" en P-03 ofrece desde cero o copiar uno anterior | El caso de uso real (copiar) se resuelve donde se crea el plan; menos superficie | Se pierde un lugar para "eliminar plan" si no se agrega la acción en otro lado |
| **B.** Conservar P-04 como listado de planes de mis alumnos | Es el inventario del profesor | Se solapa con P-02 / P-03 |

**Si se conserva (B), además hay que corregir:**

- El título debe ser el alumno con su número de plan (`Lucía Gómez · Plan 3`), porque la numeración
  es **por alumno**, no global.
- Los filtros *Personalizados / Copias* no representan categorías del dominio: `RN-7` dice que un
  plan se crea desde cero **o** copiando otro. El origen es un dato secundario, no un filtro.
- Falta `Eliminar` (`US-12`) y falta un filtro útil (estado del plan o alumno).
- Las tarjetas repiten el objetivo en el título y en el chip, y los valores no coinciden entre sí.

**Recomendación.** Opción **A**.

**Evidencia.** Frame `v2 · P-04 Planes` (`n3393`) muestra `Plan #3`, `Plan #2` y `Plan #5` para tres
alumnos distintos; `docs/Arquitectura de pantallas.md:65` y `:151`; `docs/User Stories.md:294`;
`docs/Reglas de negocio.md:9`.

---

### `DW-02` · AD-03 Reasignación: ¿pantalla o acción contextual?

**Pregunta.** ¿"Reasignación" es una pantalla con ítem propio en el nav, o una acción contextual?

**Por qué importa.** Es una tarea episódica que dispara la baja de un profesor (`RN-15`), no una
superficie que se visita. El nav debería listar superficies, no acciones.

**Opciones.**

| Opción | A favor | En contra |
| --- | --- | --- |
| **A.** Sacar AD-03 del nav: acción masiva en la lista de alumnos filtrada por *Sin profesor*, más un paso *Reasignar ahora / Dejar pendiente* en la confirmación de baja del profesor | La acción vive donde ocurre el problema; cubre el caso individual y el masivo | Requiere el filtro *Sin profesor* en la lista |
| **B.** Conservarla como pantalla | Ya está dibujada y cubre el caso masivo | Ítem de nav para una tarea infrecuente; duplica la lista de alumnos |

**Recomendación.** Opción **A**. Si se aplica, agregar el filtro *Sin profesor* a la lista de alumnos
(hoy los filtros son *Activos* / *Dados de baja*).

**Evidencia.** Frame `v2 · AD-03 Reasignacion` (`n3751`): selección múltiple con *"Asignar
seleccionados"* — funcionalmente es una acción masiva de la lista; `docs/Arquitectura de
pantallas.md:70`; `docs/User Stories.md:268` (`US-11`).

---

### `DW-03` · Navegación por rol (Profesor vs Administrador)

**Pregunta.** ¿Qué ítems ve el Profesor y qué ítems ve el Administrador?

**Por qué importa.** Hoy los frames no coinciden entre sí ni con el dominio, así que cada pantalla
nueva arrastra el error.

**Estado actual.**

| Shell | Ítems dibujados | Frames |
| --- | --- | --- |
| Profesor | Panel · Alumnos · Planes · Profesores · Catálogo | `P-01` a `P-05` |
| Administrador | Panel · Alumnos · Profesores · Reasignación · Catálogo | `AD-01`, `AD-02` |

**Inconsistencias detectadas.**

- *Profesores* y *Catálogo* son de Administrador, pero aparecen en las pantallas de Profesor.
- *Reasignación* aparece en el shell de Administrador y no en el de Profesor, aunque `US-11` habilita
  a ambos roles.
- La visibilidad de *Planes* y *Catálogo* depende de `DW-13` (`D-01a`).

**Opciones.** (1) Fijar un nav por rol: Profesor = Panel · Alumnos (+Catálogo según `D-01a`);
Administrador = Panel · Alumnos · Profesores · Catálogo. (2) Un único nav y ocultar ítems por
permiso en tiempo de ejecución.

**Recomendación.** Opción **1**, y ajustar todos los frames para que coincidan.

**Evidencia.** `docs/Arquitectura de pantallas.md:57-58`; `docs/User Stories.md:669`.

---

## B. Alcance de cada pantalla

### `DW-04` · P-03: ¿solo lectura o edición del plan?

**Pregunta.** ¿La pantalla de detalle de alumno es de consulta o permite editar el plan?

**Por qué importa.** El plan es un agregado con reglas propias: 1 a 5 días, tres bloques
obligatorios, movilidad y core compartidos, progresión semanal compartida (`RN-2` a `RN-8`). Si dos
pantallas editan el mismo agregado, esas validaciones se duplican y tarde o temprano divergen.

**Estado actual.** Mezcla: la barra superior tiene *Crear plan* y *Editar*, y dentro de la tarjeta
del día hay *"+ Agregar ejercicio"*, que pertenece al constructor de plan (`P-05`).

**Recomendación.** `P-03` solo lectura, con `Editar plan →` hacia `P-05` y *Crear plan* cuando el
alumno no tiene plan vigente.

**Evidencia.** Frame `v2 · P-03 Detalle alumno` (`n3330`): topbar *Crear plan* / *Editar* y nodo
`+ Agregar ejercicio` (`n3391`).

---

### `DW-05` · P-03 y los bloques compartidos (movilidad / core)

**Pregunta.** ¿`P-03` muestra movilidad y core, o solo la fuerza?

**Por qué importa.** `RN-5` define movilidad y core como iguales para todos los días del plan. Hoy
la tarjeta del día lista solo ejercicios de fuerza, así que la vista "ver plan" queda incompleta.

**Opciones.**

| Opción | A favor | En contra |
| --- | --- | --- |
| **A.** Bloque *"Movilidad y core (compartidos)"* una vez, y los días con la fuerza | Refleja el agregado y evita repetición | No muestra la secuencia real de ejecución |
| **B.** Repetirlos dentro de cada día | Fiel a lo que va a hacer el alumno | Ruido; son los mismos ejercicios repetidos por día |

**Recomendación.** Opción **A**.

**Evidencia.** `docs/Reglas de negocio.md:5-6`; frame `n3330` (`DayCard` con bloque de fuerza).

---

### `DW-06` · ¿Existe P-06?

**Pregunta.** ¿`P-06` existe como pantalla propia?

**Estado actual.** En la arquitectura, `P-06` es *"Ver plan de alumno"*; en el canvas el frame `P-06`
es *"Evolución prof"*. Además, `P-03` ya tiene las pestañas *Plan actual · Historial · Evolución*,
que absorben ambas funciones.

**Recomendación.** Eliminar `P-06` como ID y dejar plan, historial y evolución dentro de `P-03`
(el alumno los ve en `A-04`, `A-05` y `A-06`). Si se prefiere una pantalla propia, hay que decidir
cuál de las dos es y renombrar el frame en consecuencia.

**Evidencia.** `docs/Arquitectura de pantallas.md:67`; frame `v2 · P-06 Evolucion prof` (`n3085`).

---

## C. Convenciones del sistema de diseño

### `DW-07` · Contenido del menú de fila (`⋯`)

**Pregunta.** ¿El contenido de los menús de fila se documenta en la página `Sistema`, o se muestra
la acción explícita dentro de la fila?

**Estado actual.** La tabla de alumnos usa una píldora de acción primaria más un botón `⋯`. El menú
contiene *"Dar de baja"* (y en la fila de un alumno activo sin profesor, *"Asignar profesor"* quedó
como píldora).

**Por qué importa.** Un control opaco en un wireframe no comunica que ahí adentro hay una acción
destructiva; mostrarla explícita compite por ancho en una tabla de cinco columnas.

**Recomendación.** Documentar los menús en la página `Sistema` (leyenda de interacción) y mantener
`⋯` en la tabla.

**Evidencia.** Frame `v2 · AD-01 Alumnos ABM` (`n3619`): filas con `Actions` + `MenuBtn`;
`docs/Reglas de negocio.md:16-17`.

---

### `DW-08` · Paleta de estados (activo / sin profesor / dado de baja)

**Pregunta.** ¿Se formalizan los colores de estado y se reconcilian con la dirección visual?

**Estado actual.** Hasta la revisión, las pastillas usaban verde para todo, incluido *"Dado de baja"*
en `AD-02`. En la revisión se introdujo:

| Estado | Fondo | Texto |
| --- | --- | --- |
| Activo | `#22301C` | `#7FB069` |
| Sin profesor | `#3A2A12` | `#E0A93A` |
| Dado de baja | `#26272B` | `#8C8A85` |

**Falta.** Registrar los tres estados en la página `Sistema` y decidir si se adopta la dirección
visual propuesta (primario `#F97316`, destructivo `#EF4444`). Criterio sugerido: el destructivo se
usa para la **acción** (por ejemplo *"Dar de baja"*), no para el chip de estado.

**Evidencia.** `docs/Arquitectura de pantallas.md:127-136`; frames `n3619` (`AD-01`) y `n3685`
(`AD-02`, con *"Dado de baja"* en verde).

---

### `DW-09` · Jerarquía del estado de selección

**Pregunta.** ¿Se formaliza qué significa "activo" en los controles segmentados?

**Estado actual.**

- Nav inferior: lima `#C8F25C`.
- `A-04`: los días usan fondo oscuro con texto claro; la semana (nueva) usa borde más claro.
- `P-03`: las pestañas de categoría usan texto claro; el selector de días (nuevo) quedó en lima.

**Propuesta.**

| Nivel | Estilo | Uso |
| --- | --- | --- |
| Selección de contenido | Lima `#C8F25C` | Qué se está viendo: nav, día del plan |
| Contexto o previsualización | Borde claro + texto claro | Semana del plan, pestañas de categoría |

**Recomendación.** Formalizarlo en `Sistema` y alinear `A-04`: el día pasa a lima y la semana queda
en el nivel sutil.

**Evidencia.** Frames `n2658` (`A-04`, pills de día y `WeekSection` `n3871`) y `n3330`
(`P-03`, `DayTabs` `n3882`).

---

## D. Vacíos de dominio

### `DW-10` · ¿El descanso es parte de la prescripción semanal?

**Pregunta.** ¿El descanso (`segundosDeDescanso`) es parte de la prescripción semanal que se le
muestra al alumno?

**Estado actual.** En `docs/Agregados y entidades.md` figura como `descanso?` (con signo de
pregunta), mientras que en `docs/Analisis de dominio.md` el VO *Prescripción semanal* lo incluye
junto con series, cantidad objetivo y RIR. En los wireframes de `A-04` se muestran valores de
descanso como dato de ejemplo.

**Impacto.** Si no corresponde, se quita de `A-04` y de la guía de `A-02`. Si corresponde, deja de
ser opcional en el VO y hay que definirlo en el constructor de plan (`P-05`).

**Evidencia.** `docs/Agregados y entidades.md:8`; `docs/Analisis de dominio.md:65`.

---

### `DW-11` · Reasignación automática al reactivar un alumno (`D-05`)

**Pregunta.** Al reactivar un alumno que quedó sin profesor, ¿se reasigna automáticamente al profesor
previo si sigue activo, o queda sin asignar?

**Impacto en wireframes.** `AD-01`: la acción *"Reactivar"* hoy no dice nada sobre el profesor; según
la respuesta, puede necesitar un paso de confirmación o una propuesta por defecto.

**Evidencia.** `docs/User Stories.md:223` (pregunta abierta) y `:677` (resumen); historia `US-08` en
`:204`.

---

### `DW-12` · Estados del listado de alumnos del profesor (`D-04a`)

**Pregunta.** ¿El listado de alumnos del profesor distingue visualmente *"sin plan"*, *"vence esta
semana"* y *"vencido"*, o es una sola lista?

**Impacto en wireframes.** Badges y filtros de `P-02`, y el estado que se muestra en `P-03`.
Nótese que "sin plan" y "sin profesor" son ejes distintos y no deben compartir chip.

**Evidencia.** `docs/User Stories.md:629`; `docs/Arquitectura de pantallas.md:159`.

---

### `DW-13` · ¿Quién gestiona el catálogo? (`D-01a`)

**Pregunta.** ¿Máquinas, Ejercicios, Categorías, Objetivos y Unidades los gestiona el Administrador,
el Profesor, o ambos?

**Impacto en wireframes.** Decide si `AD-04` existe para uno o para ambos roles y qué muestra el nav
(ver `DW-03`).

**Evidencia.** `docs/User Stories.md:669`; `docs/Arquitectura de pantallas.md:158`.

---

## Decisiones aplicadas en la revisión (revertibles)

Cambios ya hechos sobre la página *Dirección v2* de `desing/gym-mvp-wireframes.op`. Se listan para
que el lector sepa qué está resuelto y no lo vuelva a abrir como pregunta.

| Pantalla | Cambio aplicado | Nodos |
| --- | --- | --- |
| `A-04 Mi plan` | Selector de semana (`Semana 1 de 4 · actual`, pills S1–S4) con la semana actual por defecto; prescripción movida a una segunda línea: `4 series · 8-10 reps · RIR 2 · desc 90 s` | `n3871` (`WeekSection`) |
| `P-03 Detalle alumno` | Selector de días (`Día 1 · Empuje` / `Día 2 · Tirón` / `Día 3 · Pierna`); tarjeta renombrada a *"Bloque de fuerza · Día 1"*; se reemplazaron las tres prescripciones idénticas por valores distintos | `n3882` (`DayTabs`) |
| `AD-01 Alumnos ABM` | Estado de ciclo de vida y asignación de profesor como ejes separados (`Activo` + `Sin profesor`); acciones por estado; fila *"Dado de baja"* con *"Reactivar"*; *"Dar de baja"* fuera del formulario de edición, en el menú de fila | `n3619`, fila nueva `n3906` |

Pendiente de decidir si alguno de estos cambios se formaliza como convención: ver `DW-07`, `DW-08` y
`DW-09`.
