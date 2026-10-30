# Agreement de testing — Backend de HercFit (Proyecto 3)

> **Destinatarios:** agentes de IA y desarrolladores que implementen o modifiquen pruebas del backend.
> **Carácter:** acuerdo operativo para trabajar de manera consistente con el *Plan de Pruebas y Casos de Prueba* del Proyecto 3.
> **Alcance:** backend NestJS + TypeScript/ESM + Vitest + MikroORM + PostgreSQL. No regula el testing del frontend.

## 1. Regla principal

**Probar comportamientos y riesgos reales, no generar tests para incrementar porcentajes.** La unidad de planificación es el **caso de prueba**, vinculado con una regla de negocio o con un criterio de aceptación. Se priorizan las invariantes del dominio, los flujos críticos y los errores con consecuencias para el usuario.

Antes de implementar una prueba, el agente **DEBE**:

1. Identificar la funcionalidad, regla de negocio o criterio de aceptación que se verifica.
2. Localizar la responsabilidad en la arquitectura real del repositorio: dominio, presentación, aplicación o infraestructura.
3. Elegir el nivel mínimo de prueba que permita comprobar el comportamiento sin duplicar innecesariamente otras pruebas.
4. Revisar tests, fixtures, factories, configuración de Vitest y scripts existentes; reutilizar sus convenciones.
5. Definir al menos un resultado observable y una aserción útil. No es válido que el test solo compruebe que una clase existe o que un mock fue invocado sin una razón funcional.

**Orden de prioridad establecido:** `Dominio → Endpoints → Use cases → Persistencia`. Este orden guía la distribución del esfuerzo, no sustituye el análisis de riesgo de una funcionalidad específica.

## 2. Stack obligatorio

| Aspecto | Acuerdo |
|---|---|
| Runner y aserciones | **Vitest** (`describe`, `it`/`test`, `expect`, `vi`) |
| Entorno del backend | **NestJS**, TypeScript y **ESM** |
| Acceso a datos | **MikroORM** |
| Base de datos | **PostgreSQL 18** |
| Infraestructura real para integración | **Testcontainers + Docker** cuando corresponda |
| Contrato HTTP | Pruebas contra la aplicación NestJS inicializada; utilizar **Supertest** si ya está configurado para ello |
| Gestión de dependencias y ejecución | **Yarn**; utilizar los scripts efectivamente declarados en `package.json` |

- **NO** crear tests nuevos con Jest (`jest.fn`, `jest.mock` o su configuración). Usar las utilidades equivalentes de Vitest.
- **NO** sustituir PostgreSQL por MySQL, SQLite ni una base en memoria para verificar consultas o persistencia reales, ni usar una versión mayor distinta de la de producción (ver §4).
- **NO** agregar dependencias, modificar la arquitectura ni crear infraestructura de testing paralela sin necesidad demostrable.
- **NO** suponer rutas, nombres de clases, scripts ni APIs internas que no estén presentes en el repositorio. Inspeccionarlos antes de escribir tests.

## 3. Qué probar por capa

### 3.1 Dominio — máxima prioridad

**Nivel habitual:** pruebas unitarias de entidades, agregados, value objects, validadores y funciones puras. Para servicios de dominio que requieren integración real con otros componentes, utilizar pruebas de integración cuando dicha interacción sea parte del comportamiento a validar.

**DEBE comprobarse**, según corresponda:

- Comportamiento válido y cambios de estado permitidos.
- Rechazo de acciones que violen invariantes del dominio.
- Valores límite, fechas límite y combinaciones de condiciones relevantes.
- Conservación del estado consistente cuando una operación falla.
- Cálculos de seguimiento, orden de desempate y resultados determinísticos.

Preferir instancias reales del modelo de dominio; no simular mediante mocks el comportamiento que precisamente se quiere probar. Una factory de test puede facilitar la construcción de entidades válidas, pero no debe saltarse sus reglas.

**Casos especialmente relevantes del dominio identificado:**

