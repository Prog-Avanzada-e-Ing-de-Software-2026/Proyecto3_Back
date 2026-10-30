# AGENTS.md — proyecto3_back

Guía operativa para agentes de IA en este repositorio. La documentación y los artefactos de OpenSpec se escriben en español; el código, los identificadores técnicos y los mensajes de commit se escriben en inglés.

## 1. Contexto del proyecto

Backend de una aplicación de gestión de gimnasio: los profesores arman planes de entrenamiento y los alumnos registran sus entrenamientos. Está construido con NestJS 12, TypeScript estricto (ESM), MikroORM 7 y PostgreSQL, y se prueba con Vitest 4, oxlint y Prettier sobre Yarn 4.18.1 y Node 24. La documentación de dominio vive en `docs/dominio/` y es normativa: `Reglas de negocio.md` (42 reglas, `RN-01`..`RN-42`) y `User Stories.md` (29 historias, `HU 1`..`HU 29`) son la fuente de verdad vigente y se mantienen sincronizadas con el alcance del MVP. Todo cambio que altere comportamiento debe reflejarse además en un cambio de OpenSpec. Mantener el **lenguaje ubicuo** del dominio: no traducir ni renombrar sus términos en el código sin justificación.

La arquitectura —estructura de carpetas, capas, límites entre módulos, modelado, convenciones de persistencia y qué probar por capa— está definida en `docs/agreements/arquitectura.md`. Ese documento es de **cumplimiento obligatorio**: se lee y se sigue antes de proponer o implementar un cambio que toque esas materias, y no se aparta de él por conveniencia ni por analogía con otros proyectos. Ante discrepancia con este archivo manda `AGENTS.md`, y la discrepancia se reporta para corregir la guía; nunca se elige en silencio la versión más cómoda.

Las buenas prácticas de desarrollo —principios de trabajo, contratos HTTP y validación, Swagger/OpenAPI, persistencia e integridad, logging y trazabilidad, pruebas, el modelo de ramas GitFlow y contenido mínimo de PR— se documentan en `docs/agreements/buenas_practicas.md`. Es un documento de **orientación vigente**, no una norma: no sustituye a este archivo, a `docs/agreements/arquitectura.md`, a la especificación OpenSpec aprobada, a los contratos ni al código vigente, y no habilita por sí solo cambios, commits, push, PR, merges ni despliegues. Se consulta como complemento cuando este archivo o la arquitectura remiten a él. Jerarquía ante discrepancia: `AGENTS.md` → `docs/agreements/arquitectura.md` → `docs/agreements/buenas_practicas.md`; la discrepancia se reporta para corregir la guía y nunca se resuelve en silencio.

Ese documento ya está alineado con GitFlow, adoptado según §10, y su §4 describe Swagger/OpenAPI, cuya dependencia ya está instalada. `@nestjs/swagger` está en `package.json`: el registro del `SwaggerModule` en `src/main.ts`, la ruta de documentación y la decoración de los controllers se entregan en el cambio de OpenSpec que exponga el primer endpoint, y cada endpoint posterior se documenta en el mismo cambio que lo crea.

La **estrategia de testing** del repositorio está en `docs/agreements/testing.md`: qué se prueba en cada capa, el nivel mínimo que comprueba el comportamiento sin duplicar cobertura, la prioridad de esfuerzo `dominio → endpoints → casos de uso → persistencia`, Vitest con MikroORM y PostgreSQL real vía Testcontainers, el aislamiento del entorno, la cobertura esperada por módulo y la trazabilidad de cada caso a una regla o criterio de aceptación. Es de **cumplimiento obligatorio** al escribir o modificar pruebas: no se adopta otra estrategia por conveniencia ni por analogía con otros proyectos. §7 conserva los comandos y las reglas operativas del día a día; ante discrepancia manda `AGENTS.md` y la discrepancia se reporta. En materia de pruebas la precedencia es `AGENTS.md` → `docs/agreements/testing.md` → `docs/agreements/buenas_practicas.md`.

## 2. Comandos

| Objetivo | Comando |
| --- | --- |
| Instalar dependencias | `yarn install` |
| Desarrollo con watch | `yarn start:dev` |
| Build | `yarn build` |
| Typecheck | `yarn typecheck` |
| Lint | `yarn lint` |
| Verificar referencias entre documentos | `yarn check:docs` |
| Formatear | `yarn format` |
| Tests unitarios | `yarn test` |
| Tests e2e | `yarn test:e2e` |
| Cobertura | `yarn test:cov` |
| Crear migración | `yarn db:migration:create` |
| Aplicar migraciones | `yarn db:migration:up` |
| Revertir migración | `yarn db:migration:down` |
| Migraciones pendientes | `yarn db:migration:pending` |
| Verificar esquema | `yarn db:migration:check` |

## 3. Flujo SDD obligatorio (OpenSpec)

**Regla principal: no se escribe código de producción sin un cambio de OpenSpec aprobado.** Un cambio es la unidad de trabajo; no hay implementación "directa" de funcionalidades.

### 3.1 Fases y gates

| # | Fase | Comandos | Gate para avanzar |
| --- | --- | --- | --- |
| 0 | Explorar (solo lectura) | `openspec context --json`, `openspec list --specs`, `openspec show <capability> --type spec` | Requisitos existentes y decisiones abiertas identificados |
| 1 | Proponer | `openspec new change <kebab-case>` | Cambio creado por el CLI, nunca a mano |
| 2 | Artefactos | `openspec status --change <name> --json`, `openspec instructions <artifact> --change <name> --json` | `proposal.md`, `specs/**/spec.md`, `design.md` (cuando aplique) y `tasks.md` completos |
| 3 | Validar planificación | `openspec validate <name> --strict` | Sale con código 0 |
| 4 | Aprobación humana | — | El usuario pide explícitamente implementar |
| 5 | Implementar | `/opsx-apply <name>` o skill `openspec-apply-change` | Rama `feature/<change-name>` creada desde `develop` (§10); todas las tareas `[x]` y suites en verde |
| 6 | Verificar | `openspec validate <name> --strict` + suites | Cada escenario demostrado con evidencia |
| 7 | Archivar | `openspec archive <name>` | Tareas completas, validación en verde y aprobación del usuario |

