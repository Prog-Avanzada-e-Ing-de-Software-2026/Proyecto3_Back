# Guía de arquitectura — Proyecto3_Back

> **Propósito:** explicar cómo se organiza el backend y por qué. Sirve a dos audiencias: a los **desarrolladores**, que necesitan el mapa del código y los criterios de decisión, y a los **agentes de IA**, que necesitan el protocolo de trabajo y los límites que no deben cruzar por su cuenta.
>
> **Estado:** convención vigente y de **cumplimiento obligatorio** en las materias que cubre. `AGENTS.md` es la fuente operativa y sus reglas mandan; este documento aporta el fundamento, el mapa completo y el criterio de diseño, y se sigue tal como está establecido. Ante cualquier discrepancia se corrige este documento, no `AGENTS.md`.
>
> **Alcance:** derivado de la definición arquitectónica del documento *Proyecto 3: Desarrollo de un MVP de entrenamiento físico* y contrastado con el repositorio `Prog-Avanzada-e-Ing-de-Software-2026/Proyecto3_Back` (rama `main`, revisada el 25/10/2026). Los árboles de carpetas y los nombres de archivo son **convención**: se contrastan con el código antes de darlos por implementados.
>
> **Regla de lectura:** este documento no autoriza cambios por sí mismo —no reemplaza al flujo OpenSpec ni al alcance aprobado—, pero su contenido no es opcional: no se aparta de él por conveniencia. Toda modificación de comportamiento sigue el flujo OpenSpec de `AGENTS.md` §3; commit, push, PR y archivado son decisiones del usuario (`AGENTS.md` §10).

## 0. Cómo se usa esta guía

| Audiencia | Secciones | Para qué |
| --- | --- | --- |
| Desarrollo | §1–§7 | Entender el estilo, el mapa de módulos y dónde vive cada responsabilidad. |
| Desarrollo | §11 | Ver un ejemplo concreto de módulo con las cuatro capas. |
| Agentes de IA | §1–§7, §10 y §12 | Estilo, mapa y responsabilidades de cumplimiento obligatorio; protocolo de trabajo y puntos que no se resuelven por suposición. |

### Mantenimiento de esta guía

Cuando una convención cambie, el orden es: se aprueba la decisión, se aplica en `AGENTS.md` y recién entonces se actualiza este documento con el fundamento y la evidencia. Una contradicción de dominio se registra en §12 y **no** se resuelve por inferencia; si se resuelve, se anota la fuente que la resuelve.

---

## 1. Identidad arquitectónica del proyecto

### Decisiones respaldadas por el documento del proyecto

- **Estilo:** monolito modular; una aplicación backend y un despliegue, con módulos NestJS cohesionados por funcionalidad.
- **Partición:** por responsabilidades del negocio (*feature-first / domain-first*), no por una carpeta global de `controllers`, otra de `services` y otra de `repositories`.
- **Capas conceptuales internas:** presentación, aplicación, dominio e infraestructura.
- **Modelado:** DDD pragmático: lenguaje ubicuo, raíces de agregado, entidades, value objects, invariantes y servicios de dominio cuando aportan valor.
- **Contratos de persistencia:** obligatorios en el borde de aplicación. Los casos de uso —comandos y lecturas— y los Query Objects, cuando existan, acceden a la persistencia a través de una interfaz y nunca de `EntityRepository`, `EntityManager` ni `QueryBuilder` de MikroORM. La interfaz no se crea por operación: se reutiliza el contrato existente que ya cubre la lectura o la escritura necesaria. La implementación concreta pertenece a `infrastructure/` y se vincula mediante inyección de dependencias de NestJS.
- **Abstracciones restantes:** selectivas. Fuera del borde de persistencia, una interfaz, un adapter, un servicio o una Factory se justifican por desacoplamiento real, testabilidad, varios consumidores o una regla compleja; no por plantilla. La Factory tampoco se exige una por entidad.
- **CQRS:** el documento distingue explícitamente comandos y modelos de lectura, pero **no exige** `@nestjs/cqrs`, buses, handlers ni bases separadas. Pueden existir consultas dedicadas sin CQRS formal.
- **Bounded Context:** el MVP identifica **uno solo, «Entrenamiento»**. Separar código en módulos NestJS **no crea** bounded contexts adicionales.
- **Persistencia:** MikroORM sobre PostgreSQL, según la configuración real del repositorio.

### Regla de diseño

**Priorizar simplicidad y cohesión.** Aplicar el patrón más sencillo que proteja las reglas y permita probarlas. Un caso de uso fino no es ceremonia: es el nombre de la intención, el límite transaccional y el test asociado. El **único borde obligatorio** es el puerto de persistencia (§3): los casos de uso y los Query Objects no ven el ORM y acceden a los datos a través de un contrato. Lo que sigue prohibido es encadenar capas **por encima** de ese puerto —interfaces que envuelven interfaces, repositorios que solo reenvían a otros repositorios— y saltear el caso de uso para «simplificar».

**No proponer microservicios, Event Bus, CQRS integral, Event Sourcing o arquitectura hexagonal estricta como punto de partida** sin requisitos documentados que lo justifiquen.

---

## 2. Estructura del backend

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
│   └── use-cases/                       # Casos de uso: comandos y lecturas
│       ├── <verbo>-<sustantivo>.use-case.ts
│       ├── <verbo>-<sustantivo>.input.ts # Opcional: tipo, interfaz o clase
│       ├── <nombre>.query.ts            # Opcional: Query Object para lecturas complejas
│       ├── <nombre>.query.interface.ts  # Puerto de lectura (I<Nombre>Reader), cuando se crea
│       └── <nombre>.result.ts           # Proyección de lectura, cuando corresponde
├── domain/
│   ├── entities/                        # Aggregate roots y entidades hijas
│   ├── value-objects/                   # Value objects genuinos
│   ├── factories/                       # Solo cuando la construcción de la entidad lo justifique
│   ├── services/                        # Reglas de dominio que no caben en una entidad o abarcan varios agregados
│   ├── policies/                        # Opcionales; reglas claramente identificadas
│   ├── errors/                          # Errores semánticos de dominio
│   └── interfaces/                      # Puertos de escritura (IPlanRepository)
└── infrastructure/
    ├── repositories/                    # MikroOrm<Agregado>Repository: implementa el puerto de escritura
    ├── queries/                         # Implementación de puertos de lectura (QueryBuilder, SQL, proyecciones)
    └── external/                        # Integraciones técnicas, si existen