- **Planes:** composición de movilidad/core/fuerza; entre 1 y 5 días; duración de 4 a 12 semanas; ausencia de ejercicios repetidos en un día; prescripciones semanales; prohibición de superponer fechas para un mismo alumno; restricciones sobre alumnos inactivos y planes finalizados.
- **Entrenamientos:** existencia de plan vigente; un único entrenamiento en curso por alumno; no repetir ejercicios en el entrenamiento; cantidad de serie ≥ 1 y peso ≥ 0 (o ausente); requisitos para finalizar; inmutabilidad de un entrenamiento finalizado.
- **Seguimiento:** cálculo de mejor serie, récord y evolución, incluidas prioridades por peso/cantidad y desempate por antigüedad; límites de períodos y fechas.
- **Personas y catálogo:** asignación de profesores activos, baja/reactivación y preservación del historial, unicidad y restricciones de eliminación de elementos en uso.

Estos ejemplos orientan la selección; **no implican generar toda la matriz de tests en cada tarea**. Implementar los casos afectados por el cambio y las regresiones de riesgo asociado.

### 3.2 Presentación / endpoints — integración representativa

**Nivel:** pruebas de integración del contrato HTTP y del funcionamiento conjunto de las capas necesarias.

- **Cada endpoint implementado DEBE tener, como mínimo, un camino de éxito y un camino de fracaso representativos**, salvo que el contrato y la justificación documentada indiquen una excepción.
- Validar códigos HTTP, estructura y tipos de respuesta, transformación/validación de entradas y traducción de errores relevantes.
- Verificar autenticación/autorización y acceso a recursos cuando la funcionalidad tenga requisitos específicos de permisos o pertenencia.
- Usar la aplicación NestJS inicializada, no invocar el método del controller directamente y llamar a eso integración HTTP.
- No repetir todas las combinaciones de reglas de negocio ya cubiertas exhaustivamente en el dominio.
- Probar los mecanismos transversales comunes —autenticación genérica, parsing, filtros globales de excepciones— sobre un endpoint representativo. En los demás, testear únicamente las reglas de acceso y contratos particulares.

Si un endpoint interactúa con persistencia y la prueba pretende verificar ese comportamiento de extremo a extremo **dentro del backend**, usar la infraestructura real necesaria; no declarar que la integración funcionó si se simuló la parte crítica.

### 3.3 Aplicación / use cases — unitarias de orquestación

**Nivel:** unitarias con mocks/stubs de **puertos y dependencias externas** (por ejemplo, interfaces de repositorios), cuando haya decisiones, bifurcaciones o coordinación relevante.

- Validar la secuencia de acciones cuando el orden importe, las condiciones de ejecución, los valores devueltos y la propagación/traducción de errores según contrato.
- Verificar que el caso de uso invoque el comportamiento del dominio y los contratos esperados, sin incorporar reglas de negocio duplicadas en el test.
- Simular los puertos, no detalles internos de MikroORM que la capa de aplicación no debería conocer.
- **No crear tests unitarios de use cases que solo delegan sin decisiones ni comportamiento propio**, a menos que se identifique un riesgo concreto y se lo documente.

### 3.4 Persistencia / infraestructura — integración selectiva

**Nivel:** integración contra **PostgreSQL 18 real** usando **MikroORM** y **Testcontainers**.

Priorizar:

- Consultas con filtros dinámicos, ordenamientos con lógica, paginación o combinaciones de condiciones.
- Consultas con relaciones, agregaciones, proyecciones o QueryBuilder cuyo resultado no sea trivial.
- Restricciones de integridad, transacciones, reactivación/soft delete y consultas que deben excluir dados de baja, **cuando esas reglas dependan del comportamiento real de persistencia**.
- Mapeos o relaciones cuya corrección tenga impacto funcional.

**No testear CRUD simples por rutina.** No duplicar una prueba de persistencia si la misma interacción ya está verificada suficientemente mediante una integración de endpoint. Las pruebas de migraciones se incorporan cuando se crean o modifican migraciones relevantes, con un entorno aislado y la estrategia real del repositorio.

## 4. Aislamiento y preparación del entorno

### Unitarias

- No necesitan Docker, red ni base de datos.
- Crear únicamente los datos necesarios para el escenario; preferir factories/fixtures pequeñas, explícitas y reutilizables.
- Usar `vi.fn`, `vi.spyOn` y demás utilidades de Vitest **solo** para dependencias cuyo aislamiento sea legítimo.
- Restablecer mocks y estados entre tests; no depender del orden de ejecución.
- Controlar el tiempo para comportamientos sensibles a `hoy`, vencimientos y períodos; evitar depender de la fecha real del sistema.