### 3.2 Reglas del flujo

1. **Explorar antes de proponer.** Leer los specs existentes y los documentos de dominio. No proponer algo que ya existe o que contradice una regla de negocio.
2. **Un cambio = un comportamiento coherente.** Nombre en kebab-case (`add-plan-builder`, `register-training`). Nunca crear directorios dentro de `openspec/changes/` a mano: usar siempre `openspec new change`.
3. **Orden de artefactos:** `proposal` → `specs` → `design` → `tasks`. Respetar las dependencias que devuelve `openspec status`.
4. **`specs` es obligatorio.** Es un delta (`ADDED`, `MODIFIED`, `REMOVED`) con requisitos en `SHALL`/`MUST` y al menos un escenario `Given/When/Then` por requisito. Solo comportamiento observable; nada de detalles de implementación.
5. **`design.md`** se crea siempre que el cambio toque más de un módulo, altere el modelo de datos o migraciones, agregue dependencias, o implique decisiones de seguridad o rendimiento (la mayoría de los cambios de este proyecto). Debe registrar: decisión, alternativas descartadas, módulos/entidades/migraciones afectadas, riesgos y estrategia de pruebas. Solo puede omitirse en un cambio trivial sin esas condiciones, y la justificación se registra en `proposal.md`.
6. **`tasks.md` es el contrato de ejecución.** Una tarea por unidad verificable, ordenada por dependencia, con su prueba asociada y trazabilidad al requisito que la origina.
7. **La planificación y la implementación nunca ocurren en el mismo turno.** Terminar la propuesta, presentarla y esperar un pedido explícito de implementación.
8. **Validar antes de implementar y antes de archivar:** `openspec validate <name> --strict`.
9. **No ampliar alcance en silencio.** Si durante la implementación aparece comportamiento no especificado, detenerse y actualizar los artefactos (skill `openspec-update-change`) antes de escribir código.
10. **Archivar sincroniza los specs principales.** `openspec archive` mueve el cambio a `openspec/changes/archive/` y aplica el delta sobre `openspec/specs/`. No editar `openspec/specs/` a mano para reflejar un cambio: usar `openspec-sync-specs` o archivar.
11. **Artefactos en español**, con los encabezados estructurales y las palabras clave `SHALL`/`MUST` en inglés, según `openspec/config.yaml`.
12. **Trazabilidad:** cada requisito referencia las reglas o historias de la documentación de dominio cuando existan; cada commit referencia el cambio con `Refs: openspec/changes/<name>`.

### 3.3 Capacidades (capability paths)

Usar nombres en kebab-case, descriptivos y alineados al dominio. Mantener el path existente de una capacidad ya especificada y no crear una capacidad nueva si el comportamiento pertenece a una que ya existe.

### 3.4 Excepción documental

Solo los cambios sin efecto en comportamiento, contratos, esquema o código pueden hacerse sin un cambio de OpenSpec. Quedan comprendidos: typos y aclaraciones en `docs/dominio/`, y la documentación de convenciones (`AGENTS.md` y `docs/agreements/`), que no altera comportamiento por sí misma. La excepción debe declararse explícitamente en la respuesta. Ante la duda, crear el cambio.

## 4. Convenciones de código

- **ESM:** `package.json` tiene `"type": "module"` y `tsconfig` usa `nodenext`. Todo import relativo lleva extensión `.js` (`import { AppModule } from './app.module.js'`).
- **TypeScript estricto:** no relajar `strict` ni usar `@ts-ignore` sin justificación escrita.
- **NestJS:** un módulo por capacidad de negocio. La estructura de carpetas, las capas y las dependencias permitidas están en §5; no se repiten acá.
- **Validación de entrada:** DTO como clase con `class-validator` y `ValidationPipe` global. Detalle en §5.6.
- **MikroORM:** el ORM no se inyecta en `application/` ni en `domain/`: los casos de uso (comandos y lecturas) y los Query Objects acceden a la persistencia a través de un contrato (§5.4).
  - Las entidades deben llamarse `*.entity.ts` (el config las busca con `./src/**/*.entity.ts`).
  - Usar los decoradores legacy de `@mikro-orm/decorators/legacy`, consistentes con el `ReflectMetadataProvider` configurado.
  - Las migraciones viven en `src/migrations`.
  - Toda entidad persistente hereda de la base auditable (ver §6); los campos de auditoría no se declaran entidad por entidad.
- **Reglas de dominio:** se validan dentro de la raíz del agregado, no en controladores ni en DTOs. Un VO es inmutable; una entidad conserva identidad.
- **Errores de dominio:** no exponer detalles de persistencia en la API. Los errores semánticos se traducen a HTTP en el límite de presentación, sin filtrar trazas ni detalles internos.
- **Manejo de errores:** el tratamiento general está centralizado en un filtro global; `try/catch` es selectivo y solo traduce excepciones técnicas, recupera de un fallo esperable con alternativa concreta, agrega contexto sin ocultar la causa o compensa una operación no atómica. Un `catch` que solo registra y devuelve vacío está prohibido. Las excepciones del driver se traducen en `infrastructure/`; nunca llegan al cliente.
- **Formato:** Prettier (`singleQuote`, `trailingComma: all`) y oxlint. No introducir reglas nuevas de lint sin justificarlo.
- **Guardas de arquitectura en oxlint:** `.oxlintrc.json` hace cumplir automáticamente cuatro reglas, verificadas contra `yarn lint`:
  - `import/no-cycle` detecta ciclos entre módulos, síntoma de límites mal trazados (§5.4).
  - `no-restricted-imports` prohíbe `@nestjs/cqrs` y sus subrutas, que §5.8 descarta.
  - En `src/modules/*/domain/**`, `no-restricted-imports` prohíbe las excepciones de `@nestjs/common` (`HttpException` y derivadas): el dominio no conoce HTTP (§5.4).
  - `typescript/no-explicit-any` cierra el `any` implícito de facto, coherente con «no relajar `strict`».

  El campo `plugins` de oxlint **reemplaza** el conjunto base, por eso el archivo lista explícitamente `unicorn`, `oxc`, `typescript` e `import`. Lo que ninguna regla cubre —nombre de archivo `<capacidad>.service.ts`, un caso de uso por intención, procedencia del actor de auditoría— sigue siendo responsabilidad de revisión y pruebas, no del linter.