```

- El puerto de escritura vive en `domain/interfaces/<nombre>.repository.interface.ts` porque devuelve y recibe agregados del dominio. El puerto de lectura vive junto a la operación que lo consume, en `application/use-cases/<nombre>.query.interface.ts`, porque devuelve una proyección de aplicación: el contrato pertenece al consumidor y así la dirección de dependencias sigue apuntando hacia adentro. No se declara un puerto nuevo por cada lectura: si un contrato existente ya expone la operación necesaria, se reutiliza.
- `application/` no importa nada de `@mikro-orm/*`. Si un archivo de `application/` menciona `EntityRepository`, `EntityManager` o `QueryBuilder`, el límite está mal trazado.

**No crear estas subcarpetas preventivamente**, con una excepción: el primer caso de uso de un módulo **ya** crea su implementación de persistencia en `infrastructure/` y el puerto que necesita —en `domain/interfaces/` o en `application/`—, porque el ORM no se accede sin ese contrato. Un módulo simple se queda en `<capacidad>.module.ts`, `presentation/`, `application/use-cases/` (caso de uso e Input), `domain/entities/`, `domain/interfaces/` e `infrastructure/repositories/`; `infrastructure/queries/`, `factories/`, `services/`, `policies/` y `external/` aparecen solo cuando la funcionalidad los necesita. **Excepción organizativa expresamente definida: dentro de `catalogo/` cada concepto catalogable tiene su propia subcarpeta y su propio controller, casos de uso, DTO, entidad y módulo NestJS**, aunque su CRUD sea mecánico. No reunir todos los controllers, casos de uso o DTO del catálogo en archivos únicos compartidos.

### Organización obligatoria de `catalogo/`

`CatalogoModule` es un **módulo agrupador** que reúne los submódulos del catálogo. `Ejercicio`, `CategoriaEjercicio`, `Material`, `Unidad` y `ObjetivoPlan` se implementarán como **capacidades independientes dentro de `catalogo/`**, cada una con su propia organización en capas. Esta división técnica no implica nuevos bounded contexts, microservicios ni exigencia de Ports and Adapters estricta.

**Fundamento de esta excepción (evidencia, no preferencia):** `docs/dominio/Analisis de dominio.md` establece que las entidades de catálogo son *«entidades de catálogo, cada una de las cuales es raíz de su propio agregado»*. Son cinco raíces de agregado distintas, no entidades hijas de un mismo agregado. A eso se suman cinco historias de usuario independientes (`HU 2`, `HU 26`, `HU 27`, `HU 28` y `HU 29` en `docs/dominio/User Stories.md`) y `AD-04` en `docs/dominio/Arquitectura de pantallas.md`, que describe explícitamente «Gestionar el catálogo maestro (5 CRUDs)». La excepción no contradice la regla anti-ceremonia de §1: cada submódulo corresponde a **un agregado y a una unidad especificable por separado** en un cambio de OpenSpec. Lo que sigue prohibido es partir un agregado en varios módulos o concentrar los cinco agregados del catálogo en un controller único.

```text
src/modules/catalogo/
├── catalogo.module.ts                       # Agrupa/importa los cinco submódulos
├── ejercicios/
│   ├── ejercicios.module.ts
│   ├── presentation/
│   │   ├── ejercicios.controller.ts
│   │   └── dto/                              # DTO propios de ejercicios
│   ├── application/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── ejercicio.entity.ts
│   │   └── interfaces/
│   │       └── ejercicio.repository.interface.ts   # IEjercicioRepository
│   └── infrastructure/
│       └── repositories/
│           └── mikro-orm-ejercicio.repository.ts
├── categorias-ejercicio/
│   ├── categorias-ejercicio.module.ts
│   ├── presentation/
│   │   ├── categorias-ejercicio.controller.ts
│   │   └── dto/
│   ├── application/
│   │   └── use-cases/
│   └── domain/
│       └── entities/
│           └── categoria-ejercicio.entity.ts
├── materiales/
│   ├── materiales.module.ts
│   ├── presentation/
│   │   ├── materiales.controller.ts
│   │   └── dto/
│   ├── application/
│   │   └── use-cases/
│   └── domain/
│       └── entities/
│           └── material.entity.ts
├── unidades/
│   ├── unidades.module.ts
│   ├── presentation/
│   │   ├── unidades.controller.ts
│   │   └── dto/
│   ├── application/
│   │   └── use-cases/
│   └── domain/
│       └── entities/
│           └── unidad.entity.ts
└── objetivos-plan/
    ├── objetivos-plan.module.ts
    ├── presentation/
    │   ├── objetivos-plan.controller.ts
    │   └── dto/
    ├── application/
    │   └── use-cases/
    └── domain/
        └── entities/
            └── objetivo-plan.entity.ts
```

- Cada submódulo **encapsula sus propios endpoints, DTO, lógica de aplicación y modelo**, con sus providers y `MikroOrmModule.forFeature(...)` registrados en su `*.module.ts` según corresponda.
- `catalogo.module.ts` **agrupa/importa** esos módulos; no concentra controladores, casos de uso ni repositorios de todas las entidades. Debe exportar solo lo necesario para los consumidores de otros módulos.
- Dentro de cada submódulo, cada comando sigue `Controller → Input → UseCase → I<Concepto>Repository → MikroOrm<Concepto>Repository`, y cada lectura se implementa como caso de uso; cuando la consulta lo justifica, un Query Object con `I<Concepto>Reader` y su lector en `infrastructure/queries/`. Las carpetas `domain/interfaces/` e `infrastructure/repositories/` (o `infrastructure/queries/`) aparecen en cuanto el submódulo tiene comandos o consultas: son el borde que mantiene el ORM fuera de aplicación. `factories/`, `domain/services/` y `external/` se agregan solo si hay motivo concreto.
- Crear cada subcarpeta y sus archivos cuando se implemente esa capacidad mediante el flujo OpenSpec aprobado; este esquema no autoriza a generar archivos vacíos de forma anticipada.

### Mapa de módulos vinculado al dominio documentado

| Módulo NestJS propuesto | Conceptos de dominio |
| --- | --- |
| `planes` | `Plan` (aggregate root), `DiaDelPlan`, `EjercicioPlanificado`, `PrescripcionSemanal` |
| `entrenamientos` | `Entrenamiento` (aggregate root), `EjercicioRealizado`, `Serie`, `Cantidad` |
| `catalogo` | `Ejercicio`, `CategoriaEjercicio`, `Material`, `Unidad`, `ObjetivoPlan` |
| `alumnos` | `Alumno` |
| `profesores` | `Profesor` |
| `seguimiento` | Historial, asistencias, última carga, récord y evolución |
| `auth` | Identidad, roles y actor autenticado |

**No crear módulos independientes por cada entidad hija o Value Object de un mismo agregado**. **Para el catálogo sí corresponde un submódulo NestJS por cada concepto catalogable** (`ejercicios`, `categorias-ejercicio`, `materiales`, `unidades`, `objetivos-plan`), todos reunidos bajo `catalogo/`, porque `Analisis de dominio.md` define cada uno como raíz de su propio agregado y las historias de catálogo (`HU 2`, `HU 26`, `HU 27`, `HU 28` y `HU 29`) los especifican por separado. Tampoco se deberán importar indiscriminadamente archivos internos de otros módulos. La integración deberá realizarse mediante proveedores exportados por sus respectivos módulos.

---

## 3. Responsabilidades y dependencias por capa

### `presentation/`

**Incluye:** controllers HTTP, DTO de request/response, validación/sanitización de entrada con `class-validator` y `class-transformer`, pipes y guards propios de la entrada HTTP.

**Puede:** validar formato, tipos, campos obligatorios, transformar DTO en parámetros de aplicación, obtener usuario autenticado, delegar a un caso de uso (comando o lectura) y devolver una respuesta.

**No puede:** decidir reglas de negocio, ejecutar consultas ORM, diseñar transacciones ni modificar directamente agregados persistentes.

> DTO es contrato del transporte, **no** entidad de dominio. Un DTO válido no implica que la operación esté permitida por las reglas del gimnasio.

### `application/`

**Incluye:** un `*UseCase` por intención —comandos y lecturas— y, cuando la consulta lo justifica, un `*Query` para la lectura especializada. No hay servicios de capacidad en esta capa.

**Puede:** orquestar módulos, comprobar permisos de una operación, recuperar agregados, invocar entidades y servicios de dominio, coordinar transacciones, trabajar con contratos de persistencia y construir resultados.

**No puede:** ocultar invariantes que deberían vivir dentro de los agregados, duplicar reglas en diversos controladores o casos de uso, ni presentar como regla de negocio la mera coordinación entre agregados.

- Un caso de uso por intención de negocio (`CrearPlanUseCase`, `ListarEjerciciosUseCase`), con un único método público `execute()`.
- El caso de uso es el límite transaccional y el lugar donde se comprueba el actor y el permiso de la operación.
- Un caso de uso puede ser fino: delegar en el agregado y persistir es una implementación válida. Lo que no se admite es mover esa orquestación al controller.
- **La dependencia de persistencia es siempre una interfaz.** El caso de uso recibe por constructor un `IPlanRepository` (o el puerto equivalente) y jamás `@InjectRepository(Entity)`, `EntityRepository`, `EntityManager` ni `QueryBuilder`. La implementación concreta se registra como provider en `*.module.ts`. No se declara una interfaz nueva por operación: si un contrato existente ya cubre la lectura o la escritura, se reutiliza o se amplía.
- El caso de uso recibe un **Input de aplicación** (`CrearPlanInput`), no el DTO HTTP: el DTO y `class-validator` se quedan en `presentation/` (§5.6).
- Los métodos de escritura del puerto reciben y devuelven **agregados o entidades de dominio**, nunca DTO HTTP ni Input de aplicación.
- No crear `<capacidad>.service.ts` ni `*-query.service.ts`. Si dos casos de uso comparten pasos, esos pasos son regla de dominio o un colaborador con nombre propio, nunca un servicio con el nombre del módulo.
- No imponer una cadena de delegación donde cada capa solo reenvía métodos a la siguiente. El puerto de persistencia es el único borde admitido; por encima de él no se apilan repositorios, adaptadores ni interfaces.

### `domain/`

**Incluye:** entidades, raíces de agregado, VO inmutables, invariantes y reglas, servicios y políticas del dominio, factories del dominio cuando aportan, puertos de persistencia de escritura.

**Puede:** expresar reglas sobre estados y cambios, impedir operaciones inválidas, calcular resultados de negocio desde los datos necesarios.

**No debe:** importar controllers, DTO HTTP, `Request`, `Response`, `HttpException`, `EntityManager`, `EntityRepository`, `QueryBuilder` o herramientas de infraestructura **en sus reglas puras**. Las entidades persistidas podrán llevar decoradores MikroORM como **concesión pragmática** aprobada; no presentar eso como independencia absoluta del ORM.

- Toda modificación de un agregado debe pasar por su raíz cuando afecte invariantes internas.
- Un servicio de dominio solo se justifica si la regla genuinamente no pertenece a una entidad, abarca varios agregados o una entidad no puede resolverla con la información que posee. Coordinar agregados, por sí solo, no lo justifica.
- Las interfaces llevan prefijo `I`. Los puertos de escritura viven en `domain/interfaces/<nombre>.repository.interface.ts` —`IPlanRepository` en `plan.repository.interface.ts`— porque devuelven agregados. Los puertos de lectura viven junto a la operación que los consume, en `application/use-cases/<nombre>.query.interface.ts`, porque devuelven proyecciones de aplicación (§6). No se exige una interfaz por operación: un contrato existente puede servir a varias lecturas. La implementación concreta no lleva prefijo: `MikroOrmPlanRepository` en `infrastructure/repositories/mikro-orm-plan.repository.ts`, `MikroOrmPlanDeAlumnoReader` en `infrastructure/queries/`. La ubicación no es libre: el contrato vive del lado del consumidor y la implementación, siempre en `infrastructure/`.
- **Factory:** se incorpora cuando construir la entidad lo justifica —reunir datos de varias fuentes antes de invocar la raíz, fijar valores por defecto coherentes o preservar una invariante de armado que el constructor no puede expresar—. No se crea una Factory por entidad: en la mayoría de los casos alcanza el constructor o un método estático nombrado de la propia raíz (`Plan.crear(...)`).
- Las validaciones que requieren consultar la base se coordinan desde aplicación a través de los puertos; el criterio sigue siendo del dominio y la consulta a la persistencia no lo redefine.

### `infrastructure/`

**Incluye:** implementaciones con MikroORM de los puertos de escritura y de lectura, consultas con `QueryBuilder`, adapters de servicios externos si se aprueban, utilidades técnicas específicas de persistencia.

**Puede:** materializar y guardar entidades recibidas del dominio, ejecutar `QueryBuilder` con joins y filtros dinámicos, ejecutar SQL parametrizado, traducir excepciones técnicas, implementar los puertos de aplicación o dominio, abrir la transacción que el caso de uso solicitó.

**No puede:** decidir reglas de negocio por su cuenta, recibir DTO HTTP ni Input de aplicación como dato a persistir, ni esconder efectos de dominio en consultas o subscribers del ORM.

- **`QueryBuilder`, joins y proyecciones viven acá.** Una consulta compleja puede usar `QueryBuilder`, `LEFT JOIN` para relaciones opcionales, filtros dinámicos, agregaciones y selección de campos; una consulta simple no está obligada a usarlo y puede resolverse con el `EntityRepository` del puerto.
- La regla de visibilidad del dominio decidida en la capa superior se **respeta**, no se reinterpreta: la consulta acota por actor y por baja lógica sin redefinir el criterio.
- Traduce las excepciones del driver y del ORM a errores con significado (§8); un `DriverException` no atraviesa este límite.

### Dirección de dependencias

```text
Frontend
  -> HTTP Controller [presentation]        DTO + Input de aplicación
       -> UseCase (comando o lectura) / Query Object opcional [application]
            -> Entidades / reglas [domain]
            -> Puerto de persistencia [domain/interfaces | application]
                  <- implementado por [infrastructure]
                         -> MikroORM (EntityRepository, QueryBuilder) -> PostgreSQL
```

El borde es **obligatorio y único**: ningún caso de uso ni Query Object conoce `EntityRepository`, `EntityManager` o `QueryBuilder`. El caso de uso decide la unidad de trabajo y la pide a su puerto; la implementación de `infrastructure/` es la que abre la transacción con `em.transactional(...)`. Las reglas del dominio se mantienen protegidas y no se agregan capas intermedias: un solo puerto, una sola implementación.

NestJS `*.module.ts` es la **composition root** local: registra controladores y proveedores, vincula cada puerto con su implementación mediante un token —por ejemplo `{ provide: 'IPlanRepository', useClass: MikroOrmPlanRepository }`— e importa/exporta las dependencias necesarias. Evitar `forwardRef()` recurrente: suele indicar límites poco claros.

---

## 4. Selección de patrones: ruta obligatoria

| Operación | Implementación |
| --- | --- |
| Comando (crear, modificar, eliminar o cambiar estado) | `Controller → Input → UseCase → dominio → I<Agregado>Repository → MikroOrm<Agregado>Repository` |
| Consulta simple (una entidad o agregado, filtros fijos) | `Controller → UseCase → puerto de persistencia (existente o propio) → lector MikroORM → proyección → DTO` |
| Consulta compleja (varias entidades, filtros dinámicos, búsqueda, ordenamiento, paginación, agregaciones) | `Controller → UseCase` (o un Query Object si aporta valor) `→ puerto de persistencia`; si las operaciones del ORM no alcanzan, la implementación usa `QueryBuilder`, joins y proyección en `infrastructure/queries/` |
| Construcción de una entidad con datos de varias fuentes o con una invariante de armado | Factory en `domain/factories/` cuando la construcción lo justifica; si no, el constructor o un método estático de la raíz |
| Regla interna de un agregado (invariante, cálculo, transición de estado) | dentro de la entidad o de la raíz del agregado que la posee |
| Regla de negocio que involucra varios agregados, o que una entidad no puede resolver con su información | servicio de dominio en `domain/services/`, invocado por el `UseCase` |
| Coordinación de operaciones y límite transaccional | dentro del `UseCase` que la origina |
| Lectura agregada (historial, récord, evolución, asistencias) | `UseCase` o `Query Object` con proyección; nunca hidratar agregados completos |
| Baja lógica o reactivación de un agregado | caso de uso propio del comando + puerto de escritura; nunca un `update` genérico (§7) |
| Crear plan completo | `CrearPlanUseCase` + `Plan` (con Factory si la construcción lo justifica) + `IPlanRepository` |
| Iniciar, agregar o finalizar entrenamiento | caso de uso + métodos de `Entrenamiento` |
| Baja de profesor con desasignación de alumnos | caso de uso coordinador + transacción; nunca evento asíncrono en el MVP sin aprobación |
| Servicio externo real | caso de uso → interfaz → adapter; solo si la integración es parte del alcance aprobado |

**Reglas de negocio y coordinación son responsabilidades distintas.** La separación no depende de cuántos agregados participen, sino de qué se está expresando:

- Las reglas propias de una entidad o agregado pertenecen a su dominio; no se mudan a aplicación, consultas ni persistencia.
- Las reglas de negocio que involucran varios agregados, o que una entidad no puede resolver con la información que posee, se encapsulan en un servicio de dominio cuando corresponde.
- Coordinar varios agregados **no** obliga a crear un servicio de dominio: la abstracción se justifica por una regla de negocio, no por la cantidad de participantes.
- Los `UseCase` coordinan la operación, recuperan la información, invocan entidades o servicios de dominio y administran el límite transaccional; no redefinen la regla.
- Controllers, consultas y mecanismos de persistencia no definen ni duplican reglas de negocio.

**La ruta no depende de la complejidad estimada.** Todo comando pasa por un caso de uso, incluido el CRUD de catálogo, y toda lectura tiene también una operación de aplicación con nombre; el Query Object se agrega solo cuando la consulta lo justifica. Una ruta que se decide por «qué tan complejo parece» produce dos implementaciones distintas para el mismo tipo de operación y las dos quedan «bien».

Toda lectura puede resolverse con un caso de uso y el puerto de persistencia disponible. El **Query Object** y el **`QueryBuilder`** en `infrastructure/queries/` son herramientas opcionales: se usan únicamente cuando aportan valor —consultas con varias entidades, filtros dinámicos, agregaciones o paginación que las operaciones del ORM no cubren bien—, nunca por reflejo.

La interfaz de persistencia **es obligatoria y no se evalúa caso por caso**: el acceso a datos siempre pasa por un contrato. Lo que no se admite es apilar capas por encima de él ni crear un puerto nuevo cuando ya existe uno con la operación necesaria.

**Evitar:** `Controller -> UseCase -> Repository -> PersistenceAdapter -> ORM` cuando el `Repository` únicamente reenvía métodos al `PersistenceAdapter`, y `Controller -> UseCase -> IPlanRepository -> PlanRepository -> MikroOrmPlanRepository`. Un puerto, una implementación.

**Evitar también:** que el controller arme la entidad, que el `QueryBuilder` suba a aplicación y que el repositorio de escritura reciba el DTO HTTP o el Input del caso de uso.

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
- Crear un plan puede implicar coordinación entre `Profesor`, `Alumno`, catálogo y `Plan`; ubicar esa coordinación en aplicación, no en el controller. Las comprobaciones que son reglas de negocio —alumno habilitado, solapamiento de fechas, ejercicios obligatorios— se expresan en dominio (§4); la aplicación coordina y delimita la transacción.
- La validación previa de solapamiento **por sí sola no evita carreras concurrentes**. Evaluar en el diseño de persistencia transacción, bloqueo y/o restricción adecuada de PostgreSQL; demostrar el comportamiento con pruebas.
- **Duración del plan: entre 4 y 12 semanas (RN-04), requisito vigente.** La versión 2.0 de `docs/dominio/Reglas de negocio.md` fija una duración variable con mínimo de 4 y máximo de 12 semanas, y `HU 1 - Registrar plan de entrenamiento` lo exige en sus criterios de aceptación. La duración no es una constante del sistema: se persiste por plan junto con la fecha de inicio y la fecha de fin calculada a partir de la cantidad de semanas. La duración fija de 4 semanas pertenece al análisis preliminar y quedó reemplazada; no se implementa.

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

- Cada concepto de catálogo tiene su propio **submódulo funcional dentro de `catalogo/`**, con controller, casos de uso, DTO y entidad propios; no crear un único `CatalogoController` con todas las operaciones CRUD.
- `Ejercicio` es una definición catalogada, distinta de `EjercicioPlanificado` y `EjercicioRealizado`.
- `Unidad`, `CategoriaEjercicio`, `Material` y `ObjetivoPlan` son conceptos compartidos de catálogo con identidad propia.
- **Referencias entre agregados — convención establecida:** una referencia a otro agregado expone el **identificador** y la **referencia al objeto relacionado**. La referencia al objeto se utiliza para lectura; toda modificación del agregado referenciado se realiza exclusivamente mediante su propia raíz, preservando sus invariantes.
- Ambos atributos representan **una única relación persistida**: no se duplican en columnas independientes ni se mantiene una segunda copia del identificador. Existe una sola representación persistente y coherente de la relación, para que no haya dos fuentes que puedan divergir. Cómo se mapea esa relación se decide al diseñar el agregado con las capacidades de MikroORM; esta guía no prescribe decoradores ni APIs concretas.
- Exponer la referencia navegable **no** implica cargar automáticamente todas las relaciones en cada consulta: la carga se decide por consulta, y los formularios e informes usan lecturas proyectadas (§6) en lugar de cargar el agregado entero de forma recursiva.

### 5.5 Value Objects y almacenamiento

- La clasificación DDD (VO versus entidad) **no prescribe automáticamente** una tabla distinta o el mismo tipo de mapeo ORM. Decidir cómo persistir `Serie`, `Cantidad`, `EjercicioPlanificado` y `PrescripcionSemanal` al diseñar cada agregado.
- VO por valor, preferentemente inmutables, con validaciones del dominio; no darles repositorios propios por rutina.
- No inventar `ValueObject` genéricos, clases base innecesarias o una librería DDD antes de necesitarla.

### 5.6 De la petición HTTP al agregado: DTO, Input y Factory

Tres artefactos con dueños distintos, que no se reemplazan entre sí:

| Artefacto | Vive en | Valida | Conoce |
| --- | --- | --- | --- |
| **DTO HTTP** (`CreatePlanDto`) | `presentation/dto/` | Formato, tipos y campos obligatorios, con `class-validator` | El contrato del transporte. Nada del dominio. |
| **Input de aplicación** (`CrearPlanInput`) | junto a su caso de uso: tipo, interfaz o clase; `<verbo>-<sustantivo>.input.ts` solo si se crea un archivo | Nada: es un tipo de parámetros ya validado | Lo que la intención de negocio necesita, con tipos del dominio cuando aplica (`planId: PlanId`). Sin decoradores de transporte ni dependencias de Nest/HTTP. |
| **Entidad o agregado** (`Plan`) | `domain/entities/` | Invariantes del gimnasio | Su propio estado y sus reglas. Nunca se construye desde el payload sin pasar por sus validaciones. |

- El controller transforma el DTO en Input y lo entrega al `execute(input)` del caso de uso. El caso de uso no importa `class-validator`, `@nestjs/common` para validación, ni el DTO.
- El DTO **no** se convierte en entidad ni se entrega a MikroORM (§7). El Input **tampoco**: el puerto de escritura recibe agregados.
- La conversión DTO → Input puede ser mecánica. Si exige reglas, esas reglas son del dominio y no se esconden en el mapper.

**Factory de dominio.** Se incorpora cuando la construcción de la entidad lo justifica:

- el agregado necesita datos de varias fuentes antes de invocar su constructor o su método de fábrica;
- hay valores por defecto o una política de armado que debe aplicarse siempre y no puede expresarse en el constructor;
- la construcción tiene un nombre de negocio propio (`Plan.aPartirDe(...)`, `PlanFactory.crearDesdePrescripcion(...)`).

No se crea una Factory por entidad. Un constructor con validaciones o un método estático nombrado de la raíz cubre la mayoría de los casos y es preferible: menos archivos, misma protección. La Factory no reemplaza al constructor ni puede saltear invariantes; si lo hace, es un antipatrón.

---

## 6. Lecturas y Query Objects opcionales

El documento distingue comandos de consultas. Esa distinción es **semántica**: no obliga a CQRS formal ni a una clase por lectura. Toda lectura se implementa como una operación de aplicación con nombre en `application/use-cases/` —un caso de uso o, cuando la consulta lo justifica, un **Query Object**—; el Query Object es **opcional** y se agrega cuando la consulta lo requiere: varias entidades, filtros dinámicos, ordenamiento, paginación o agregaciones. Una lectura simple de una entidad o agregado se resuelve con un caso de uso y el contrato de persistencia disponible.

**Contrato del Query Object, cuando existe:**

- Clase con un único método público `execute(input)`, igual que el caso de uso y por la misma razón: un nombre de intención, un límite y un test.
- Recibe un **Input de aplicación** de la consulta (`HistorialEntrenamientosInput`), no el DTO HTTP ni el `Request`.
- Declara su **puerto de lectura** `I<Nombre>Reader` en `application/use-cases/<nombre>.query.interface.ts`, implementado en `infrastructure/queries/`. Si un contrato existente ya expone la lectura, se reutiliza en lugar de crear otro.
- Devuelve una **proyección** (`<Nombre>Result`) cuando el resultado no coincide con una entidad, o los agregados cuando la lectura es de una sola raíz y el agregado ya es el modelo adecuado. La proyección es la opción por defecto en lecturas que cruzan agregados.
- No muta estado, no llama `flush()` y no conoce MikroORM.

Ejemplos de intención para las lecturas que sí ameritan un Query Object:

- `PlanDeAlumnoQuery`: plan vigente y prescripción relevante para consulta.
- `SeguimientoPlanesQuery`: alumnos sin plan o con plan próximo a finalizar, con filtros por profesor y estado.
- `HistorialEntrenamientosQuery`: entrenamientos por alumno, rango de fechas y última carga utilizada, paginado.
- `AsistenciasQuery`: fechas y conteos por semana/mes en rango dado.
- `EvolucionQuery`: mejor serie y evolución por ejercicio.

Nombres y agrupación exacta son **ejemplos** que pueden reorganizarse según los módulos existentes; no crear cinco consultas sin funcionalidades que las usen, ni una clase por lectura cuando alcanza un caso de uso.

El cálculo derivado no cambia de dueño: la operación de lectura recupera y proyecta los datos, el dominio expresa el criterio.

Reglas:

1. Las lecturas **no mutan** estado ni guardan `flush()`.
2. **Recuperan y proyectan** información; no definen ni duplican reglas de negocio. Cuando un resultado derivado dependa de una regla de negocio, se **reutiliza el comportamiento del dominio** que la expresa: fórmulas y criterios —récord, última carga, estado temporal del plan— no se reescriben en cada consulta. La agregación y proyección puramente técnicas (conteos, sumas, filtros, ordenamientos, paginación) pueden resolverse en la consulta optimizada, siempre que no redefinan una regla del negocio.
3. Calcular un resultado derivado **no exige hidratar el agregado completo**: alcanza con proyectar los datos que la regla necesita.
4. Récord, última carga y estados temporales del plan se **calculan** desde datos existentes, porque así se decidió en el documento; no persistirlos como tablas/materializaciones sin justificación y aprobación.
5. No perder reglas de autorización cuando se use una proyección que omite la carga del aggregate root.
6. **Las consultas habituales excluyen los registros dados de baja.** El filtro `deletedAt IS NULL` lo aplica la implementación del puerto de lectura, no cada operación a mano ni el llamador. Si una lectura necesita incluir datos históricos, la intención lo dice en su nombre o en su Input (`incluirDadosDeBaja: true`), nunca por omisión.
7. `QueryBuilder`, joins, `LEFT JOIN` para relaciones opcionales, filtros dinámicos, agregaciones y proyección de campos viven en `infrastructure/queries/`. **Una consulta simple no está obligada a usarlo.** El `QueryBuilder` **no cruza el puerto**: si aparece en `application/` o en un controller, el límite está mal trazado.
8. No atribuir las decisiones de presentación del frontend al dominio.

La optimización de consultas —N+1, joins que nadie consume, límites, paginación y orden estable— se detalla en `docs/agreements/buenas_practicas.md` §5 y no se repite acá.

---

## 7. MikroORM, transacciones, integridad y auditoría

### Stack realmente instalado (verificar antes de cambiar)

- NestJS 12, TypeScript 6, ESM (`"type": "module"`, NodeNext).
- Node 24 y Yarn 4; Vitest 4, oxlint y Prettier.
- MikroORM 7, PostgreSQL y migraciones de `@mikro-orm/migrations`.
- `ReflectMetadataProvider` y decoradores legacy configurados; imports relativos con sufijo `.js`.
- `entities: ['./dist/**/*.entity.js']`, `entitiesTs: ['./src/**/*.entity.ts']` en `src/mikro-orm.config.ts`.
- Validación de entrada: `class-validator` 0.15, `class-transformer` 0.5 y `@nestjs/mapped-types` 12 (alineado con NestJS 12), **ya instalados** como dependencias de runtime. Sin ellos `ValidationPipe` no funciona: no hay alternativa pendiente de decidir.