### Integración

- Levantar PostgreSQL temporal mediante Testcontainers para los tests que necesitan una base real, sin apuntar a desarrollo, producción ni una base compartida. La versión mayor es **18**, la misma que producción: la imagen se declara una sola vez en el setup compartido de integración con el tag mayor (`postgres:18-alpine`), y cada suite lo consume desde ahí en lugar de repetir el literal.
- Conectar MikroORM a la instancia temporal y preparar el esquema por el mecanismo compatible con el repositorio (migraciones si se valida su aplicación; otra preparación aislada solo cuando esté justificada).
- Preparar datos por caso y restaurar el aislamiento mediante limpieza, transacciones reversibles u otra estrategia correcta para el módulo. No permitir dependencia entre casos.
- Liberar conexiones, aplicaciones NestJS, recursos del ORM y contenedores al finalizar, incluso ante errores.
- Evitar puertos fijos, credenciales productivas y dependencias externas no controladas.
- **No marcar una prueba como aprobada si Docker o PostgreSQL están inaccesibles.** Reportar bloqueo de infraestructura; no reemplazar silenciosamente el test por un mock, `skip` ni una aserción vacía.
- Evitar paralelismo entre suites que compartan estado, salvo que el aislamiento esté probado.

## 5. Cobertura esperada

Los porcentajes del plan son **metas por módulo, no techos ni una razón para escribir tests sin valor**:

| Módulo | Cobertura esperada |
|---|---:|
| Entrenamientos | 70 % |
| Planes | 70 % |
| Seguimiento | 65 % |
| Auth | 60 % |
| Alumnos | 55 % |
| Profesores | 55 % |
| Catálogo | 55 % |

En **dominio de Entrenamientos y Planes** se espera superar el **80 %**. Los valores se refieren a la cobertura automatizada del backend y se contrastan con el resultado obtenido al reportar el proyecto.

- Priorizar las ramas significativas y los casos límite sobre la cobertura lineal artificial.
- No agregar tests triviales solo para aumentar porcentajes.
- No inventar umbrales obligatorios en CI si el repositorio no los establece.
- Si una variante de bajo riesgo queda sin cubrir por costo/tiempo, anotarla como pendiente junto con su justificación.

## 6. Casos de prueba y trazabilidad

El plan establece el uso de **Gherkin** para registrar casos vinculados con criterios de aceptación. Para cada cambio:

1. Identificar reglas de negocio y criterios de aceptación aplicables.
2. Verificar si ya existe un caso de prueba documentado y reutilizar su identificador exacto.
3. Si falta un caso, proponerlo/registrarlo siguiendo la organización del proyecto, sin inventar IDs oficiales.
4. Relacionar el nombre del test con el comportamiento y, cuando exista, con el identificador documentado.
5. Cubrir con los casos pertinentes todos los criterios de aceptación de la funcionalidad. Un caso puede cubrir más de uno si se justifica.

**Ejemplo ilustrativo de Gherkin (no es un identificador oficial):**

```gherkin
Escenario: Rechazar un segundo entrenamiento en curso
  Dado un alumno con un plan vigente
  Y un entrenamiento en curso
  Cuando intenta iniciar otro entrenamiento
  Entonces el sistema rechaza la operación
  Y conserva el entrenamiento existente
```

**Ejemplo ilustrativo de nombre en Vitest:**

```ts
it('rechaza iniciar otro entrenamiento cuando ya existe uno en curso', () => {
  // Arrange → Act → Assert
});
```

Las descripciones deben expresar **comportamiento y resultado esperado**, no detalles circunstanciales de implementación.

## 7. Organización y calidad del código de tests