## 5. Arquitectura y límites de módulos

Fundamento y justificación de esta sección: `docs/agreements/arquitectura.md`, de cumplimiento obligatorio según §1. Ante discrepancia, manda `AGENTS.md`.

### 5.1 Identidad arquitectónica y regla de simplicidad

- **Estilo:** monolito modular. Una aplicación, un despliegue, módulos NestJS cohesionados por capacidad de negocio.
- **Partición:** por capacidad primero y capa después; nunca por carpetas globales de `controllers`, `services` y `repositories`.
- **Capas internas:** presentación, aplicación, dominio e infraestructura.
- **Modelado:** DDD pragmático — lenguaje ubicuo, raíces de agregado, entidades, value objects e invariantes. El lenguaje ubicuo está en `docs/dominio/Analisis de dominio.md` y no se traduce ni renombra.
- **Un solo bounded context:** «Entrenamiento». Dividir el código en módulos NestJS **no** crea contextos adicionales. No proponer microservicios, event bus, CQRS formal ni event sourcing sin requisitos documentados y aprobados.
- **Puertos de persistencia:** obligatorios en el borde de aplicación. Los casos de uso —comandos y lecturas— y los Query Objects, cuando existan, acceden a los datos a través de una interfaz y nunca de `EntityRepository`, `EntityManager` ni `QueryBuilder`. La interfaz no se crea por operación: se reutiliza el contrato existente que ya cubre la lectura o la escritura necesaria. La implementación concreta vive en `infrastructure/` y se vincula mediante inyección de dependencias de NestJS.
- **Resto de abstracciones:** selectivas. Fuera de ese borde, una interfaz, un adapter, un servicio de dominio o una Factory se justifican por desacoplamiento real, testabilidad, varios consumidores o una regla compleja; nunca por plantilla. No se exige una Factory por entidad.

**Regla rectora:** aplicar el patrón más simple que proteja la regla y permita probarla. Un caso de uso fino no es ceremonia: es el nombre de la intención, el límite transaccional y el test asociado. El **único borde obligatorio es el puerto de persistencia**; lo que sigue siendo antipatrón es encadenar capas **por encima** de él —interfaces que envuelven interfaces, repositorios que solo reenvían a otros repositorios— y los handlers sin necesidad concreta.

### 5.2 Estructura de carpetas

```text
src/
├── main.ts
├── app.module.ts
├── mikro-orm.config.ts
├── migrations/
├── common/                  # Solo lo transversal real, usado por dos o más módulos
│   ├── domain/              # Base auditable, errores comunes
│   ├── presentation/        # Filtro HTTP global, decorador de actor
│   └── infrastructure/      # Mecanismo de auditoría
└── modules/
    └── <capacidad>/         # alumnos, profesores, planes, entrenamientos, seguimiento, auth
        ├── <capacidad>.module.ts
        ├── presentation/
        │   ├── <capacidad>.controller.ts
        │   └── dto/
        ├── application/
        │   └── use-cases/          # Casos de uso: comandos y lecturas
        │       ├── <verbo>-<sustantivo>.use-case.ts
        │       ├── <verbo>-<sustantivo>.input.ts   # Opcional: tipo, interfaz o clase
        │       ├── <nombre>.query.ts               # Opcional: Query Object para lecturas complejas
        │       ├── <nombre>.query.interface.ts     # Puerto de lectura (I<Nombre>Reader), cuando se crea
        │       └── <nombre>.result.ts              # Proyección, cuando corresponde
        ├── domain/
        │   ├── entities/
        │   ├── value-objects/
        │   ├── factories/          # Solo cuando la construcción de la entidad lo justifique
        │   ├── services/           # Reglas de dominio que no caben en una entidad o abarcan varios agregados
        │   ├── errors/
        │   └── interfaces/         # Puertos de escritura (IPlanRepository)
        └── infrastructure/
            ├── repositories/       # MikroOrm<Agregado>Repository
            └── queries/            # Implementación de puertos de lectura (QueryBuilder)
```

- Crear cada subcarpeta **cuando se implemente** la funcionalidad que la necesita. Nunca carpetas vacías ni archivos ficticios para completar el árbol. **Excepción:** la implementación de persistencia y el contrato que la operación necesita se crean junto con su primer caso de uso, porque el ORM no se accede sin ese borde.
- Los puertos de escritura viven en `domain/interfaces/<nombre>.repository.interface.ts` y devuelven agregados. Los puertos de lectura viven junto a la operación que los consume, en `application/use-cases/<nombre>.query.interface.ts`, y devuelven proyecciones de aplicación: el contrato pertenece al consumidor y la implementación, siempre a `infrastructure/`. No se exige una interfaz por operación: un contrato existente puede servir a varias lecturas.
- **`application/` no importa nada de `@mikro-orm/*`.** Si un archivo de `application/` menciona `EntityRepository`, `EntityManager` o `QueryBuilder`, el límite está mal trazado.
- Las entidades de dominio llevan decoradores de MikroORM. Es una **concesión pragmática** decidida, no independencia del ORM: se declara así y no se promete pureza que no existe.
- `*.module.ts` es la composition root: registra controladores y providers, vincula contratos con implementaciones e importa/exporta lo necesario. Un `forwardRef()` recurrente delata límites mal trazados.

