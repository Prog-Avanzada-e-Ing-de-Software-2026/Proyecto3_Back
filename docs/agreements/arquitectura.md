# Guía de arquitectura para Codex — Proyecto3_Back

> **Propósito:** documento de integración para que Codex incorpore las convenciones arquitectónicas del Proyecto 3 al `AGENTS.md` **existente**. No es un reemplazo completo del archivo ni una orden de implementar funcionalidades.
>
> **Estado:** propuesta técnica **ratificada e integrada en `AGENTS.md`** (26/10/2026). `AGENTS.md` es la fuente operativa; este documento es su fundamento y queda subordinado a él ante cualquier discrepancia. Derivada de la definición arquitectónica del documento *Proyecto 3: Desarrollo de un MVP de entrenamiento físico* y contrastada con el repositorio `Prog-Avanzada-e-Ing-de-Software-2026/Proyecto3_Back` (rama `main` remota, revisada el 25/10/2026; el checkout local puede figurar como `master`).
>
> **Importante:** no editar, hacer commit, push ni abrir PR por el solo hecho de leer este documento. Al integrar la guía, preservar las convenciones de seguridad, OpenSpec, auditoría, testing, migraciones, ramas y autorización humana que ya están vigentes.

## 0. Instrucciones de integración en AGENTS.md

> **Estado de esta sección:** cumplida el 26/10/2026. La convención quedó ratificada en `AGENTS.md` §4 y §5. Esta sección se conserva como registro del procedimiento; para operar, leer `AGENTS.md`.

Codex debe:

1. Leer el `AGENTS.md` actual, `package.json`, `src/mikro-orm.config.ts`, `openspec/config.yaml` y los documentos de `docs/preliminar/` antes de cambiar convenciones.
2. **Modificar la sección 4 («Convenciones de código»)** del `AGENTS.md` porque la estructura anterior `src/<capacidad>/...`, que ubicaba controllers y DTO en `infrastructure/`, no representaba las cuatro capas del documento arquitectónico. **Aprobado:** se adoptó `src/modules/<capacidad>/{presentation,application,domain,infrastructure}`, y en el catálogo `src/modules/catalogo/<concepto>/…`.
3. Añadir al `AGENTS.md` una sección específica «Arquitectura y límites de módulos», tomando como base las secciones 1 a 10 de este documento, **sin duplicar** los apartados existentes sobre auditoría, OpenSpec, Git, testing y seguridad. En las secciones repetidas, usar referencias cruzadas. **Cumplido:** es la sección 5 de `AGENTS.md`.
4. Mantener intactas las reglas operativas existentes salvo que el equipo apruebe explícitamente una modificación; cuando dos fuentes discrepen, **registrar el conflicto y no resolverlo por suposición**.
5. Tratar los árboles de carpetas, nombres de archivos y fragmentos de código de esta guía como **convenciones recomendadas**, no como evidencia de que esas implementaciones ya existen.
6. Entregar al usuario un diff acotado con: secciones añadidas/cambiadas, decisiones pendientes, impacto en futuros módulos y verificaciones realizadas. No crear carpetas vacías ni componentes ficticios para satisfacer un diagrama.

---

## 1. Identidad arquitectónica del proyecto

### Decisiones respaldadas por el documento del proyecto

- **Estilo:** monolito modular; una aplicación backend y un despliegue, con módulos NestJS cohesionados por funcionalidad.
- **Partición:** por responsabilidades del negocio (*feature-first / domain-first*), no por una carpeta global de `controllers`, otra de `services` y otra de `repositories`.
- **Capas conceptuales internas:** presentación, aplicación, dominio e infraestructura.
- **Modelado:** DDD pragmático: lenguaje ubicuo, raíces de agregado, entidades, value objects, invariantes y servicios de dominio cuando aportan valor.
- **Puertos/adaptadores e inversión de dependencias:** selectivos. Una abstracción debe justificarse por desacoplamiento, testabilidad, varios consumidores o una regla de negocio compleja; no por una plantilla obligatoria.
- **CQRS:** el documento distingue explícitamente comandos y modelos de lectura, pero **no exige** `@nestjs/cqrs`, buses, handlers ni bases separadas. Pueden existir servicios de consultas sin CQRS formal.
- **Bounded Context:** el MVP identifica **uno solo, «Entrenamiento»**. Separar código en módulos NestJS **no crea** bounded contexts adicionales.
- **Persistencia:** MikroORM sobre PostgreSQL, según la configuración real del repositorio.

### Regla de diseño

**Priorizar simplicidad y cohesión.** Aplicar el patrón más sencillo que proteja las reglas y permita probarlas. Está prohibido convertir cada operación CRUD en una cadena de interfaces, repositorios delegadores, adaptadores, comandos y handlers sin necesidad concreta.

**No proponer microservicios, Event Bus, CQRS integral, Event Sourcing o arquitectura hexagonal estricta como punto de partida** sin requisitos documentados que lo justifiquen.

---

## 2. Estructura objetivo del backend (propuesta para aprobar)

La estructura sigue la **capacidad de negocio** y después la **capa**, no al revés:

