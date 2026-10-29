# Reglas de negocio

Documento normativo del dominio **Entrenamiento**. Es la **única fuente de verdad** de las reglas de negocio del MVP: reemplaza la lista preliminar de 26 reglas y la tabla de 23 reglas que vivía en `Analisis de dominio.md`.

Cada regla tiene un identificador estable `RN-nn` que se usa para trazabilidad en specs de OpenSpec, criterios de aceptación de historias de usuario, nombres de tests y matriz de cobertura.

## Historial de versiones

| Versión | Descripción | Fecha |
| :--- | :--- | :--- |
| Preliminar | Lista inicial de 26 reglas sin agrupar por agregado. | 2026-10-20 |
| **2.0** | Reordenamiento y desdoblamiento a **42 reglas** agrupadas por concepto del dominio, alineadas al modelo de agregados definitivo. Sustituye las 26 reglas preliminares y las 23 de `Analisis de dominio.md`. | 2026-10-28 |

## Convenciones

- **Identificador:** `RN-nn`, estable. Un cambio de alcance agrega o modifica reglas, no reutiliza identificadores.
- **Concepto:** agregado o conjunto de agregados que posee la regla. La regla se valida donde vive el conocimiento: dentro de la raíz del agregado o en un servicio de dominio cuando cruza agregados.
- **Trazabilidad:** toda spec de OpenSpec, criterio de aceptación y test que verifique una regla la referencia por su identificador.
- **Exigencia de test:** las 42 reglas deben tener al menos un test automatizado que pase antes del despliegue final. Una historia de usuario no se considera terminada mientras alguna regla que implementa carezca de test.

## Reglas