### 5.3 Catálogo: submódulos obligatorios

`src/modules/catalogo/` es un módulo agrupador. `ejercicios`, `categorias-ejercicio`, `materiales`, `unidades` y `objetivos-plan` tienen cada uno su subcarpeta con controller, casos de uso, DTO, entidad y módulo NestJS propios. `CatalogoModule` solo los agrupa e importa: no concentra controladores, CRUD ni repositorios.

**Por qué es una excepción y no ceremonia:** `docs/dominio/Analisis de dominio.md` define cada concepto de catálogo como **raíz de su propio agregado** —«cada una de las cuales es raíz de su propio agregado»—, y las historias de catálogo (`HU 2`, `HU 26`, `HU 27`, `HU 28` y `HU 29`) los especifican por separado. Un agregado, un submódulo, un cambio de OpenSpec.

El CRUD de catálogo no habilita una ruta distinta: cada comando y cada lectura se implementan como caso de uso, igual que en cualquier otro agregado; un Query Object se agrega solo cuando la lectura lo justifica. Lo que el submódulo propio aporta es aislamiento, no una capa de aplicación más delgada. La implementación de persistencia y el contrato que la operación usa **son obligatorios** en cada submódulo; lo que no se agrega sin motivo son `infrastructure/queries/`, `factories/`, `services/` y `external/`.

### 5.4 Responsabilidades y dependencias por capa

- **`presentation/`** — controllers, DTOs, validación de formato, guards y pipes de entrada. Traduce el DTO a un **Input de aplicación** y obtiene el actor autenticado. **No** decide reglas de negocio, no ejecuta consultas ORM y no define transacciones.
- **`application/`** — casos de uso para comandos y lecturas, y Query Objects cuando la consulta lo justifica; no existe `<capacidad>.service.ts`. Orquesta, comprueba permisos de operación, recupera agregados, invoca al dominio y coordina la unidad de trabajo **a través de sus puertos**. **No** esconde invariantes que pertenecen al agregado, no duplica reglas y no importa nada de `@mikro-orm/*`.
- **`domain/`** — entidades, raíces de agregado, value objects inmutables, invariantes, servicios y políticas de dominio, factories cuando aportan, puertos de escritura. **No** importa controllers, DTOs, `Request`, `Response`, `HttpException`, `EntityManager`, `EntityRepository` ni `QueryBuilder` en reglas puras.
- **`infrastructure/`** — implementa los puertos con MikroORM, ejecuta `QueryBuilder`, joins y proyecciones, traduce excepciones técnicas y contiene los adaptadores externos aprobados. Recibe y devuelve agregados, nunca DTOs ni Inputs. **No** decide reglas de negocio ni esconde efectos de dominio en consultas o subscribers.

**Dirección permitida:** `presentation → application → domain`, con `infrastructure` implementando los puertos de escritura y de lectura. El caso de uso y el Query Object, cuando exista, **nunca** ven `EntityRepository`, `EntityManager` ni `QueryBuilder`: reciben su puerto por constructor y lo vincula `*.module.ts`. Prohibido: `domain → presentation`, `domain → infrastructure`, que `application` importe `@mikro-orm/*` y que un módulo importe archivos internos de otro; la integración se realiza mediante proveedores exportados por sus respectivos módulos.

### 5.5 Ruta obligatoria por tipo de operación

| Operación | Implementación |
| --- | --- |
| Comando (crea, modifica, elimina o cambia estado) | `Controller → Input → UseCase → dominio → I<Agregado>Repository → MikroOrm<Agregado>Repository` |
| Consulta simple (una entidad o agregado, filtros fijos) | `Controller → UseCase → puerto de persistencia (existente o propio) → lector MikroORM → proyección → DTO` |
| Consulta compleja (varias entidades, filtros dinámicos, búsqueda, ordenamiento, paginación, agregaciones) | `Controller → UseCase` (o un Query Object si aporta valor) `→ puerto de persistencia`; si las operaciones del ORM no alcanzan, la implementación usa `QueryBuilder`, joins y proyección en `infrastructure/queries/` |
| Construcción de una entidad con datos de varias fuentes o con una invariante de armado | Factory en `domain/factories/` cuando la construcción lo justifica; si no, el constructor o un método estático de la raíz |
| Regla interna de un agregado (invariante, cálculo, transición de estado) | dentro de la entidad o de la raíz del agregado que la posee |
| Regla de negocio que involucra varios agregados, o que una entidad no puede resolver con su información | servicio de dominio en `domain/services/`, invocado por el `UseCase` |
| Coordinación de operaciones y límite transaccional | la decide el `UseCase` que la origina; la ejecuta la implementación del puerto (§5.7) |
| Lectura agregada (historial, récord, evolución, asistencias) | `UseCase` o `Query Object` con proyección; nunca hidratar agregados completos |
| Baja lógica o reactivación de un agregado | caso de uso propio del comando; nunca un `update` genérico (§6.3) |
| Integración externa | `UseCase → interfaz → adapter`, solo si está en el alcance aprobado |

La ruta no depende de la complejidad estimada: todo comando pasa por un caso de uso, incluido el CRUD de catálogo, y toda lectura tiene también una operación de aplicación con nombre; el Query Object se agrega solo cuando la consulta lo justifica. Un caso de uso puede ser fino; su valor es el nombre de la intención, el límite transaccional y el test que lo cubre.

Toda lectura puede resolverse con un caso de uso y el puerto de persistencia disponible. El **Query Object** y el **`QueryBuilder`** en `infrastructure/queries/` son opcionales: se usan solo cuando aportan valor, nunca por reflejo.