```text
src/
├── main.ts
├── app.module.ts
├── mikro-orm.config.ts
├── migrations/
├── common/                              # Solo preocupaciones transversales reales
│   ├── domain/                          # Ej.: base auditable, errores comunes
│   ├── presentation/                    # Ej.: filtro HTTP global, decorador actor
│   └── infrastructure/                  # Ej.: auditoría persistente
└── modules/
    ├── auth/                            # Seguridad/autenticación, según alcance aprobado
    │   └── auth.module.ts
    ├── alumnos/
    │   └── alumnos.module.ts
    ├── profesores/
    │   └── profesores.module.ts
    ├── catalogo/                        # Módulo agrupador del catálogo
    │   ├── catalogo.module.ts
    │   ├── ejercicios/                  # Submódulo independiente
    │   │   └── ejercicios.module.ts
    │   ├── categorias-ejercicio/
    │   │   └── categorias-ejercicio.module.ts
    │   ├── materiales/
    │   │   └── materiales.module.ts
    │   ├── unidades/
    │   │   └── unidades.module.ts
    │   └── objetivos-plan/
    │       └── objetivos-plan.module.ts
    ├── planes/
    │   └── planes.module.ts
    ├── entrenamientos/
    │   └── entrenamientos.module.ts
    └── seguimiento/                     # Opción: consultas, no nuevo bounded context
        └── seguimiento.module.ts
```

Cada módulo podrá tener, **según lo que necesite**, estas subcarpetas:

```text
src/modules/<capacidad>/
├── <capacidad>.module.ts                 # Wiring / composición de dependencias
├── presentation/
│   ├── <capacidad>.controller.ts
│   └── dto/
│       ├── create-*.dto.ts
│       ├── update-*.dto.ts
│       └── *-response.dto.ts            # Solo si es necesario
├── application/
│   ├── <capacidad>.service.ts           # Orquestación simple (si aporta valor)
│   ├── use-cases/                       # Solo operaciones complejas
│   │   └── <accion>.use-case.ts
│   └── queries/                         # Consultas complejas o modelos de lectura
│       └── <capacidad>-query.service.ts
├── domain/
│   ├── entities/                        # Aggregate roots y entidades hijas
│   ├── value-objects/                   # Value objects genuinos
│   ├── services/                        # Reglas de dominio que no caben en una entidad
│   ├── policies/                        # Opcionales; reglas claramente identificadas
│   ├── errors/                          # Errores semánticos de dominio
│   └── ports/                           # Solo contratos necesarios
└── infrastructure/
    ├── repositories/                    # Implementaciones/adaptadores concretos
    └── external/                        # Integraciones técnicas, si existen
```

**No crear estas subcarpetas preventivamente.** Un módulo simple puede comenzar con su controlador, DTO, servicio, entidad y módulo NestJS; evolucionará según la complejidad real. **Excepción organizativa expresamente definida: dentro de `catalogo/` cada concepto catalogable tiene su propia subcarpeta y su propio controller, service, DTO, entidad y módulo NestJS**, aunque se trate de CRUD simple. No reunir todos los controllers, services o DTO del catálogo en archivos únicos compartidos.

### Organización obligatoria de `catalogo/`

`CatalogoModule` es un **módulo agrupador** que reúne los submódulos del catálogo. `Ejercicio`, `CategoriaEjercicio`, `Material`, `Unidad` y `ObjetivoPlan` se implementarán como **capacidades independientes dentro de `catalogo/`**, cada una con su propia organización en capas. Esta división técnica no implica nuevos bounded contexts, microservicios ni exigencia de Ports and Adapters estricta.

**Fundamento de esta excepción (evidencia, no preferencia):** `docs/preliminar/Analisis de dominio.md:94` establece que las entidades de catálogo son *«entidades de catálogo, cada una de las cuales es raíz de su propio agregado»*. Son cinco raíces de agregado distintas, no entidades hijas de un mismo agregado. A eso se suman cinco user stories independientes (`US-01`..`US-05` en `docs/preliminar/User Stories.md`) y `AD-04` en `docs/preliminar/Arquitectura de pantallas.md:71`, que describe explícitamente «Gestionar el catálogo maestro (5 CRUDs)». La excepción no contradice la regla anti-ceremonia de §1: cada submódulo corresponde a **un agregado y a una unidad especificable por separado** en un cambio de OpenSpec. Lo que sigue prohibido es partir un agregado en varios módulos o crear un `CatalogoService` único con los cinco CRUD.

```text
src/modules/catalogo/
├── catalogo.module.ts                       # Agrupa/importa los cinco submódulos
├── ejercicios/
│   ├── ejercicios.module.ts
│   ├── presentation/
│   │   ├── ejercicios.controller.ts
│   │   └── dto/                              # DTO propios de ejercicios
│   ├── application/
│   │   └── ejercicios.service.ts
│   └── domain/
│       └── entities/
│           └── ejercicio.entity.ts
├── categorias-ejercicio/
│   ├── categorias-ejercicio.module.ts
│   ├── presentation/
│   │   ├── categorias-ejercicio.controller.ts
│   │   └── dto/
│   ├── application/
│   │   └── categorias-ejercicio.service.ts
│   └── domain/
│       └── entities/
│           └── categoria-ejercicio.entity.ts
├── materiales/
│   ├── materiales.module.ts
│   ├── presentation/
│   │   ├── materiales.controller.ts
│   │   └── dto/
│   ├── application/
│   │   └── materiales.service.ts
│   └── domain/
│       └── entities/
│           └── material.entity.ts
├── unidades/
│   ├── unidades.module.ts
│   ├── presentation/
│   │   ├── unidades.controller.ts
│   │   └── dto/
│   ├── application/
│   │   └── unidades.service.ts
│   └── domain/
│       └── entities/
│           └── unidad.entity.ts
└── objetivos-plan/
    ├── objetivos-plan.module.ts
    ├── presentation/
    │   ├── objetivos-plan.controller.ts
    │   └── dto/
    ├── application/
    │   └── objetivos-plan.service.ts
    └── domain/
        └── entities/
            └── objetivo-plan.entity.ts
```

