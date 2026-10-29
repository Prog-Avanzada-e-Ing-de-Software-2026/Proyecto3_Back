**detalleDiaPlan:**  
(ejercicio \+ orden) puede ser un value object dentro del Día.-\> value object

**Semana (VO):** → nombre alternativo: "Prescripción semanal"    
├─ series   
├─ cantidad objetivo (rango \+ unidad)    
├─ RIR    
└─ descanso?

**DiaDelPlan:**  
sería como un detalle del plan, los ejercicios para un día particular, le pongo este nombre por DDD.

**Progresión semanal (VO):**  
└─ semanas: \[Semana, Semana, Semana, Semana\]   ← posición 1 \= semana 1, etc.  

**PLAN:**  
Conjunto de ejercicios, divididos en calentamiento, entreno y elongación (o movilidad, core y fuerza) que guiará el entrenamiento de un alumno.

**ObjetivoPlan:**  
Clasificiacion de los planes

**Material:**  
Se refiere a la maquina o elemento(mancuerna, barra, etc.) Que se requiere para hacer un ejercicio y le sirve al alumno para saber que necesita para hacer el ejercicio.

**Ejercicio:**  
Se refiere a la definición de un ejercicio que se puede hacer, no su ejecución.

**CategoriaEjercicio**

**Unidad:**  
(Repeticiones, minutos, kilometros) es en lo que se mide un ejercicio.

**Entrenamiento:**  
Representa la vista al gimnasio de un alumno en un dia particular para ejercitarse.  
Puede incluir Notas del alumno sobre el entrenamiento.

**EjercicioRealizado:**  
Apunta solo al ejercicio del catalogo, no a un ejercicio de un plan.

**Serie(VO):**  
Ejecucion de un ejercicio, representa un unica ejecucion con una cierta cantidad y un peso opcional.

**Cantidad(VO):**  
Es igual al valor \+ unidad \-\> Serie tendria cantidad en lugar de repeticiones