### Convenciones de implementación

El detalle operativo de persistencia, integridad y migraciones vive en `AGENTS.md` §6–§8 y `docs/agreements/buenas_practicas.md` §5; acá queda el criterio arquitectónico.

- Usar `EntityManager` contextual y Unit of Work propio de MikroORM. **No replicar** el `TypeOrmUnitOfWork` ni el decorador `@Transactional()` ad hoc del Proyecto 1.
- El límite transaccional coincide con el caso de uso que coordina los cambios: él decide qué operaciones forman una unidad, no el repositorio ni el controller. Todas las escrituras relacionadas van en el **mismo** contexto transaccional.
- El **caso de uso y el Query Object, cuando existe,** declaran su dependencia de persistencia como interfaz —`IPlanRepository`, `IHistorialEntrenamientosReader`— y la reciben por constructor. No se declara una interfaz nueva por operación si un contrato existente ya cubre lo necesario. `EntityRepository`, `EntityManager` y `QueryBuilder` aparecen **solo** dentro de `infrastructure/`.
- `MikroOrmModule.forFeature([...])` se configura en el módulo NestJS (`*.module.ts`) y `@InjectRepository(Entity)` se usa en las clases concretas de `infrastructure/`; ninguno de los dos aparece en el caso de uso ni en el Query Object. El vínculo puerto → implementación se declara en `*.module.ts` con un token explícito.
- Todo puerto de escritura recibe y devuelve **agregados o entidades de dominio**. Recibir un DTO HTTP o un Input de aplicación es un error de diseño, no una comodidad.
- La unidad de trabajo la decide el caso de uso y la ejecuta la implementación: si un comando modifica varios agregados, el puerto expone una operación con nombre propio (`crearConDesasignacion(...)`) y su implementación la envuelve en `em.transactional(...)`. No se inyecta `EntityManager` en `application/` para abrir la transacción a mano.
- No lanzar `flush()` incidentalmente desde reglas puras del dominio; persistir en el ámbito definido por aplicación.