- Cada submódulo **encapsula sus propios endpoints, DTO, lógica de aplicación y modelo**, con sus providers y `MikroOrmModule.forFeature(...)` registrados en su `*.module.ts` según corresponda.
- `catalogo.module.ts` **agrupa/importa** esos módulos; no concentra controladores, servicios de CRUD ni repositorios de todas las entidades. Debe exportar solo lo necesario para los consumidores de otros módulos.
- Dentro de cada submódulo, un CRUD sencillo sigue `Controller → Service → EntityRepository de MikroORM`. La carpeta `infrastructure/`, los puertos, los adaptadores o los use cases **solo se agregan si hay motivos concretos**, sin modificar la separación básica de subcarpetas solicitada.
- Crear cada subcarpeta y sus archivos cuando se implemente esa capacidad mediante el flujo OpenSpec aprobado; este esquema no autoriza a generar archivos vacíos de forma anticipada.

### Mapa de módulos vinculado al dominio documentado

| Módulo NestJS propuesto | Conceptos de dominio | Observaciones |
| --- | --- | --- |
| `planes` | `Plan` (aggregate root), `DiaDelPlan`, `EjercicioPlanificado`, `PrescripcionSemanal` | Principal candidato a use cases y puertos de persistencia. |
| `entrenamientos` | `Entrenamiento` (aggregate root), `EjercicioRealizado`, `Serie`, `Cantidad` | Preservar inmutabilidad al finalizar, no duplicados y ejecución por alumno. |
| `catalogo` | `Ejercicio`, `CategoriaEjercicio`, `Material`, `Unidad`, `ObjetivoPlan` | Módulo agrupador: **cinco submódulos con carpeta, controller, service, DTO y entidad propios**. CRUD y consultas usualmente sencillas; no exigir ports por entidad. |
| `alumnos` | `Alumno` | Alta/baja/reactivación; profesor asignado; historial conservado. |
| `profesores` | `Profesor` | Baja y desvinculación de alumnos: coordinación transaccional entre módulos. |
| `seguimiento` | Historial, asistencias, última carga, récord y evolución | Es una **organización técnica de lecturas**; alternativa: alojar las consultas en `entrenamientos` y `planes` hasta que crezcan. |
| `auth` | Identidad, roles y actor autenticado | Detalles funcionales pendientes de diseño; mantener aislado de reglas del entrenamiento. |

**No crear módulos independientes por cada entidad hija o Value Object de un mismo agregado**. **Para el catálogo sí corresponde un submódulo NestJS por cada concepto catalogable** (`ejercicios`, `categorias-ejercicio`, `materiales`, `unidades`, `objetivos-plan`), todos reunidos bajo `catalogo/`, porque `Analisis de dominio.md:94` define cada uno como raíz de su propio agregado y `US-01`..`US-05` los especifican por separado. Tampoco importar internamente archivos de otros módulos de forma indiscriminada; integrar a través de servicios exportados o contratos bien delimitados.

---

## 3. Responsabilidades y dependencias por capa

### `presentation/`

**Incluye:** controllers HTTP, DTO de request/response, validación/sanitización de entrada con `class-validator` y `class-transformer`, pipes y guards propios de la entrada HTTP.

**Puede:** validar formato, tipos, campos obligatorios, transformar DTO en parámetros de aplicación, obtener usuario autenticado, delegar a service/use case y devolver una respuesta.

**No puede:** decidir reglas de negocio, ejecutar consultas ORM, diseñar transacciones ni modificar directamente agregados persistentes.

> DTO es contrato del transporte, **no** entidad de dominio. Un DTO válido no implica que la operación esté permitida por las reglas del gimnasio.

### `application/`

**Incluye:** `*Service` para operaciones sencillas, `*UseCase` para flujos complejos y `*QueryService` para lectura agregada.

**Puede:** orquestar módulos, comprobar permisos de una operación, recuperar agregados, invocar métodos del dominio, coordinar transacciones, trabajar con contratos de persistencia y construir resultados.

**No puede:** ocultar invariantes que deberían vivir dentro de los agregados, ni duplicar reglas en diversos controladores/servicios.

- Evitar servicios enormes con muchas responsabilidades.
- Preferir `CrearPlanUseCase` si hay validación entre entidades, comprobación de permisos, comprobación de solapamiento de fechas y persistencia transaccional.
- Mantener `EjerciciosService` para una búsqueda/CRUD simple.
- No imponer `execute()` individual por cada `GET`, `POST`, `PUT` o `DELETE`.

### `domain/`

**Incluye:** entidades, raíces de agregado, VO inmutables, invariantes y reglas, servicios y políticas del dominio, puertos cuando procedan.

**Puede:** expresar reglas sobre estados y cambios, impedir operaciones inválidas, calcular resultados de negocio desde los datos necesarios.

**No debe:** importar controllers, DTO HTTP, `Request`, `Response`, `HttpException`, `EntityManager` o herramientas de infraestructura **en sus reglas puras**. Las entidades persistidas podrán llevar decoradores MikroORM como **concesión pragmática** aprobada; no presentar eso como independencia absoluta del ORM.