Las reglas propias de una entidad o agregado pertenecen a su dominio. Un servicio de dominio se justifica por una regla de negocio que no cabe en una entidad, no por coordinar varios agregados: el `UseCase` coordina, recupera información, invoca entidades o servicios de dominio y delimita la transacción sin redefinir la regla. Controllers, consultas y persistencia no definen ni duplican reglas de negocio.

**El borde de persistencia es obligatorio y no se evalúa caso por caso:** el acceso a datos siempre pasa por un contrato, y no se declara una interfaz nueva por operación si un contrato existente ya cubre lo necesario. Lo que no se admite es apilar capas por encima del puerto: `IPlanRepository -> PlanRepository -> MikroOrmPlanRepository` es el mismo defecto que un repositorio que solo reenvía a un adaptador.

Las interfaces llevan prefijo `I` y viven en `<nombre>.interface.ts`: `IPlanRepository` en `plan.repository.interface.ts` para escritura, e `IHistorialEntrenamientosReader` en `historial-entrenamientos.query.interface.ts` para lectura, junto a la operación que la consume. El prefijo es la convención de nombres del proyecto; lo que se evalúa es que el contrato tenga propósito y una sola implementación.

No crear `<capacidad>.service.ts` ni `*-query.service.ts` en `application/`, ni dos capas de delegación cuando una solo reenvía métodos a la otra.

### 5.6 Validación de entrada y frontera DTO → Input → entidad

- Los DTO son **clases** con decoradores de `class-validator`. Los tipos derivados (`PartialType`, `OmitType`, `PickType`, `IntersectionType`) salen de `@nestjs/mapped-types`.
- Un único `ValidationPipe` global en `src/main.ts` con `{ transform: true, whitelist: true }`. `whitelist` descarta toda propiedad no declarada en el DTO: es el mecanismo que hace cumplir §6.2, regla 3. El pipe se registra en `src/main.ts` en el cambio de OpenSpec que exponga el primer endpoint, cubierto por un test.
- `forbidNonWhitelisted` queda **desactivado** mientras §6.2, regla 3 establezca que esos campos «se ignoran». Si el equipo prefiere rechazar con 400, se activa la opción y se actualiza esa regla en el mismo cambio.
- El DTO valida formato y tipos; **no** valida reglas del gimnasio. Las invariantes son de dominio (§4) y no se duplican en el DTO ni en el controller.
- El DTO no se convierte en entidad de dominio ni se entrega a MikroORM.
- El **Input de aplicación** puede representarse como **tipo, interfaz o clase** según lo que la intención necesite. No se exige un archivo `<verbo>-<sustantivo>.input.ts` por operación: se crea solo cuando aporta claridad o reutilización.

**Tres artefactos, tres dueños.** No se reemplazan entre sí y ninguno se salta:

| Artefacto | Vive en | Valida | Conoce |
| --- | --- | --- | --- |
| **DTO HTTP** (`CreatePlanDto`) | `presentation/dto/` | Formato, tipos y campos obligatorios con `class-validator` | El contrato del transporte. Nada del dominio. |
| **Input de aplicación** (`CrearPlanInput`) | junto a su caso de uso: tipo, interfaz o clase; `<verbo>-<sustantivo>.input.ts` solo si se crea un archivo | Nada: ya viene validado | Lo que la intención necesita, con tipos del dominio cuando aplica. Sin decoradores de transporte ni dependencias de Nest/HTTP. |
| **Entidad o agregado** (`Plan`) | `domain/entities/` | Invariantes del gimnasio | Su propio estado y sus reglas. |

- El controller transforma el DTO en Input y lo pasa al `execute(input)`. El caso de uso no importa el DTO ni `class-validator`.
- Los puertos de escritura reciben **agregados**, nunca DTOs ni Inputs (§5.7).
- **Factory:** se incorpora solo cuando la construcción lo justifica —datos de varias fuentes antes de invocar la raíz, valores por defecto que deben aplicarse siempre, o un nombre de negocio propio de armado—. No se crea una Factory por entidad: el constructor con validaciones o un método estático nombrado de la raíz cubre la mayoría de los casos. Una Factory no puede saltear invariantes.

### 5.7 Transacciones, integridad y persistencia

- Usar el `EntityManager` contextual y la Unit of Work de MikroORM. No replicar `TypeOrmUnitOfWork` ni decoradores `@Transactional()` ad hoc de otros proyectos.
- El límite transaccional coincide con el caso de uso que coordina los cambios: él decide qué operaciones forman una unidad. La ejecución —`em.transactional(...)`— pertenece a la implementación del puerto, no a `application/`. Todas las escrituras relacionadas van en el mismo contexto.
- El caso de uso y, cuando exista, el Query Object reciben su **puerto** por constructor. `MikroOrmModule.forFeature([...])` se configura en el módulo NestJS (`*.module.ts`) y `@InjectRepository(Entity)` se usa en las clases concretas de `infrastructure/`; ninguno de los dos aparece en los casos de uso. El vínculo puerto → implementación se declara por token en `*.module.ts`.
- Si un comando modifica varios agregados, el puerto expone una **operación con nombre propio** (`crearConDesasignacion(...)`) y su implementación la envuelve en `em.transactional(...)`. No se inyecta `EntityManager` en `application/` para abrir la transacción a mano.
- Los métodos de escritura del puerto reciben y devuelven **agregados o entidades de dominio**. Recibir un DTO HTTP o un Input de aplicación es un error de diseño.
- No llamar `flush()` desde reglas puras del dominio.
- Una lectura previa `exists(...)` **no** garantiza una invariante concurrente: diseñar restricción, índice único parcial o bloqueo en PostgreSQL, y demostrarlo con prueba.
- Los cambios de esquema van solo por migraciones (ver §8), nunca por `schema:update` en producción.

### 5.8 Lecturas (Query Objects opcionales)