### Baja lógica, exclusión y reactivación

La regla operativa vive en `AGENTS.md` §6.3; acá queda el criterio arquitectónico. La baja lógica **no es un detalle de cada consulta**: es el comportamiento por defecto del agregado y de su puerto.

- **Por defecto, eliminar es completar `deletedAt` y `deletedById`** y actualizar `updatedAt`/`updatedById` en la misma escritura. La fila permanece y con ella el rastro de quién la dio de baja. El borrado físico queda para catálogos sin referencias y sin historia que preservar (`HU 28`), y se decide por agregado, no por comodidad.
- **La baja es un comando con nombre propio.** `DarDeBajaProfesorUseCase`, `ReactivarAlumnoUseCase`: no un `update` genérico ni un `DELETE` desde un repositorio cualquiera. Así la transacción, la autorización y la auditoría quedan en el mismo lugar que el resto de la intención.
- **Exclusión en consultas habituales.** El filtro `deletedAt IS NULL` se aplica en la implementación del puerto de lectura (§6, regla 6), no se repite a mano en cada consulta ni se delega a la memoria del desarrollador. Un registro dado de baja no aparece en listados, búsquedas, reportes ni validaciones de existencia salvo que la intención de la consulta pida explícitamente el histórico.
- **Las comprobaciones de negocio también excluyen.** Un plan nuevo no se crea sobre un alumno dado de baja, y un ejercicio dado de baja no se ofrece en el catálogo: la validación consulta el estado vigente, no solo la existencia de la fila.
- **Reactivación explícita.** Volver `deletedAt` y `deletedById` a `null` es un caso de uso del dominio, no un update genérico, y actualiza `updatedAt`/`updatedById` como cualquier otra edición. La reactivación conserva continuidad: el historial previo no se reescribe.
- **Auditoría.** Los seis campos de `AGENTS.md` §6.1 se completan en el mismo mecanismo que el resto de las escrituras; la baja no los saltea y la reactivación tampoco. `createdAt` y `createdById` son inmutables.
- **Integridad.** Una restricción `UNIQUE` plana queda bloqueada por la fila dada de baja: el índice único parcial sobre `WHERE deleted_at IS NULL` es parte del diseño de la tabla, no un parche posterior.
- **Escrituras que saltean el mecanismo.** `updateMany`, `nativeUpdate` o SQL crudo no pasan por el mecanismo de auditoría: si un caso de uso los necesita, actualiza `updatedAt`/`updatedById` y la baja lógica explícitamente dentro de la misma transacción.