- Toda modificación de un agregado debe pasar por su raíz cuando afecte invariantes internas.
- Un servicio de dominio solo se justifica si la regla genuinamente no pertenece a una entidad o abarca varios conceptos.
- Las validaciones que requieren DB se coordinan desde aplicación con repositorios/puertos; el resultado preserva la regla de negocio.

### `infrastructure/`

**Incluye:** implementaciones con MikroORM, consultas optimizadas, adapters de servicios externos si se aprueban, utilidades técnicas específicas de persistencia.

**Puede:** materializar y guardar entidades, ejecutar SQL parametrizado, traducir excepciones de persistencia, implementar contratos de aplicación/dominio.

**No puede:** decidir reglas de negocio por su cuenta ni esconder efectos de dominio en consultas o subscribers del ORM.

### Dirección de dependencias

```text
Frontend
  -> HTTP Controller [presentation]
       -> Service / UseCase / QueryService [application]
            -> Entidades / reglas [domain]
            -> Puerto de persistencia [domain o application, opcional]
                  <- implementado por [infrastructure]
                         -> MikroORM -> PostgreSQL
```

Es un **esquema conceptual**, no una obligación de incluir puertos en todos los flujos. En CRUD simple se admite `application -> EntityRepository (MikroORM)` de forma deliberada y documentada, mientras las reglas del dominio se mantienen protegidas.

NestJS `*.module.ts` es la **composition root** local: registra controladores y proveedores, vincula contratos con implementaciones e importa/exporta las dependencias necesarias. Evitar `forwardRef()` recurrente: suele indicar límites poco claros.

---

## 4. Selección de patrones: matriz obligatoria de decisión

| Complejidad de la funcionalidad | Implementación predeterminada | Escalar a… si |
| --- | --- | --- |
| Listar/consultar catálogo | Controller + Service + MikroORM | filtros complejos o varias vistas requieren QueryService |
| Alta/modificación simple | Controller + Service + entidad | invariantes no triviales o coordinación entre agregados |
| Crear plan completo | Controller + `CrearPlanUseCase` + `Plan` + persistencia | usar puerto si mejora testabilidad/aislamiento |
| Iniciar/agregar/finalizar entrenamiento | Use case + métodos de `Entrenamiento` | operación transaccional/concurrencia requiere adaptador/índice |
| Bajar profesor y desvincular alumnos | Use case coordinador + transacción | no hacer evento asíncrono en el MVP sin aprobación |
| Historial, récord, evolución, asistencias | `QueryService` + proyección de lectura | nunca hidratar agregados gigantes solo para reportes |
| Servicio externo real | Puerto + adapter | solo si la integración es parte del alcance aprobado |

**Evitar:** `Controller -> Service -> Repository -> PersistenceAdapter -> ORM` cuando Repository únicamente reenvía métodos al adapter; no crear dos capas de delegación sin responsabilidades distintas.

**CQRS ligero:** distinguir semánticamente comandos y consultas es válido; **no** añadir `@nestjs/cqrs`, `CommandBus`, `QueryBus`, `CommandHandler` o modelos de lectura persistidos por defecto.

**Eventos:** el análisis reconoce hechos de dominio como alumno dado de baja/reactivado/reasignado y profesor dado de baja. Son conceptos del negocio; **no** obliga a event bus o mensajes asíncronos. La baja de profesor con desasignación se decidió como llamada directa y transaccional. No convertir los eventos en infraestructura sin un cambio aprobado.

---

## 5. Reglas esenciales de modelado: Plan y Entrenamiento

### 5.1 `Plan` (aggregate root)

- Está dirigido a un alumno y lo prepara un profesor.
- Incluye movilidad y core comunes a todos los días, y fuerza correspondiente a cada `DiaDelPlan`.
- Deben respetarse ejercicios obligatorios en los bloques definidos y límites de días del plan.
- `EjercicioPlanificado` y `PrescripcionSemanal` están conceptualizados como VO; `DiaDelPlan` como entidad dependiente del agregado.
- Los planes de un mismo alumno **no pueden solapar fechas**, pero se admiten planes futuros.
- Al alumno de baja no se le pueden crear planes.
- Crear un plan puede implicar coordinación entre `Profesor`, `Alumno`, catálogo y `Plan`; ubicar esa coordinación en aplicación, no en el controller.
- La validación previa de solapamiento **por sí sola no evita carreras concurrentes**. Evaluar en el diseño de persistencia transacción, bloqueo y/o restricción adecuada de PostgreSQL; demostrar el comportamiento con pruebas.
- **Duración del plan: 4 semanas (RN-10), requisito vigente y no un conflicto abierto.** La documentación del repositorio es consistente en cuatro lugares: `docs/preliminar/Reglas de negocio.md:10` (RN-10), `docs/preliminar/Analisis de dominio.md:119`, `docs/preliminar/User Stories.md:306-309` —US-12 tiene un escenario de aceptación dedicado, «Duración fija de 4 semanas»— y `docs/preliminar/Arquitectura de pantallas.md:107`. No hay ambigüedad interna que investigar: **4 semanas es la especificación de registro**. El documento integral del Proyecto 3 menciona un rango de 4 a 12 semanas; si el equipo adopta ese rango, es un **cambio de requisito** que modifica RN-10 y el escenario de US-12 mediante un cambio de OpenSpec, y solo entonces se ajusta la constante. Hasta que ese cambio exista y esté aprobado, se implementa 4 semanas y no se codifica el rango.