- Distinguir comandos de consultas es semántica, no infraestructura: **no** se agrega `@nestjs/cqrs`, `CommandBus`, `QueryBus` ni handlers.
- Toda lectura se implementa como una operación de aplicación en `application/use-cases/`: un caso de uso o, cuando la consulta lo justifica, un Query Object con su método `execute(input)`.
- Un **Query Object** en `application/use-cases/*.query.ts` es **opcional**: se agrega cuando la consulta lo justifica —varias entidades, filtros dinámicos, ordenamiento, paginación o agregaciones— y agrega criterios de búsqueda y filtrado a la intención. Una lectura simple no lo necesita.
- Cuando existe, el Query Object declara su **puerto de lectura** `I<Nombre>Reader` en `application/use-cases/<nombre>.query.interface.ts` e implementado en `infrastructure/queries/`, y devuelve una proyección (`<Nombre>Result`) si la lectura cruza agregados. No se crea un puerto nuevo por operación: si un contrato existente ya cubre la lectura, se reutiliza.
- `QueryBuilder`, joins, `LEFT JOIN` para relaciones opcionales, filtros dinámicos, agregaciones y proyección de campos viven en `infrastructure/queries/`. Una consulta simple no está obligada a usar `QueryBuilder`.
- El `QueryBuilder` **no cruza el puerto**: si aparece en `application/` o en un controller, el límite está mal trazado.
- Las consultas habituales **excluyen los registros dados de baja** (`deletedAt IS NULL`). El filtro lo aplica la implementación del puerto, no cada operación a mano; incluir el histórico se pide explícitamente en el Input o en el nombre de la consulta.
- Una lectura no muta estado ni llama `flush()`.
- Récord, última carga y estados temporales del plan se **calculan**; no se persisten como tablas o materializaciones sin justificación aprobada.
- Una proyección que evita cargar el agregado **conserva igual** las reglas de autorización.
- El detalle de optimización de consultas —N+1, joins innecesarios, límites, paginación y orden estable— vive en `docs/agreements/buenas_practicas.md` §5 y no se repite acá.

### 5.9 Antipatrones prohibidos

- Modelo anémico: entidad sin comportamiento y reglas duplicadas en servicios.
- God service o caso de uso con orquestación, HTTP, validación, consultas y SQL mezclados; `<capacidad>.service.ts` en `application/`.
- Interfaz **fuera** del borde de persistencia que envuelve a otro colaborador sin agregar comportamiento, o que existe sin implementación alternativa ni consumidor que la necesite. El puerto de persistencia **no** entra en este antipatrón: es el borde obligatorio y su implementación MikroORM es la única capa de adaptación admitida. Sí es antipatrón apilar `IPlanRepository -> PlanRepository -> MikroOrmPlanRepository`.
- Inyectar `EntityRepository`, `EntityManager` o `QueryBuilder` en `application/`, en un controller o en una regla de dominio.
- Entregar un DTO HTTP o un Input de aplicación a un repositorio, a un puerto o a MikroORM.
- Crear una Factory por entidad, o una Factory que esquiva las invariantes del constructor.
- Filtrar la baja lógica a mano consulta por consulta en lugar de fijarla en la implementación del puerto de lectura.
- Crear un Query Object, una interfaz o una carpeta nueva por cada lectura cuando un caso de uso y un contrato existente ya resuelven la operación.
- `try/catch` defensivo que traga la causa, registra y devuelve un resultado vacío, o se repite en cada método sin poder hacer nada distinto de propagar.
- Reglas de negocio en controller o DTO.
- Servicio de dominio por coordinación: crearlo porque la operación toca varios agregados, sin una regla de negocio que justifique la abstracción.
- Regla de negocio duplicada en una lectura: reescribir en la proyección una fórmula o criterio que el dominio ya expresa.
- Transacciones por repositorio cuando el caso de uso completo debe ser atómico.
- Persistir datos que el negocio decidió derivar.
- Exponer entidades ORM con relaciones sensibles o ciclos de serialización.
- Usar subscribers del ORM como escondite de reglas de negocio.
- Un `CatalogoController` único o un submódulo de catálogo que concentre los cinco agregados.

## 6. Auditoría de entidades

Toda entidad persistente registra **quién** creó, editó y eliminó cada fila. Es un requisito transversal del modelo: no se decide entidad por entidad ni caso de uso por caso de uso. El detalle de implementación (base abstracta, suscriptor sobre el `EntityManager`, interceptor) es una decisión de diseño del cambio de OpenSpec que introduzca la primera entidad; lo que no se negocia son los campos ni las reglas de esta sección.

Esta convención se incorporó por decisión explícita del usuario como documentación: no requiere un cambio de OpenSpec propio, pero obliga a que todo cambio posterior que cree o modifique una entidad la cumpla.

### 6.1 Campos obligatorios

Toda entidad hereda estas seis columnas. Las propiedades se escriben en camelCase; la estrategia de nombres por defecto de MikroORM las mapea a snake_case en la base.

| Propiedad | Tipo | Alta | Edición | Baja |
| --- | --- | --- | --- | --- |
| `createdAt` | `Date` | requerido | — | — |
| `createdById` | `string` | requerido | — | — |
| `updatedAt` | `Date` | requerido | requerido | — |
| `updatedById` | `string` | requerido | requerido | — |
| `deletedAt` | `Date \| null` | `null` | `null` | requerido |
| `deletedById` | `string \| null` | `null` | `null` | requerido |

- En el alta, `updatedAt` y `updatedById` se inicializan con los mismos valores que `createdAt` y `createdById`: toda fila tiene un último responsable, incluso antes de la primera edición.
- `deletedAt` y `deletedById` en `null` significan "la fila no está dada de baja". Se completan juntos o no se completa ninguno.
- `createdById`, `updatedById` y `deletedById` referencian al **actor** (`Usuario`) por identificador, nunca por nombre ni email: un nombre suelto no es auditable.

### 6.2 Reglas de implementación