### Índices de base de datos

La regla operativa vive en `AGENTS.md` §8; acá queda el criterio y el fundamento.

- **Toda tabla cuenta con al menos un índice**, y alcanza con el que PostgreSQL genera automáticamente para su clave primaria. No se agrega un índice adicional solo para cumplir la regla.
- **Se evalúa la incorporación de índices adicionales** sobre claves foráneas, columnas usadas con frecuencia en búsquedas, filtros y ordenamientos, y sobre las columnas que las consultas de §6 usan para acotar resultados, de acuerdo con las necesidades de consulta y rendimiento del sistema. La evaluación se apoya en las consultas reales de la capacidad, no en una lista genérica de columnas candidatas.
- **La definición de índices se realiza mediante las migraciones de MikroORM** en `src/migrations`, igual que el resto del esquema. Un índice derivado de decoradores o del snapshot se incorpora a la migración correspondiente; no se crea ni modifica por `schema:update` ni por sincronización automática.
- **Se evitan índices redundantes o innecesarios**: los que repiten el prefijo de otro índice o duplican lo que ya garantiza una restricción `UNIQUE`, y los que no tienen una consulta que los justifique, porque cada uno incrementa el costo de `INSERT`, `UPDATE` y `DELETE`.
- Los índices únicos parciales que sostienen la baja lógica se rigen por `AGENTS.md` §6.3; no se reemplazan por índices planos.