### 5.2 `Entrenamiento` (aggregate root)

- Pertenece a un alumno, puede utilizar el plan/día activo como guía y puede registrar ejercicios adicionales del catálogo sin estar obligatoriamente limitado a los planificados.
- **No interpretar eso como autorización para crear «entrenamientos libres sin plan»**: el alcance del documento de gestión excluye explícitamente el entrenamiento libre. Si un escenario requiere entrenar sin plan, registrar el conflicto antes de implementarlo.
- Un alumno solo puede tener **un entrenamiento en curso**.
- Un ejercicio no se repite dentro del mismo entrenamiento.
- `EjercicioRealizado` conserva identidad dentro de `Entrenamiento`; `Serie` y `Cantidad` son VO según el modelo preliminar.
- Una serie exige cantidad `>= 1` y peso `>= 0` o ausente, conforme a la regla documentada.
- Un entrenamiento finalizado **no puede editarse**.
- No basta validar la unicidad de entrenamientos en curso en memoria: diseñar integridad de persistencia ante solicitudes concurrentes (por ejemplo, restricción/indexación apropiada) si corresponde.

### 5.3 Alumnos y profesores

- La baja de un alumno conserva su historial y bloquea nuevas sesiones; la reactivación conserva continuidad.
- La baja de profesor bloquea su acceso y deja alumnos sin profesor. La coordinación de ambas escrituras debe ser **atómica**.
- `Alumno` y `Profesor` son raíces de agregados propios.
- El acceso a planes, entrenamientos y seguimiento debe respetar el actor autenticado y las reglas de visibilidad de la especificación vigente; **jamás** suponer que conocer un `alumnoId` autoriza consultar sus datos.

### 5.4 Catálogo y referencias entre agregados

- Cada concepto de catálogo tiene su propio **submódulo funcional dentro de `catalogo/`**, con controller, service, DTO y entidad propios; no crear un único `CatalogoController` o `CatalogoService` con todas las operaciones CRUD.
- `Ejercicio` es una definición catalogada, distinta de `EjercicioPlanificado` y `EjercicioRealizado`.
- `Unidad`, `CategoriaEjercicio`, `Material` y `ObjetivoPlan` son conceptos compartidos de catálogo con identidad propia.
- Referencias entre agregados podrán exponerse como id y referencia navegable de forma consistente con MikroORM; **no modificar el agregado ajeno** mediante la referencia obtenida desde otro agregado.
- Evitar que un agregado se cargue recursivamente entero para un formulario o informe; usar lecturas proyectadas.

### 5.5 Value Objects y almacenamiento

- La clasificación DDD (VO versus entidad) **no prescribe automáticamente** una tabla distinta o el mismo tipo de mapeo ORM. Decidir cómo persistir `Serie`, `Cantidad`, `EjercicioPlanificado` y `PrescripcionSemanal` al diseñar cada agregado.
- VO por valor, preferentemente inmutables, con validaciones del dominio; no darles repositorios propios por rutina.
- No inventar `ValueObject` genéricos, clases base innecesarias o una librería DDD antes de necesitarla.

---

## 6. Modelos de lectura sin CQRS formal

El documento distingue comandos de consultas. Para lecturas cruzando entidades o agregados, se recomienda `application/queries/*-query.service.ts`, que puede utilizar proyecciones desde MikroORM o un repositorio especializado de lectura:

- `PlanDeAlumnoQueryService`: plan vigente y prescripción relevante para consulta.
- `SeguimientoPlanesQueryService`: alumnos sin plan o con plan próximo a finalizar.
- `HistorialEntrenamientosQueryService`: entrenamientos por alumno y última carga utilizada.
- `AsistenciasQueryService`: fechas y conteos por semana/mes en rango dado.
- `EvolucionQueryService`: mejor serie y evolución por ejercicio.

Nombres y agrupación exacta son **ejemplos** que pueden reorganizarse según los módulos existentes; no crear cinco servicios sin funcionalidades que los usen.

Reglas:

1. Los servicios de consulta **no mutan** estado ni guardan `flush()`.
2. Récord, última carga y estados temporales del plan se **calculan** desde datos existentes, porque así se decidió en el documento; no persistirlos como tablas/materializaciones sin justificación y aprobación.
3. No perder reglas de autorización cuando se use una proyección que omite la carga del aggregate root.
4. Evitar el patrón N+1, consultas sin límites o cargar relaciones innecesarias; seleccionar campos y paginar cuando corresponda.
5. No atribuir las decisiones de presentación del frontend al dominio.

---

## 7. MikroORM, transacciones, integridad y auditoría

### Stack realmente instalado (verificar antes de cambiar)

- NestJS 12, TypeScript 6, ESM (`"type": "module"`, NodeNext).
- Node 24 y Yarn 4; Vitest 4, oxlint y Prettier.
- MikroORM 7, PostgreSQL y migraciones de `@mikro-orm/migrations`.
- `ReflectMetadataProvider` y decoradores legacy configurados; imports relativos con sufijo `.js`.
- `entities: ['./dist/**/*.entity.js']`, `entitiesTs: ['./src/**/*.entity.ts']` en `src/mikro-orm.config.ts`.
- Validación de entrada: `class-validator` 0.15, `class-transformer` 0.5 y `@nestjs/mapped-types` 12 (alineado con NestJS 12), **ya instalados** como dependencias de runtime. Sin ellos `ValidationPipe` no funciona: no hay alternativa pendiente de decidir.