1. **Un solo lugar.** Los seis campos se completan en la base auditable y en el mecanismo de persistencia, nunca a mano en cada caso de uso ni en cada controlador.
2. **El actor sale del contexto de autenticación.** Jamás del body, del query string ni de un DTO. Si no hay actor identificado, la operación se rechaza; no se inventa un usuario "sistema" salvo en procesos internos explícitamente declarados.
3. **El cliente no puede escribirlos.** Los DTOs de entrada no exponen estos campos y, si llegan en el payload, se ignoran.
4. **Nada de escrituras que salteen el mecanismo.** `updateMany`, `nativeUpdate` o SQL crudo no pasan por el suscriptor y dejan la auditoría desactualizada. Si un caso de uso los necesita, actualiza `updatedAt` y `updatedById` explícitamente dentro de la misma transacción.
5. **UTC.** Las fechas se persisten en UTC (`timestamptz`) y se serializan en ISO-8601 con zona.
6. **La auditoría no se edita.** Ningún endpoint ni caso de uso modifica estos campos después de escritos; `createdAt` y `createdById` son inmutables por definición.

### 6.3 Eliminación y trazabilidad

- **Baja lógica por defecto.** Cuando la entidad conserva historial o está referenciada por otras (alumno, profesor, plan, entrenamiento), eliminar significa completar `deletedAt` y `deletedById` y actualizar `updatedAt` y `updatedById` en la misma escritura. La fila permanece y con ella queda el rastro de quién la dio de baja.
- **Exclusión en las consultas habituales.** Los registros dados de baja no aparecen en listados, búsquedas, reportes ni validaciones de existencia. El filtro `deletedAt IS NULL` lo aplica la implementación del puerto de lectura (§5.8), no cada consulta a mano; incluir el histórico se pide explícitamente. Las comprobaciones de negocio también excluyen: no se crea un plan sobre un alumno dado de baja.
- **Borrado físico** solo en catálogos sin referencias y cuando la historia no importa (por ejemplo, una máquina nunca usada, `HU 28`). Al borrar la fila desaparece su auditoría: si el dominio exige conservarla, la baja debe ser lógica.
- **Índices únicos sobre entidades con baja lógica:** un `UNIQUE` plano queda bloqueado por la fila dada de baja. Usar índices parciales (`WHERE deleted_at IS NULL`).
- **Reactivación explícita.** Volver a poner `deletedAt` y `deletedById` en `null` es un caso de uso del dominio con nombre propio, no un update genérico, y actualiza `updatedAt` y `updatedById` como cualquier otra edición. La reactivación conserva el historial previo.

## 7. Testing y verificación

La estrategia —qué se prueba por capa, nivel mínimo, prioridades, aislamiento, cobertura esperada y trazabilidad de casos— está en `docs/agreements/testing.md` y se aplica al escribir o modificar pruebas. Esta sección fija los comandos y las reglas operativas que la complementan.

- Tests unitarios colocados junto al código, con sufijo `.spec.ts`.
- Tests e2e en `test/`, con sufijo `.e2e-spec.ts`.
- Todo cambio de comportamiento sigue test-first: primero un test que falla (RED), luego la implementación (GREEN), luego refactor.
- Cada test debe verificar todos los efectos observables de la regla (salida, error, datos persistidos) y pasar por la interfaz pública.
- Toda entidad nueva cubre alta, edición y baja verificando los seis campos de auditoría (§6.1) a través de la interfaz pública, incluido que el actor provenga del contexto de autenticación y no del payload.
- **Qué probar por capa:** el detalle y las prioridades están en `docs/agreements/testing.md` §3. En resumen: dominio → invariantes del agregado; aplicación → autorización del actor, solapamientos, atomicidad y rollback, con un doble del puerto que verifique el Input y el agregado; persistencia → restricciones de PostgreSQL, índices declarados en migraciones, concurrencia, auditoría y baja lógica, contra base real; consultas → filtros de autorización, exclusión de registros dados de baja, filtros dinámicos, `LEFT JOIN` sobre relaciones opcionales, récords calculados, orden estable y paginación; HTTP → DTO, Input, guards, códigos y contratos de error.
- No dar por probada la integridad transaccional haciendo mocks del ORM. En aplicación se usa un doble del puerto; la integridad se prueba contra PostgreSQL real. Si PostgreSQL real no está disponible, se reporta el bloqueo de infraestructura y se deja el test sin ejecutar: nunca se declara verde ni se sustituye por un mock, un `skip` o una aserción vacía.
- Antes de declarar terminada una tarea: `yarn typecheck && yarn lint && yarn test`.
- Ejecutar `yarn test:e2e` cuando el cambio toque HTTP, base de datos o configuración de la aplicación.
- No desactivar ni saltear tests para "dejar todo en verde". Si un test falla por una causa preexistente, documentarlo con evidencia.

## 8. Base de datos y migraciones

- Los cambios de esquema son de alto riesgo: requieren un cambio de OpenSpec con su `design.md` y una estrategia de rollback.
- Toda migración que crea o altera una entidad incluye las seis columnas de auditoría (§6.1). Su nulabilidad se define en el `design.md` del cambio; una vez que exista la capacidad de identidad, las columnas de alta y edición son `NOT NULL`.
- Toda tabla cuenta con al menos un índice, y el que PostgreSQL genera para la clave primaria alcanza. Los índices adicionales sobre claves foráneas y sobre campos usados con frecuencia en búsquedas, filtros y ordenamientos se evalúan según las consultas reales de la capacidad y el rendimiento esperado, no por una lista genérica de columnas candidatas.
- Los índices se definen en las migraciones de MikroORM, igual que el resto del esquema; un índice derivado de decoradores o del snapshot se incorpora a la migración correspondiente y nunca se crea por `schema:update`.
- No crear índices redundantes o innecesarios: los que repiten el prefijo de otro índice, duplican lo que ya garantiza un `UNIQUE` o no tienen consulta que los justifique incrementan el costo de `INSERT`, `UPDATE` y `DELETE`. Los índices únicos parciales de §6.3 no se reemplazan por índices planos.
- Nunca editar una migración ya aplicada. Crear una nueva.
- Nunca ejecutar operaciones destructivas (`DROP`, `TRUNCATE`, borrado de datos) sin aprobación explícita del usuario.
- Las credenciales viven en `.env` (ignorado por git). Nunca commitear `.env` ni secretos.