### Auditoría transversal (ver `AGENTS.md` §6)

La auditoría se define en `AGENTS.md` §6 y no se repite acá: seis columnas obligatorias (`createdAt`, `createdById`, `updatedAt`, `updatedById`, `deletedAt`, `deletedById`), actor tomado del contexto de autenticación y nunca del payload, UTC, baja lógica, reactivación explícita y restricciones únicas parciales. El mecanismo concreto —base abstracta, suscriptor sobre el `EntityManager` o interceptor— se implementa en el cambio de OpenSpec que introduzca la primera entidad, cumpliendo los seis campos.

---

## 8. Errores, autorización y contrato API

- Errores semánticos de dominio: expresarlos de forma estable en dominio/aplicación cuando hagan falta; traducirlos a respuestas HTTP en el límite de presentación (filtro/mapeador) sin filtrar trazas ni detalles internos.
- DTO: validar contrato de entrada; dominio: validar invariantes. No duplicar la misma regla en controller, DTO, caso de uso y repositorio.
- **Convención de validación (decidida; ver `AGENTS.md` §5.6).** Los DTO son **clases** con decoradores de `class-validator`; los tipos derivados (`PartialType`, `OmitType`, `PickType`, `IntersectionType`) salen de `@nestjs/mapped-types`. Se registra **un solo** `ValidationPipe` global en `src/main.ts`.
- Opciones del pipe: `{ transform: true, whitelist: true }`. `whitelist` descarta toda propiedad no declarada en el DTO y es el mecanismo concreto que impide que el cliente cuele `createdById`, `updatedById` o similares. **No** se activa `forbidNonWhitelisted` mientras `AGENTS.md` §6.2 (regla 3) establezca que esos campos «se ignoran»; si el equipo prefiere rechazar la petición con 400, se activa la opción y se actualiza esa regla en el mismo cambio.
- El DTO nunca se convierte en entidad de dominio ni se entrega a MikroORM. `class-validator` valida formato y tipos; las reglas del gimnasio son invariantes de dominio (§5.1 y §5.2) y no se duplican en el DTO.
- El actor actual proviene del mecanismo de autenticación, **nunca** de un `createdById`, `updatedById` o similar enviado por el frontend.
- Los módulos que exponen información de un alumno deben comprobar identidad, asignación de profesor y autorización conforme a la regla vigente antes de consultar o responder, incluso en endpoints de estadísticas.
- Mantener contratos de request/response estables para integrar React con NestJS. Documentarlos como el equipo acuerde; no asumir que Swagger ya está instalado porque figura en borradores históricos.
- No diseñar integraciones, pagos, reservas, clases o notificaciones fuera del MVP sin especificación aprobada.

### Manejo de errores y excepciones

El tratamiento general está **centralizado** y su detalle operativo vive en `docs/agreements/buenas_practicas.md` §6 y `AGENTS.md` §4; acá queda el criterio arquitectónico:

- **Un solo lugar traduce a HTTP.** Un filtro global en `common/presentation/` mapea los errores semánticos de dominio y aplicación a códigos y cuerpos estables. Los controllers no arman respuestas de error a mano ni repiten `try/catch` por endpoint.
- **El error de dominio se lanza, no se devuelve.** Nada de `{ ok: false }` atravesando capas: un error semántico con nombre propio (`PlanSolapadoError`, `AlumnoDadoDeBajaError`) se propaga hasta el filtro.
- **Traducción de excepciones técnicas en `infrastructure/`.** La violación de una restricción única, una clave foránea inexistente o un timeout del driver se traducen a un error con significado **en el borde que los produce**. Un `DriverException`, un mensaje del motor o una traza SQL no atraviesan el puerto ni llegan al cliente.
- **`try/catch` selectivo.** Solo cuando traduce una excepción técnica, recupera de un fallo esperable con alternativa concreta, agrega contexto sin ocultar la causa o compensa una operación no atómica; nunca traga el error ni devuelve un resultado vacío.

---

## 9. Pruebas guiadas por reglas e invariantes

Las reglas de OpenSpec obligatorio, RED/GREEN/REFACTOR, Vitest, nombres de archivos, suites y verificaciones viven en `AGENTS.md` §3 y §7 y prevalecen sobre esta sección. Acá solo se especifica **qué** probar desde el punto de vista arquitectónico:

| Capa / operación | Pruebas prioritarias |
| --- | --- |
| Dominio (`Plan`) | Días permitidos, bloques obligatorios, duplicados y consistencia de progresión. |
| Dominio (`Entrenamiento`) | Series válidas, ejercicio repetido, estado finalizado inmutable. |
| Aplicación (`CrearPlanUseCase`) | Alumno activo, actor autorizado, solapamientos, transacción. |
| Aplicación (baja profesor) | Desasignación atómica de alumnos, errores y rollback. |
| Aplicación (baja y reactivación) | Baja lógica completa, exclusión del registro en lecturas posteriores, reactivación con auditoría actualizada y actor tomado del contexto. |
| Ports de persistencia | Casos de uso y Query Objects probados contra un doble del puerto, verificando el Input recibido y el agregado devuelto; ningún test de aplicación instancia MikroORM. |
| Persistencia | Relaciones entre agregados, migraciones, restricciones de DB, índices declarados en migraciones y su ausencia de redundancia, concurrencia y auditoría. |
| Consultas | Filtros de autorización, exclusión de registros dados de baja, filtros dinámicos, `LEFT JOIN` sobre relaciones opcionales, récords calculados, último peso, evolución, orden estable y paginación. |
| HTTP | DTO, Input de aplicación, guards, códigos/contratos de error y correspondencia con criterios de aceptación. |

Pruebas unitarias cerca de los archivos (`*.spec.ts`); integración con PostgreSQL real o Testcontainers cuando haga falta; E2E conforme a scripts y condiciones reales del proyecto. En las pruebas de aplicación se usa un doble del puerto; la integridad transaccional se prueba contra PostgreSQL real. **No afirmar un test verde si fue omitido por falta de Docker/DB** y no dar por probada la integridad transaccional con mocks del ORM.

---

## 10. Protocolo obligatorio para implementar una funcionalidad

Antes de proponer o tocar código, recorrer esta lista de verificación y aplicar el flujo OpenSpec que ya define `AGENTS.md`:

1. **Ubicar la capacidad**: ¿a qué módulo pertenece? ¿Es dato de catálogo, agregado, operación de aplicación o consulta? No crear bounded contexts adicionales.
2. **Verificar vigencia del requisito**: revisar `openspec/specs`, cambios activos, análisis de dominio, reglas e historias y decisiones abiertas. Señalar contradicciones.
3. **Elegir la ruta por tipo de operación**: comando → `Input` + `UseCase`; lectura → `UseCase`, con `Query Object` solo si la consulta lo justifica. El acceso a datos pasa siempre por un contrato (`I<Agregado>Repository`, `I<Nombre>Reader`) y no se declara uno nuevo si ya existe el adecuado. Servicio de dominio solo para una regla de negocio real que no cabe en una entidad, nunca solo para coordinar agregados; Factory solo si la construcción lo justifica (§5.6); `QueryBuilder` solo en `infrastructure/`. No existe «es simple, va directo al controller» ni «este caso de uso es chico, inyecta `EntityRepository`».
4. **Definir límites de modificación**: qué raíz de agregado protege cada regla; qué regla entre agregados necesita un servicio de dominio; qué otros agregados se consultan sin mutarlos; quién es responsable de la transacción.
5. **Identificar garantías de persistencia**: concurrencia, índices (al menos el de la clave primaria por tabla, más los adicionales justificados por consultas, todos por migración: ver §7), FK, nulabilidad, histórico, soft-delete, auditoría y migración.
6. **Respetar arquitectura de carpetas**: transporte en `presentation`; coordinación en `application`; reglas en `domain`; ORM/SQL en `infrastructure`, siempre detrás del puerto de persistencia.
7. **Escribir primero las pruebas** sobre invariantes, permisos, interacción y efecto observable, siguiendo el gate aprobado de OpenSpec.
8. **Implementar sin efectos colaterales**: no reformatear todo el repo ni mover módulos ajenos a la tarea; no agregar dependencias sin justificación.
9. **Verificar y reportar**: comandos ejecutados, resultado real, tests omitidos, migraciones y cambios de contratos, riesgos y deuda técnica.
10. **Obedecer los controles existentes**: no commitear, pushear, desplegar o archivar OpenSpec sin autorización explícita.

### Antipatrones a evitar

- **Anemic Domain Model** donde la entidad es solo campos y toda regla se duplica en servicios.
- **God Service** o caso de uso con orquestación, consultas, HTTP, validación y SQL mezclados; `<capacidad>.service.ts` en `application/`.
- Interfaz **fuera** del borde de persistencia que envuelve a otro colaborador sin agregar comportamiento, o que existe sin implementación alternativa ni consumidor que la necesite. El puerto de persistencia **no** entra en este antipatrón: es el borde obligatorio y su implementación MikroORM es la única capa de adaptación admitida. Lo que sí es antipatrón es apilar `IPlanRepository -> PlanRepository -> MikroOrmPlanRepository`.
- Inyectar `EntityRepository`, `EntityManager` o `QueryBuilder` en `application/`, en un controller o en una regla de dominio.
- Entregar un DTO HTTP o un Input de aplicación a un repositorio, a un puerto o a MikroORM.
- Crear una Factory por entidad o una Factory que esquiva las invariantes del constructor.
- Filtrar la baja lógica a mano consulta por consulta en lugar de fijarla en la implementación del puerto de lectura.
- `try/catch` defensivo que traga la causa, registra y devuelve un resultado vacío, o se repite en cada método sin poder hacer nada distinto de propagar.
- Encadenar servicios entre módulos hasta necesitar `forwardRef()` en múltiples direcciones.
- Reglas de negocio dentro del controller o de los DTO.
- **Servicio de dominio por coordinación**: crear uno porque la operación toca varios agregados, sin una regla de negocio que justifique la abstracción.
- **Regla de negocio duplicada en una query**: reescribir en la proyección una fórmula o criterio que el dominio ya expresa.
- Transacciones abiertas por cada método suelto del repositorio cuando lo que debe ser atómico es la operación completa del caso de uso; la transacción se abre por operación con nombre, no por llamada.
- Persistir récords, últimas cargas o estados temporales que el negocio decidió derivar.
- Exponer directamente entidades ORM con relaciones sensibles o ciclos de serialización.
- Interpretar «modelo de lectura» como obligación de CQRS formal.
- Crear un Query Object, una interfaz o una carpeta nueva por cada lectura cuando un caso de uso y un contrato existente ya resuelven la operación.
- Usar suscriptores ORM como lugar oculto para reglas de negocio.

---

## 11. Ejemplo de estructura **de referencia** para la capacidad `planes`

Estos nombres **no representan archivos existentes**; son una guía para organizar la primera implementación aprobada:

```text
src/modules/planes/
├── planes.module.ts                          # Vincula IPlanRepository y IPlanDeAlumnoReader
├── presentation/
│   ├── planes.controller.ts
│   └── dto/
│       ├── create-plan.dto.ts
│       └── plan-response.dto.ts
├── application/
│   └── use-cases/
│       ├── crear-plan.use-case.ts
│       ├── crear-plan.input.ts                 # Opcional: tipo, interfaz o clase
│       ├── plan-de-alumno.query.ts             # Opcional: la lectura lo justifica
│       ├── plan-de-alumno.query.interface.ts   # IPlanDeAlumnoReader
│       └── plan-de-alumno.result.ts            # Proyección de lectura
├── domain/
│   ├── entities/
│   │   ├── plan.entity.ts
│   │   └── dia-del-plan.entity.ts
│   ├── value-objects/
│   │   ├── ejercicio-planificado.vo.ts
│   │   └── prescripcion-semanal.vo.ts
│   ├── factories/
│   │   └── plan.factory.ts                   # Solo si la construcción lo justifica
│   └── interfaces/
│       └── plan.repository.interface.ts      # IPlanRepository
└── infrastructure/
    ├── repositories/
    │   └── mikro-orm-plan.repository.ts
    └── queries/
        └── mikro-orm-plan-de-alumno.reader.ts
```

**Flujo de escritura:** `PlanesController -> CreatePlanDto -> CrearPlanInput -> CrearPlanUseCase -> Plan (invariantes) -> IPlanRepository -> MikroOrmPlanRepository -> PostgreSQL`.