### Convenciones para agentes

- Usar `EntityManager` contextual y Unit of Work propio de MikroORM. **No replicar** el `TypeOrmUnitOfWork` ni el decorador `@Transactional()` ad hoc del Proyecto 1.
- Ubicar los límites transaccionales en el servicio/caso de uso que coordina los cambios, usando `em.transactional(...)` cuando sea necesario. Mantener todas las escrituras relacionadas en el **mismo** contexto transaccional.
- Para un CRUD sencillo, usar `@InjectRepository(Entity)` y el repositorio de MikroORM cuando eso resulte suficiente.
- Crear interfaces/puertos y adaptadores propios **solo** cuando hay un beneficio comprobable; enlazarlos mediante tokens de inyección en `*.module.ts`.
- No lanzar `flush()` incidentalmente desde reglas puras del dominio; persistir en el ámbito definido por aplicación.
- Cambiar esquema por migraciones, no por `schema:create`/`schema:update` en producción ni sincronización automática destructiva.
- Diseñar restricciones en PostgreSQL para invariantes que necesitan garantías concurrentes; una lectura previa `exists(...)` por sí sola no basta.

### Auditoría transversal (NO duplicar en AGENTS.md)

Preservar íntegra la sección vigente de `AGENTS.md` sobre `createdAt`, `createdById`, `updatedAt`, `updatedById`, `deletedAt`, `deletedById`; actor autenticado y procedencia; UTC, soft-delete, reactivación explícita y restricciones únicas parciales. El mecanismo exacto de auditoría todavía debe decidirse mediante cambio de OpenSpec; **no asumir que una base abstracta o subscriber ya está implementado**.

---

## 8. Errores, autorización y contrato API

- Errores semánticos de dominio: expresarlos de forma estable en dominio/aplicación cuando hagan falta; traducirlos a respuestas HTTP en el límite de presentación (filtro/mapeador) sin filtrar trazas ni detalles internos.
- DTO: validar contrato de entrada; dominio: validar invariantes. No duplicar la misma regla en controller, DTO, service y repo.
- **Convención de validación (decidida; ver `AGENTS.md` §5.6).** Los DTO son **clases** con decoradores de `class-validator`; los tipos derivados (`PartialType`, `OmitType`, `PickType`, `IntersectionType`) salen de `@nestjs/mapped-types`. Se registra **un solo** `ValidationPipe` global en `src/main.ts`.
- Opciones del pipe: `{ transform: true, whitelist: true }`. `whitelist` descarta toda propiedad no declarada en el DTO y es el mecanismo concreto que impide que el cliente cuele `createdById`, `updatedById` o similares. **No** se activa `forbidNonWhitelisted` mientras `AGENTS.md` §6.2 (regla 3) establezca que esos campos «se ignoran»; si el equipo prefiere rechazar la petición con 400, se activa la opción y se actualiza esa regla en el mismo cambio.
- El DTO nunca se convierte en entidad de dominio ni se entrega a MikroORM. `class-validator` valida formato y tipos; las reglas del gimnasio son invariantes de dominio (§5.1 y §5.2) y no se duplican en el DTO.
- El actor actual proviene del mecanismo de autenticación, **nunca** de un `createdById`, `updatedById` o similar enviado por el frontend.
- Los módulos que exponen información de un alumno deben comprobar identidad, asignación de profesor y autorización conforme a la regla vigente antes de consultar o responder, incluso en endpoints de estadísticas.
- Mantener contractos de request/response estables para integrar React con NestJS. Documentarlos como el equipo acuerde; no asumir que Swagger ya está instalado porque figura en borradores históricos.
- No diseñar integraciones, pagos, reservas, clases o notificaciones fuera del MVP sin especificación aprobada.

---

## 9. Pruebas guiadas por reglas e invariantes

**Prevalece íntegramente la sección vigente de `AGENTS.md` sobre OpenSpec obligatorio, RED/GREEN/REFACTOR, Vitest, nombres de archivos, suites y verificaciones.** Esta sección solo especifica **qué** probar desde el punto de vista arquitectónico:

| Capa / operación | Pruebas prioritarias |
| --- | --- |
| Dominio (`Plan`) | Días permitidos, bloques obligatorios, duplicados y consistencia de progresión. |
| Dominio (`Entrenamiento`) | Series válidas, ejercicio repetido, estado finalizado inmutable. |
| Aplicación (`CrearPlanUseCase`) | Alumno activo, actor autorizado, solapamientos, transacción. |
| Aplicación (baja profesor) | Desasignación atómica de alumnos, errores y rollback. |
| Persistencia | Relaciones entre agregados, migraciones, restricciones de DB, concurrencia y auditoría. |
| Consultas | Filtros de autorización, récords calculados, último peso, evolución y paginación. |
| HTTP | DTO, guards, códigos/contratos de error y correspondencia con criterios de aceptación. |

Pruebas unitarias cerca de los archivos (`*.spec.ts`); integración con PostgreSQL real o Testcontainers cuando haga falta; E2E conforme a scripts y condiciones reales del proyecto. **No afirmar un test verde si fue omitido por falta de Docker/DB**. No hacer mocks del ORM para dar por probada la integridad transaccional.

---

## 10. Protocolo obligatorio para un agente que implemente una funcionalidad

Antes de proponer o tocar código, el agente debe ejecutar mentalmente esta lista de verificación y aplicar el flujo OpenSpec que ya define `AGENTS.md`:

1. **Ubicar la capacidad**: ¿a qué módulo pertenece? ¿Es dato de catálogo, agregado, operación de aplicación o consulta? No crear bounded contexts adicionales.
2. **Verificar vigencia del requisito**: revisar `openspec/specs`, cambios activos, análisis de dominio, reglas e historias y decisiones abiertas. Señalar contradicciones.
3. **Elegir la menor complejidad suficiente**: CRUD con Service; UseCase para operación compleja; QueryService para lecturas compuestas; Policy/DomainService solo para regla verdadera; puerto solo cuando lo justifique.
4. **Definir límites de modificación**: qué raíz de agregado protege cada regla; qué otros agregados se consultan sin mutarlos; quién es responsable de la transacción.
5. **Identificar garantías de persistencia**: concurrencia, índices, FK, nulabilidad, histórico, soft-delete, auditoría y migración.
6. **Respetar arquitectura de carpetas**: transporte en `presentation`; coordinación en `application`; reglas en `domain`; ORM/SQL en `infrastructure` cuando exista ese adaptador.
7. **Escribir primero las pruebas** sobre invariantes, permisos, interacción y efecto observable, siguiendo el gate aprobado de OpenSpec.
8. **Implementar sin efectos colaterales**: no reformatear todo el repo ni mover módulos ajenos a la tarea; no agregar dependencias sin justificación.
9. **Verificar y reportar**: comandos ejecutados, resultado real, tests omitidos, migraciones y cambios de contratos, riesgos y deuda técnica.
10. **Obedecer los controles existentes**: no commitear, pushear, desplegar o archivar OpenSpec sin autorización explícita.

### Antipatrones a evitar

- **Anemic Domain Model** donde la entidad es solo campos y toda regla se duplica en servicios.
- **God Service** con orquestación, queries, HTTP, validación y SQL mezclados.
- Interfaces «I*Repository» sin propósito, seguidas de delegadores vacíos.
- Encadenar servicios entre módulos hasta necesitar `forwardRef()` en múltiples direcciones.
- Reglas de negocio dentro del controller o de los DTO.
- Transacciones definidas en cada repositorio que deberían abarcar un caso de uso completo.
- Persistir récords, últimas cargas o estados temporales que el negocio decidió derivar.
- Exponer directamente entidades ORM con relaciones sensibles o ciclos de serialización.
- Interpretar «modelo de lectura» como obligación de CQRS formal.
- Usar suscriptores ORM como lugar oculto para reglas de negocio.

---

## 11. Ejemplo de estructura **de referencia** para la capacidad `planes`

Estos nombres **no representan archivos existentes**; son una guía para organizar la primera implementación aprobada:

```text
src/modules/planes/
├── planes.module.ts
├── presentation/
│   ├── planes.controller.ts
│   └── dto/
│       ├── create-plan.dto.ts
│       └── plan-response.dto.ts
├── application/
│   ├── use-cases/
│   │   └── crear-plan.use-case.ts
│   └── queries/
│       └── planes-query.service.ts
├── domain/
│   ├── entities/
│   │   ├── plan.entity.ts
│   │   └── dia-del-plan.entity.ts
│   ├── value-objects/
│   │   ├── ejercicio-planificado.vo.ts
│   │   └── prescripcion-semanal.vo.ts
│   └── ports/
│       └── plan.repository.port.ts
└── infrastructure/
    └── repositories/
        └── mikro-orm-plan.repository.ts
```

**Flujo de escritura:** `PlanesController -> CrearPlanUseCase -> Plan (invariantes) + PlanRepositoryPort -> MikroOrmPlanRepository -> PostgreSQL`.

**Flujo de lectura:** `PlanesController -> PlanesQueryService -> consulta proyectada de MikroORM -> DTO de respuesta`.

**Diferencia deliberada:** el flujo de lectura no exige atravesar `Plan` como aggregate root cuando solo se quiere mostrar información. Debe seguir preservando permisos y consistencia.

Para cada CRUD de catálogo se recomienda el flujo `Controller -> Service -> EntityRepository de MikroORM`, **dentro de su subcarpeta específica** (por ejemplo, `catalogo/materiales/` contiene `MaterialesController`, `MaterialesService`, los DTO, `Material` y `MaterialesModule`). No añadir `use-cases/`, `ports/` ni `infrastructure/repositories/` extra salvo que la funcionalidad lo justifique. `CatalogoModule` solamente agrupa los submódulos.

---

## 12. Conflictos y puntos que Codex NO debe resolver automáticamente

**Este apartado sirve para detener suposiciones, no para autorizar cambios de alcance.**