| ID | Concepto | Regla |
| :--- | :--- | :--- |
| RN-01 | Plan | El plan se separa en bloques de movilidad, core y fuerza (este último incluye la parte principal del entrenamiento, todo lo que no sea movilidad o core), y debe tener ejercicios en los tres bloques. |
| RN-02 | Plan | Los bloques de movilidad y core son iguales para todos los días del plan, mientras que el bloque de fuerza es particular de cada día. |
| RN-03 | Plan | El plan no puede ser para más de 5 días (el gym solo abre 5 días a la semana) y debe ser para al menos 1. |
| RN-04 | Plan | Un plan tiene una duración variable en semanas, con un mínimo de 4 y un máximo de 12. |
| RN-05 | Plan | Un ejercicio no se puede repetir dentro del mismo día del plan. |
| RN-06 | Plan | Todos los ejercicios comparten la misma progresión semanal. Si se quiere indicar algo diferente para uno, se hace como comentario. |
| RN-07 | Plan | Debe existir exactamente una prescripción semanal por cada semana del plan. |
| RN-08 | Plan | Un plan está finalizado si su fecha de fin es anterior a hoy, vigente si abarca la fecha actual y futuro si su fecha de inicio es posterior a hoy. El plan que se le muestra al alumno para guiarlo es el vigente. |
| RN-09 | Plan | Un alumno no puede tener planes cuyas fechas se solapen, pero un profesor puede cargar planes futuros (con fecha de inicio posterior a la fecha de fin de su plan vigente) para un alumno. |
| RN-10 | Plan | No se le puede hacer un plan a un alumno dado de baja. |
| RN-11 | Plan | Solo los profesores pueden armar los planes de entrenamiento. |
| RN-12 | Plan | Solo el profesor asignado al alumno puede modificar o eliminar su plan. |
| RN-13 | Plan | Un plan personalizado se puede crear desde cero o copiando otro plan personalizado que haya creado ese mismo profesor anteriormente. |
| RN-14 | Plan | Un plan finalizado no se modifica. |
| RN-15 | Plan | No se puede quitar un día ni eliminar un plan con entrenamientos asociados. |
| RN-16 | Entrenamiento | Un entrenamiento se asocia al plan vigente del alumno, a un día y a una semana de ese plan elegidos por el alumno, pero el alumno puede registrar cualquier ejercicio del catálogo, esté o no en el plan, y no es obligatorio registrar todos los ejercicios del día. |
| RN-17 | Entrenamiento | No se puede registrar entrenamientos si el alumno no tiene plan vigente. |
| RN-18 | Entrenamiento | La fecha con que se registra un entrenamiento es siempre la actual, sin carga retroactiva. |
| RN-19 | Entrenamiento | Los ejercicios del día elegido se deben ofrecer como guía, junto con la carga de trabajo (prescripción semanal) de la semana elegida. |
| RN-20 | Entrenamiento | Un alumno tiene un único entrenamiento en curso a la vez. |
| RN-21 | Entrenamiento | Un ejercicio no se puede repetir dentro del mismo entrenamiento. |
| RN-22 | Entrenamiento | Una serie debe tener cantidad ≥ 1 y peso ≥ 0 (o ausente). |
| RN-23 | Entrenamiento | Para finalizar un entrenamiento se necesita al menos un ejercicio realizado, y cada ejercicio con al menos una serie. |
| RN-24 | Entrenamiento | Un entrenamiento finalizado es inmutable. |
| RN-25 | Alumno y Profesor | No se pueden tener registrados dos alumnos o dos profesores con igual nombre y número de documento. |
| RN-26 | Alumno y Profesor | Solo se asignan profesores activos y solo se asignan o reasignan alumnos activos. |
| RN-27 | Alumno y Profesor | Al dar de baja un profesor, sus alumnos quedan sin profesor asignado, pudiendo luego ser reasignados. |
| RN-28 | Alumno | Un alumno sin profesor puede seguir consultando su plan y entrenando. No aparece en el seguimiento de ningún profesor. |
| RN-29 | Alumno | El historial de un alumno dado de baja se conserva. |
| RN-30 | Alumno | Un alumno dado de baja puede volver a darse de alta y el seguimiento de su progreso debe continuarse donde quedó. |
| RN-31 | Alumno | Al reactivar un alumno, conserva su profesor si sigue activo; si no, queda sin profesor. |
| RN-32 | Usuario | Alumno y profesor tienen un usuario con email obligatorio y único, creado en el alta. |
| RN-33 | Usuario | La contraseña por defecto que se asigna a alumnos y profesores es su documento. |
| RN-34 | Usuario | Un profesor o alumno dado de baja no puede acceder a la aplicación. |
| RN-35 | Plan, Entrenamiento, Alumno y Profesor | El plan y los entrenamientos de un alumno son visibles para su profesor y solo para ese alumno. |
| RN-36 | Catálogo | El nombre es obligatorio y único dentro de cada catálogo, sin distinguir mayúsculas. |
| RN-37 | Catálogo | No se puede eliminar un elemento en uso: categoría, material o unidad (por algún ejercicio), objetivo (por algún plan), ejercicio (por algún plan o entrenamiento). |
| RN-38 | Catálogo | Categoría y unidad del ejercicio son obligatorias. El material es opcional (ej.: plancha). |
| RN-39 | Catálogo | La foto de un ejercicio es opcional. Si se reemplaza o se quita, los planes y entrenamientos que lo referencian pasan a mostrar la foto vigente. |
| RN-40 | Seguimiento | La semana va de lunes a domingo y el mes es calendario. |
| RN-41 | Seguimiento | La mejor serie de un ejercicio se determina así: si las series del ejercicio tienen peso, es la de mayor peso y, si empatan, la de mayor cantidad; si ninguna tiene peso (peso ausente o igual a 0), es la de mayor cantidad. Si hay empate total entre series, gana la más antigua. La unidad define qué significa la cantidad (repeticiones, segundos o metros). |
| RN-42 | Seguimiento | El récord de un ejercicio es su mejor serie considerando todo el historial del alumno; la evolución es la mejor serie de cada entrenamiento dentro del período indicado. |

## Cobertura de test

La métrica de **cobertura de reglas de negocio** se calcula como:

```
Cobertura = (reglas verificadas por al menos un test que pasa / 42) × 100
```

La trazabilidad se declara en el nombre del test con el identificador entre corchetes:

```ts
it('[RN-09] no permite planes con fechas solapadas', () => { ... });
```

Las 42 reglas deben tener test automatizado antes del despliegue final, y ninguna historia de usuario se considera terminada mientras una regla que implementa carezca de test.