**Flujo de lectura:** `PlanesController -> PlanDeAlumnoQuery -> IPlanDeAlumnoReader -> MikroOrmPlanDeAlumnoReader (QueryBuilder + LEFT JOIN, filtro de baja lógica) -> PlanDeAlumnoResult -> DTO de respuesta`. Si la lectura fuera simple —una entidad por identificador, sin filtros dinámicos— alcanzaría un caso de uso con el contrato de persistencia existente, sin Query Object ni puerto nuevo.

**Diferencia deliberada:** el flujo de lectura no atraviesa `Plan` como aggregate root cuando solo se quiere mostrar información. Debe seguir preservando permisos y la exclusión de registros dados de baja.

Para cada CRUD de catálogo aplica la misma ruta que a cualquier comando: `Controller -> Input -> UseCase -> I<Concepto>Repository -> MikroOrm<Concepto>Repository`, **dentro de su subcarpeta específica** (por ejemplo, `catalogo/materiales/` contiene `MaterialesController`, `use-cases/crear-material.use-case.ts`, `material.repository.interface.ts`, `infrastructure/repositories/mikro-orm-material.repository.ts`, los DTO, `Material` y `MaterialesModule`). La baja consulta referencias antes de decidir, así que el caso de uso también es su límite transaccional. La implementación de persistencia y el contrato que la operación usa **no son opcionales** aunque el CRUD sea mecánico; lo que no se agrega sin motivo son `factories/`, `services/` y `external/`. `CatalogoModule` solamente agrupa los submódulos.

---

## 12. Conflictos y puntos que no se resuelven por suposición

**Este apartado sirve para detener suposiciones, no para autorizar cambios de alcance.**

| Tema | Evidencia documental | Comportamiento exigido |
| --- | --- | --- |
| Duración del plan | **Resuelto: RN-04 = entre 4 y 12 semanas**, según `Reglas de negocio.md` v2.0 y los criterios de aceptación de `HU 1 - Registrar plan de entrenamiento`. Reemplaza la duración fija de 4 semanas del análisis preliminar. | Persistir la **cantidad de semanas elegida por plan** (4 a 12) y calcular la fecha de fin. No volver a una constante fija ni aceptar valores fuera del rango. |
| Entrenamiento sin plan | Alcance del SPMP excluye entrenamiento libre, pero análisis describe registro flexible respecto de ejercicios planificados | Distinguir «ejercicios adicionales» de «sesión sin plan»; pedir decisión si el escenario cruza ese límite. |
| Estructura de capas | **Resuelto:** `AGENTS.md` §4 y §5 adoptan las cuatro capas y dejan de ubicar controllers y DTO en `infrastructure/`. Sustituye la convención anterior; no es un empate entre fuentes. | Seguir `AGENTS.md`. La convención aplica al código vigente y al nuevo: no hay migración masiva que hacer, y cualquier archivo que no la cumpla se corrige al tocarlo. |
| Stack histórico | Secciones del SPMP contienen referencias heredadas a MySQL/TypeORM/Jest/ESLint y a Gestión de Productos | Para implementación priorizar `package.json`, ORM config y `AGENTS.md` reales: PostgreSQL/MikroORM/Vitest/oxlint. No copiar esos ejemplos antiguos. |
| Nombre de carpetas/módulos | El documento define dominios, no rutas exactas `src/modules/*` | Los árboles de esta guía son recomendación para el equipo; no dar por existente un módulo. |
| Entidades ORM vs dominio puro | El documento pide bajo acoplamiento; el repo configura decoradores legacy MikroORM | Permitir compromiso pragmático explícito; si se exige independencia estricta, proponer mapeo de modelos separados como decisión adicional. |
| Auditoría | `AGENTS.md` §6 fija los seis campos, su nulabilidad y las reglas de actor, UTC y baja lógica; el mecanismo se implementa con la primera entidad | Implementarlo cumpliendo §6.1 y §6.2; la guía no fija nombres de clases ni módulos, así que no se inventan. |
| Autenticación/roles | Reglas de acceso y visibilidad en `docs/dominio/Reglas de negocio.md` (`RN-11`, `RN-12`, `RN-34`, `RN-35`); `AGENTS.md` no las define; el proveedor de identidad se define en el cambio de OpenSpec de `auth` | No inventar proveedor de autenticación, sesiones ni permisos por analogía con proyectos anteriores. |
| Evento de dominio | Documento conceptualiza hechos y decide una llamada directa para baja de profesor | No agregar RabbitMQ, buses ni publicación asíncrona sin una necesidad aprobada. |
| Interfaces y puertos de persistencia | **Resuelto:** decisión registrada en §1, §3, §4 y §7 de esta guía y aplicada en `AGENTS.md` §5.1, §5.4, §5.5, §5.7 y §5.9. El acceso a datos de casos de uso y Query Objects pasa siempre por un contrato; lo que sigue prohibido es apilar capas por encima y declarar una interfaz nueva por operación cuando ya existe una adecuada. | Seguir ambos documentos: el ORM solo en `infrastructure/`; `EntityRepository`, `EntityManager` y `QueryBuilder` no aparecen en `application/` ni en `domain/`. |
| Ubicación de los puertos | **Resuelto:** escritura en `domain/interfaces/`; lectura junto a la operación que la consume, en `application/use-cases/`; alineado en `AGENTS.md` §5.2 y §5.5. | Respetar la ubicación según la proyección devuelta: el contrato vive del lado del consumidor. |
| Separación de lecturas | **Resuelto:** `application/` mantiene solo `use-cases/`; toda lectura se implementa como operación de aplicación con nombre —caso de uso o Query Object— y el Query Object es opcional. Alineado en `AGENTS.md` §5.2, §5.4 y §5.8. | No crear `application/queries/` como carpeta obligatoria ni una clase por lectura. |
| Límite transaccional | **Resuelto:** el caso de uso decide la unidad de trabajo y la implementación del puerto la ejecuta con `em.transactional(...)`; alineado en `AGENTS.md` §5.7. | No inyectar `EntityManager` en `application/`; exponer una operación con nombre propio en el puerto. |
| QueryBuilder y consultas de lectura | **Resuelto:** `QueryBuilder`, joins, `LEFT JOIN` y filtros dinámicos viven en `infrastructure/queries/`; el Query Object es opcional y está alineado en `AGENTS.md` §5.8. | No exigirlo en consultas simples ni permitir que cruce el puerto. |
| Propuestas futuras | Arquitectura de lectura y módulos recomendados | No convertir sugerencias o backlog futuro en requisitos obligatorios. |

### Jerarquía de fuentes recomendada para implementación

1. Instrucción explícita y alcance aprobado por el usuario/equipo.
2. Cambio OpenSpec activo y aprobado, más especificaciones vigentes.
3. `AGENTS.md`, código y pruebas efectivamente presentes en la rama de trabajo (para reglas operativas y stack).
4. Documentación de dominio y reglas de negocio aceptadas por el equipo, incluidos los cambios más recientes.
5. Documento integral del Proyecto 3 — arquitectura y alcance, teniendo presente que algunas secciones siguen siendo borradores o heredadas.
6. `docs/agreements/arquitectura.md` — convenciones arquitectónicas de cumplimiento obligatorio y su fundamento. Para hechos de dominio y alcance rige el orden anterior; en estructura de carpetas, capas, límites entre módulos, modelado, persistencia y pruebas por capa, este documento y `AGENTS.md` mandan por encima de las fuentes 4 y 5, y `AGENTS.md` prevalece ante discrepancia.

Cuando dos fuentes autoritativas discrepen, señalar el desacuerdo; no aplicar una regla nueva por inferencia, ni sustituir documentación del proyecto por analogías externas.