| Tema | Evidencia documental | Comportamiento exigido al agente |
| --- | --- | --- |
| Duración del plan | **Resuelto: RN-10 = 4 semanas**, consistente en `Reglas de negocio.md:10`, `Analisis de dominio.md:119`, el escenario de US-12 y `Arquitectura de pantallas.md:107`. El rango 4-12 del documento integral es divergencia externa al repo, no interna. | Implementar **4 semanas**. Un rango distinto exige un cambio de OpenSpec que modifique RN-10 y el escenario de US-12; no introducirlo por inferencia. |
| Entrenamiento sin plan | Alcance del SPMP excluye entrenamiento libre, pero análisis describe registro flexible respecto de ejercicios planificados | Distinguir «ejercicios adicionales» de «sesión sin plan»; pedir decisión si el escenario cruza ese límite. |
| Estructura de capas | **Resuelto:** `AGENTS.md` §4 y §5 adoptan las cuatro capas y dejan de ubicar controllers y DTO en `infrastructure/`. Sustituye la convención anterior; no es un empate entre fuentes. | Seguir `AGENTS.md`. La convención aplica a código nuevo: el repo todavía no tiene capas implementadas, así que no hay migración masiva que hacer. |
| Stack histórico | Secciones del SPMP contienen referencias heredadas a MySQL/TypeORM/Jest/ESLint y a Gestión de Productos | Para implementación priorizar `package.json`, ORM config y `AGENTS.md` reales: PostgreSQL/MikroORM/Vitest/oxlint. No copiar esos ejemplos antiguos. |
| Nombre de carpetas/módulos | El documento define dominios, no rutas exactas `src/modules/*` | Los árboles de esta guía son recomendación para el equipo; no dar por existente un módulo. |
| Entidades ORM vs dominio puro | El documento pide bajo acoplamiento; el repo configura decoradores legacy MikroORM | Permitir compromiso pragmático explícito; si se exige independencia estricta, proponer mapeo de modelos separados como decisión adicional. |
| Auditoría | `AGENTS.md` ya impone seis campos, pero aún no existe implementación compartida | No inventar subscriber/base que no esté en el repositorio; diseñarlo al introducir la primera entidad. |
| Autenticación/roles | Reglas de acceso documentadas; implementación todavía por especificar | No inventar proveedor de autenticación, sesiones o permisos por analogía con proyectos anteriores. |
| Evento de dominio | Documento conceptualiza hechos y decide una llamada directa para baja de profesor | No agregar RabbitMQ, buses ni publicación asíncrona sin una necesidad aprobada. |
| Propuestas futuras | Arquitectura de lectura y módulos recomendados | No convertir sugerencias o backlog futuro en requisitos obligatorios. |

### Decisiones resueltas al ratificar esta guía (26/10/2026)

Estos puntos ya no son conflictos abiertos ni requieren consulta previa:

1. **Estructura de capas** — cuatro capas adoptadas en `AGENTS.md` §4 y §5; `presentation` deja de vivir en `infrastructure`.
2. **Submódulos de catálogo** — cinco submódulos NestJS, fundados en que cada concepto es raíz de su propio agregado (`Analisis de dominio.md:94`) y en `US-01`..`US-05`.
3. **Duración del plan** — 4 semanas (RN-10), sin rango.
4. **Validación de entrada** — `class-validator`, `class-transformer` y `@nestjs/mapped-types` instalados; DTO como clase y `ValidationPipe` global con `whitelist`.
5. **Rama de trabajo** — el remoto usa `main`; el checkout local puede estar en `master`. Las ramas de trabajo son `change/<nombre>`, creadas desde `origin/main`.

### Jerarquía de fuentes recomendada para implementación

1. Instrucción explícita y alcance aprobado por el usuario/equipo.
2. Cambio OpenSpec activo y aprobado, más especificaciones vigentes.
3. `AGENTS.md`, código y pruebas efectivamente presentes en la rama de trabajo (para reglas operativas y stack).
4. Documentación de dominio y reglas de negocio aceptadas por el equipo, incluidos los cambios más recientes.
5. Documento integral del Proyecto 3 — arquitectura y alcance, teniendo presente que algunas secciones siguen siendo borradores o heredadas.
6. `docs/agreements/arquitectura.md` — fundamento y justificación de las convenciones de `AGENTS.md`. Responde al «por qué»; ante discrepancia, manda `AGENTS.md`.

Cuando dos fuentes autoritativas discrepen, señalar el desacuerdo; no aplicar una regla nueva por inferencia, ni sustituir documentación del proyecto por analogías externas.

---

## 13. Criterios de aceptación para integrar esta guía en `AGENTS.md`

La integración se considera correcta solamente si:

- [ ] La sección de arquitectura especifica **monolito modular + partición por dominio + cuatro capas + DDD pragmático + hexagonal selectiva**.
- [ ] Se explica que hay **un Bounded Context «Entrenamiento»**, pero múltiples módulos NestJS posibles.
- [ ] `catalogo/` se define como módulo agrupador con subcarpetas y módulos NestJS propios para **ejercicios, categorías de ejercicio, materiales, unidades y objetivos de plan**; cada uno tiene controller, service, DTO y entidad propios sin exigir repositorios abstractos ni use cases para CRUD simple.
- [ ] La estructura preferida de código nuevo ya no mezcla HTTP (controllers/DTOs) con persistencia en `infrastructure`.
- [ ] Se admite tanto CRUD con Service como UseCase para operaciones complejas y QueryService para lecturas; no impone CQRS formal.
- [ ] Se describen dependencias correctas y responsabilidades de `*.module.ts`.
- [ ] Se prohíbe introducir puertos, repositorios y capas delegadoras sin necesidad real.
- [ ] Se mantienen las reglas existentes de OpenSpec, auditoría, Vitest, ESM, migraciones, seguridad y Git.
- [ ] No se agrega comportamiento no aprobado ni se resuelven contradicciones de dominio por suposición.
- [ ] El cambio a `AGENTS.md` es un diff reducido y legible, sin reemplazar secciones no afectadas.
- [ ] No se creó, modificó, commiteó o desplegó código de producción por integrar una guía documental.

**Entrega esperada de Codex:** resumen de la adaptación, diff propuesto o aplicado según la autorización, decisiones pendientes y una breve comprobación de coherencia con el repositorio real.