- Seguir la estructura modular real del backend, con sus capas de presentación, aplicación, dominio e infraestructura.
- Ubicar unitarias preferentemente junto al archivo probado (`*.spec.ts` u otra convención existente). Agrupar integraciones por módulo/funcionalidad siguiendo la convención del repositorio; `*.integration.spec.ts` es solo una **opción**, no una imposición.
- Estructurar cada test en **Arrange → Act → Assert**, con datos mínimos y aserciones específicas.
- Evitar fixtures gigantes, `sleep` arbitrarios, mocks globales persistentes y dependencias entre casos.
- No probar métodos privados ni detalles accidentales del código cuando exista una interfaz pública observable.
- No introducir `any`, casts para omitir reglas o cambios a producción para facilitar tests, salvo justificación técnica explícita.
- Para fallos, comprobar **qué error o efecto se produce** y, cuando importe, que no quede persistido un estado parcial.
- Mantener legibilidad: una prueba puede tener varias aserciones cuando describan un mismo escenario, pero no debería abarcar comportamientos independientes.
- Las pruebas deben respetar los DTO de presentación, Inputs de aplicación, entidades de dominio y contratos de repositorio existentes; no confundirlos entre capas.

## 8. Procedimiento obligatorio para agentes

### Antes de codificar

1. Leer la historia/regla afectada, los criterios de aceptación y el código de producción.
2. Revisar las pruebas existentes para evitar duplicados y detectar regresiones.
3. Elegir la capa de test y documentar brevemente la razón si no es evidente.
4. Revisar `package.json`, configuración de Vitest y disponibilidad de Docker antes de ejecutar integraciones.

### Durante la implementación

1. Escribir primero escenarios de negocio relevantes, incluidos rechazos y límites.
2. Asegurar independencia entre tests y coherencia con la arquitectura.
3. Usar infraestructura real **solo** donde aporte verificación significativa.
4. Mantener los tests sincronizados con cambios de contrato, sin debilitar aserciones para que pasen.

### Al terminar

1. Ejecutar los tests modificados y después la suite relacionada, usando los **scripts reales** del proyecto.
2. Ejecutar comprobaciones de tipado, lint/build o cobertura cuando estén definidas y resulten aplicables.
3. Si corresponde, verificar que las integraciones efectivamente corrieron con PostgreSQL real.
4. Revisar flakiness, recursos abiertos y regresiones introducidas.
5. Informar: tests creados/modificados; reglas/criterios cubiertos; comandos ejecutados; resultado real; cobertura si se midió; tests pendientes/bloqueos.

**Prohibiciones de reporte:** no afirmar que tests, Docker, migraciones, cobertura o CI pasaron si no se ejecutaron y verificaron. No omitir fallos ni convertirlos en `skip` sin justificación y aprobación explícitas.

## 9. Checklist de aceptación de una tarea de testing

- [ ] Las pruebas responden a comportamientos, reglas o criterios de aceptación identificables.
- [ ] Se eligió correctamente el nivel de prueba y no se duplicó cobertura innecesaria.
- [ ] El dominio relevante incluye escenarios válidos, inválidos y límites.
- [ ] Los endpoints afectados tienen camino exitoso y fallido representativos.
- [ ] Los use cases con orquestación propia están verificados sin acoplarse al ORM.
- [ ] Las consultas complejas o transacciones relevantes se prueban contra PostgreSQL real.
- [ ] Las pruebas son independientes, deterministas y limpian recursos.
- [ ] Se utilizó Vitest, respetando TypeScript/ESM y las convenciones del repositorio.
- [ ] Los casos trazan a reglas de negocio y/o criterios de aceptación; Gherkin cuando corresponde.
- [ ] Se ejecutaron los checks disponibles y se reportaron fielmente resultados y pendientes.

## 10. Fuentes, precedencia y alcance

Este agreement operacionaliza las decisiones contenidas en las pestañas **«Plan de Pruebas y Casos de Prueba»** (secciones 1–6), **«Definición de Arquitectura»**, **«Convención de Buenas Prácticas»** y las **reglas de negocio** del documento *Proyecto 3 Desarrollo de un MVP de entrenamiento físico*.

**Precedencia:** ante menciones heredadas a **Jest/MySQL** en otras secciones del documento, para el testing de este backend se aplica la definición específica del plan de pruebas: **Vitest + Testcontainers + PostgreSQL + MikroORM**. Si la configuración efectiva del repositorio contradice este acuerdo, **no modificarla en silencio**: informar la discrepancia y proponer el ajuste mínimo.

Este documento fija criterios para los agentes; no reemplaza las historias de usuario, los casos Gherkin oficiales, la arquitectura vigente ni la configuración ejecutable del repositorio. Los ejemplos incluidos son ilustrativos y no certifican que un test haya sido implementado.