## 9. Conventional Commits

Todos los commits siguen [Conventional Commits](https://www.conventionalcommits.org/). Los mensajes se escriben en inglés, en modo imperativo.

### 9.1 Formato

```text
<type>(<scope>): <subject>

<body>

<footer>
```

- `subject`: imperativo, minúsculas, sin punto final, encabezado total ≤ 72 caracteres.
- `body`: qué y por qué, no cómo; líneas ≤ 72 caracteres.
- `footer`: referencias y breaking changes.

### 9.2 Tipos permitidos

| Tipo | Uso |
| --- | --- |
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un defecto |
| `docs` | Documentación, incluidos artefactos OpenSpec |
| `style` | Formato sin cambio de comportamiento |
| `refactor` | Cambio interno sin alterar comportamiento |
| `perf` | Mejora de rendimiento |
| `test` | Tests nuevos o corregidos |
| `build` | Build, dependencias o herramientas |
| `ci` | Configuración de integración continua |
| `chore` | Tareas de mantenimiento |
| `revert` | Reversión de un commit anterior |

### 9.3 Scopes

Usar un scope corto que identifique el área afectada. Ejemplos: `api`, `domain`, `db`, `auth`, `config`, `openspec`, `deps`, `test`.

### 9.4 Reglas

- Un commit = una unidad lógica de trabajo. No mezclar refactors no relacionados ni cambios de formato masivos.
- El código, sus tests y su documentación van en el mismo commit.
- Todo commit que implementa un cambio de OpenSpec incluye el footer `Refs: openspec/changes/<change-name>`.
- El commit de archivado usa `chore(openspec): archive <change-name>`.
- Los breaking changes se marcan con `!` en el tipo/scope y un footer `BREAKING CHANGE: <descripción>`.
- Sin atribución de IA: nunca agregar `Co-Authored-By` ni trailers equivalentes.
- No hacer `push`, abrir PR ni mergear sin pedido explícito del usuario.

### 9.5 Ejemplos

```text
feat(domain): add weekly prescription value object

Refs: openspec/changes/add-plan-builder
```

```text
fix(api): reject duplicate exercise in same session

Refs: openspec/changes/register-training
```

```text
test(domain): cover duplicate exercise name
```

```text
docs(openspec): add proposal for plan builder

Refs: openspec/changes/add-plan-builder
```

```text
feat(db)!: rename plan date columns

BREAKING CHANGE: migrations and queries must use starts_at/ends_at.
```

## 10. Git y revisión

El repositorio sigue **GitFlow** adaptado al flujo de OpenSpec. `main` conserva las versiones estables y `develop` integra el trabajo en desarrollo; ninguna de las dos recibe commits directos.

- **`main`:** versiones estables. Solo recibe merges de `develop` y de `hotfix/*`.
- **`develop`:** integración del trabajo en desarrollo. Es la rama base de `feature/*` y `fix/*`.
- **`feature/<change-name>`:** funcionalidad, creada desde `develop` y devuelta a `develop` mediante PR. `<change-name>` es el nombre en kebab-case del cambio de OpenSpec, así la rama y el cambio comparten identidad (`feature/add-plan-builder`).
- **`fix/<change-name>`:** corrección durante el desarrollo, creada desde `develop` y devuelta a `develop` mediante PR. Si altera comportamiento, necesita su cambio de OpenSpec igual que una funcionalidad.
- **`hotfix/<nombre>`:** incidencia urgente sobre una versión estable. Nace de `main` y se integra a `main` y a `develop`, para que la corrección no se pierda en la próxima versión. No exime del flujo de OpenSpec ni de las verificaciones de §7.
- Mantener cada rama acotada a su cambio y sincronizada con su rama base antes de abrir el PR.
- Antes de commitear: `yarn typecheck && yarn lint && yarn test`.
- Revisar `git diff` completo antes de cada commit; no commitear archivos generados ni secretos.
- No usar `--no-verify` para saltear hooks.
- **Trazabilidad en el PR:** todo Pull Request declara la historia de usuario que implementa en una línea `HU: <n>` y las reglas de negocio afectadas en una línea `Reglas: RN-01, RN-05`, en la sección *Trazabilidad* de `.github/pull_request_template.md`. El gate de CI (`scripts/check-rules.mjs`) exige que cada regla declarada tenga al menos un test que pase, identificado en el nombre del test con el tag `[RN-nn]`. La línea `HU:` es la que permite calcular el Lead Time, que termina con el merge del PR a `develop`. Con `workflow_dispatch` y `enforce_all_rules` se exige el 100% de las 42 reglas antes del despliegue final.
- El push, la creación de PR y el merge son decisiones del usuario.

## 11. CodeGraph

El proyecto tiene un índice de CodeGraph en `.codegraph/` (datos locales, no se commitean).

- Para preguntas estructurales (arquitectura, flujos, impacto de un cambio, referencias), usar `codegraph_explore` o `codegraph explore` antes de búsquedas amplias con `grep`/`find`.
- Después de editar código, ejecutar `codegraph sync -q .` antes de confiar en consultas del CLI.
- Cada worktree necesita su propio índice; nunca copiar ni symlinkear `.codegraph/`.

## 12. Seguridad

- No leer ni exponer `.env`, credenciales, claves ni tokens.
- No ejecutar comandos remotos (`ssh`, `scp`, `rsync`) ni publicar artefactos sin autorización explícita.
- Ante una operación destructiva o irreversible, detenerse y pedir aprobación.
