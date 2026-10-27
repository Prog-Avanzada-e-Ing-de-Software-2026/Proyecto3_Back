# AGENTS.md — proyecto3_back

Guía operativa para agentes de IA en este repositorio. La documentación y los artefactos de OpenSpec se escriben en español; el código, los identificadores técnicos y los mensajes de commit se escriben en inglés.

## 1. Contexto del proyecto

Backend de una aplicación de gestión de gimnasio: los profesores arman planes de entrenamiento y los alumnos registran sus entrenamientos. Está construido con NestJS 12, TypeScript estricto (ESM), MikroORM 7 y PostgreSQL, y se prueba con Vitest 4, oxlint y Prettier sobre Yarn 4.18.1 y Node 24. La documentación de dominio vive en `docs/preliminar/`: es preliminar, puede cambiar y se puede corregir y refinar. Todo cambio que altere comportamiento debe reflejarse además en un cambio de OpenSpec. Mantener el **lenguaje ubicuo** del dominio: no traducir ni renombrar sus términos en el código sin justificación.

## 2. Comandos

| Objetivo | Comando |
| --- | --- |
| Instalar dependencias | `yarn install` |
| Desarrollo con watch | `yarn start:dev` |
| Build | `yarn build` |
| Typecheck | `yarn typecheck` |
| Lint | `yarn lint` |
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
| 5 | Implementar | `/opsx-apply <name>` o skill `openspec-apply-change` | Todas las tareas `[x]` y suites en verde |
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

Solo los cambios sin efecto en comportamiento, contratos, esquema o código pueden hacerse sin un cambio de OpenSpec. Quedan comprendidos: typos y aclaraciones en `docs/preliminar/`, y la documentación de convenciones (`AGENTS.md` y `docs/agreements/`), que no altera comportamiento por sí misma. La excepción debe declararse explícitamente en la respuesta. Ante la duda, crear el cambio.

## 4. Convenciones de código

- **ESM:** `package.json` tiene `"type": "module"` y `tsconfig` usa `nodenext`. Todo import relativo lleva extensión `.js` (`import { AppModule } from './app.module.js'`).
- **TypeScript estricto:** no relajar `strict` ni usar `@ts-ignore` sin justificación escrita.
- **NestJS:** un módulo por capacidad de negocio. La estructura de carpetas, las capas y las dependencias permitidas están en §5; no se repiten acá.
- **Validación de entrada:** DTO como clase con `class-validator` y `ValidationPipe` global. Detalle en §5.6.
- **MikroORM:**
  - Las entidades deben llamarse `*.entity.ts` (el config las busca con `./src/**/*.entity.ts`).
  - Usar los decoradores legacy de `@mikro-orm/decorators/legacy`, consistentes con el `ReflectMetadataProvider` configurado.
  - Las migraciones viven en `src/migrations`.
  - Toda entidad persistente hereda de la base auditable (ver §6); los campos de auditoría no se declaran entidad por entidad.
- **Reglas de dominio:** se validan dentro de la raíz del agregado, no en controladores ni en DTOs. Un VO es inmutable; una entidad conserva identidad.
- **Errores de dominio:** no exponer detalles de persistencia en la API. Los errores semánticos se traducen a HTTP en el límite de presentación, sin filtrar trazas ni detalles internos.
- **Formato:** Prettier (`singleQuote`, `trailingComma: all`) y oxlint. No introducir reglas nuevas de lint sin justificarlo.

## 5. Arquitectura y límites de módulos

Fundamento y justificación de esta sección: `docs/agreements/arquitectura.md`. Ante discrepancia, manda `AGENTS.md`.

### 5.1 Identidad arquitectónica y regla de simplicidad

- **Estilo:** monolito modular. Una aplicación, un despliegue, módulos NestJS cohesionados por capacidad de negocio.
- **Partición:** por capacidad primero y capa después; nunca por carpetas globales de `controllers`, `services` y `repositories`.
- **Capas internas:** presentación, aplicación, dominio e infraestructura.
- **Modelado:** DDD pragmático — lenguaje ubicuo, raíces de agregado, entidades, value objects e invariantes. El lenguaje ubicuo está en `docs/preliminar/Analisis de dominio.md` y no se traduce ni renombra.
- **Un solo bounded context:** «Entrenamiento». Dividir el código en módulos NestJS **no** crea contextos adicionales. No proponer microservicios, event bus, CQRS formal ni event sourcing sin requisitos documentados y aprobados.
- **Contratos e implementaciones:** selectivos. Una interfaz propia se justifica por desacoplamiento real, testabilidad, varios consumidores o una regla compleja; nunca por plantilla.

**Regla rectora:** aplicar el patrón más simple que proteja la regla y permita probarla. Un caso de uso fino no es ceremonia: es el nombre de la intención, el límite transaccional y el test asociado. Encadenar interfaces, repositorios delegadores, adaptadores y handlers sin necesidad concreta sí es un antipatrón, no rigor.

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
        │   ├── use-cases/          # Un caso de uso por comando
        │   └── queries/            # Una query por lectura
        ├── domain/
        │   ├── entities/
        │   ├── value-objects/
        │   ├── services/           # Servicios de dominio, no de aplicación
        │   ├── errors/
        │   └── interfaces/         # Contratos del borde (IPlanRepository)
        └── infrastructure/
            └── repositories/
```

- Crear cada subcarpeta **cuando se implemente** la funcionalidad que la necesita. Nunca carpetas vacías ni archivos ficticios para completar el árbol.
- Las entidades de dominio llevan decoradores de MikroORM. Es una **concesión pragmática** decidida, no independencia del ORM: se declara así y no se promete pureza que no existe.
- `*.module.ts` es la composition root: registra controladores y providers, vincula contratos con implementaciones e importa/exporta lo necesario. Un `forwardRef()` recurrente delata límites mal trazados.

### 5.3 Catálogo: submódulos obligatorios

`src/modules/catalogo/` es un módulo agrupador. `ejercicios`, `categorias-ejercicio`, `materiales`, `unidades` y `objetivos-plan` tienen cada uno su subcarpeta con controller, casos de uso, DTO, entidad y módulo NestJS propios. `CatalogoModule` solo los agrupa e importa: no concentra controladores, CRUD ni repositorios.

**Por qué es una excepción y no ceremonia:** `docs/preliminar/Analisis de dominio.md:94` define cada concepto de catálogo como **raíz de su propio agregado**, y `US-01`..`US-05` los especifican por separado. Un agregado, un submódulo, un cambio de OpenSpec.

El CRUD de catálogo no habilita una ruta distinta: cada comando es un caso de uso y cada lectura una query, igual que en cualquier otro agregado. Lo que el submódulo propio aporta es aislamiento, no una capa de aplicación más delgada. No agregar `domain/interfaces/` ni `infrastructure/repositories/` sin motivo.

### 5.4 Responsabilidades y dependencias por capa

- **`presentation/`** — controllers, DTOs, validación de formato, guards y pipes de entrada. Traduce DTO a parámetros de aplicación y obtiene el actor autenticado. **No** decide reglas de negocio, no ejecuta consultas ORM y no define transacciones.
- **`application/`** — un caso de uso por comando y una query por lectura; no existe `<capacidad>.service.ts`. Orquesta, comprueba permisos de operación, recupera agregados, invoca al dominio y coordina transacciones. **No** esconde invariantes que pertenecen al agregado ni duplica reglas.
- **`domain/`** — entidades, raíces de agregado, value objects inmutables, invariantes, servicios y políticas de dominio, interfaces propias cuando aporten. **No** importa controllers, DTOs, `Request`, `Response`, `HttpException` ni `EntityManager` en reglas puras.
- **`infrastructure/`** — implementaciones MikroORM, consultas optimizadas y adaptadores externos aprobados. **No** decide reglas de negocio ni esconde efectos de dominio en consultas o subscribers.

**Dirección permitida:** `presentation → application → domain`, con `infrastructure` implementando las interfaces de dominio o aplicación. El caso de uso accede a `EntityRepository` de MikroORM directamente por defecto. Prohibido: `domain → presentation`, `domain → infrastructure`, y que un módulo importe archivos internos de otro; la integración se realiza mediante proveedores exportados por sus respectivos módulos.

### 5.5 Ruta obligatoria por tipo de operación

| Operación | Implementación obligatoria |
| --- | --- |
| Comando (crea, modifica, elimina o cambia estado) | `Controller → UseCase → dominio → persistencia` |
| Consulta (solo lectura) | `Controller → Query → proyección → DTO` |
| Regla entre agregados o límite transaccional | dentro del `UseCase` que la origina |
| Lectura agregada (historial, récord, evolución, asistencias) | `Query` con proyección; nunca hidratar agregados completos |
| Integración externa | `UseCase → interfaz → adapter`, solo si está en el alcance aprobado |

La ruta no depende de la complejidad estimada: todo comando pasa por un caso de uso, incluido el CRUD de catálogo, y toda lectura por una query. Un caso de uso puede ser fino; su valor es el nombre de la intención, el límite transaccional y el test que lo cubre.

Un caso de uso persiste con `@InjectRepository(Entity)` por defecto. Solo agrega una interfaz en `domain/interfaces/` cuando haya varios consumidores, integración externa o aislamiento necesario para probar la regla. **Un caso de uso no obliga a crear una interfaz.**

Las interfaces llevan prefijo `I` y viven en `<nombre>.interface.ts`: `IPlanRepository` en `plan.repository.interface.ts`. El prefijo es la convención de nombres del proyecto, no el defecto: lo que se evalúa es si la interfaz tiene propósito.

No crear `<capacidad>.service.ts` ni `*-query.service.ts` en `application/`, ni dos capas de delegación cuando una solo reenvía métodos a la otra.

### 5.6 Validación de entrada (DTO)

- Los DTO son **clases** con decoradores de `class-validator`. Los tipos derivados (`PartialType`, `OmitType`, `PickType`, `IntersectionType`) salen de `@nestjs/mapped-types`.
- Un único `ValidationPipe` global en `src/main.ts` con `{ transform: true, whitelist: true }`. `whitelist` descarta toda propiedad no declarada en el DTO: es el mecanismo que hace cumplir §6.2, regla 3. Las librerías ya están instaladas, pero el pipe **todavía no está registrado**: lo registra el primer cambio de OpenSpec que exponga un endpoint y lo cubra con un test.
- `forbidNonWhitelisted` queda **desactivado** mientras §6.2, regla 3 establezca que esos campos «se ignoran». Si el equipo prefiere rechazar con 400, se activa la opción y se actualiza esa regla en el mismo cambio.
- El DTO valida formato y tipos; **no** valida reglas del gimnasio. Las invariantes son de dominio (§4) y no se duplican en el DTO ni en el controller.
- El DTO no se convierte en entidad de dominio ni se entrega a MikroORM.

### 5.7 Transacciones, integridad y persistencia

- Usar el `EntityManager` contextual y la Unit of Work de MikroORM. No replicar `TypeOrmUnitOfWork` ni decoradores `@Transactional()` ad hoc de otros proyectos.
- El límite transaccional vive en el caso de uso que coordina los cambios (`em.transactional(...)`). Todas las escrituras relacionadas van en el mismo contexto.
- Alcanza `@InjectRepository(Entity)` dentro del caso de uso. Interfaces propias solo con beneficio comprobable, enlazadas por token en `*.module.ts`.
- No llamar `flush()` desde reglas puras del dominio.
- Una lectura previa `exists(...)` **no** garantiza una invariante concurrente: diseñar restricción, índice único parcial o bloqueo en PostgreSQL, y demostrarlo con prueba.
- Los cambios de esquema van solo por migraciones (ver §8), nunca por `schema:update` en producción.

### 5.8 Modelos de lectura

- Distinguir comandos de consultas es semántica, no infraestructura: **no** se agrega `@nestjs/cqrs`, `CommandBus`, `QueryBus` ni handlers.
- Las lecturas que cruzan agregados van en `application/queries/*.query.ts` con proyección de MikroORM.
- Una query no muta estado ni llama `flush()`.
- Récord, última carga y estados temporales del plan se **calculan**; no se persisten como tablas o materializaciones sin justificación aprobada.
- Una proyección que evita cargar el agregado **conserva igual** las reglas de autorización.
- Evitar N+1, relaciones innecesarias y consultas sin límite: seleccionar campos y paginar.

### 5.9 Antipatrones prohibidos

- Modelo anémico: entidad sin comportamiento y reglas duplicadas en servicios.
- God service o caso de uso con orquestación, HTTP, validación, consultas y SQL mezclados; `<capacidad>.service.ts` en `application/`.
- Interfaz sin propósito: envuelve el `EntityRepository` sin agregar comportamiento, o existe sin implementación alternativa ni consumidor que la necesite, seguida de un adaptador que solo reenvía métodos. El prefijo `I` es convención de nombres (`IPlanRepository`), no un pase libre.
- Reglas de negocio en controller o DTO.
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

- **Baja lógica por defecto.** Cuando la entidad conserva historial o está referenciada por otras (alumno, profesor, plan, entrenamiento), eliminar significa completar `deletedAt` y `deletedById` y excluirla de las consultas. La fila permanece y con ella queda el rastro de quién la dio de baja.
- **Borrado físico** solo en catálogos sin referencias y cuando la historia no importa (por ejemplo, una máquina nunca usada, `US-01`). Al borrar la fila desaparece su auditoría: si el dominio exige conservarla, la baja debe ser lógica.
- **Índices únicos sobre entidades con baja lógica:** un `UNIQUE` plano queda bloqueado por la fila dada de baja. Usar índices parciales (`WHERE deleted_at IS NULL`).
- **Reactivación explícita.** Volver a poner `deletedAt` en `null` es un caso de uso del dominio, no un update genérico, y actualiza `updatedAt` y `updatedById` como cualquier otra edición.

## 7. Testing y verificación

- Tests unitarios colocados junto al código, con sufijo `.spec.ts`.
- Tests e2e en `test/`, con sufijo `.e2e-spec.ts`.
- Todo cambio de comportamiento sigue test-first: primero un test que falla (RED), luego la implementación (GREEN), luego refactor.
- Cada test debe verificar todos los efectos observables de la regla (salida, error, datos persistidos) y pasar por la interfaz pública.
- Toda entidad nueva cubre alta, edición y baja verificando los seis campos de auditoría (§6.1) a través de la interfaz pública, incluido que el actor provenga del contexto de autenticación y no del payload.
- **Qué probar por capa:** dominio → invariantes del agregado (días permitidos, bloques obligatorios, series válidas, entrenamiento finalizado inmutable); aplicación → autorización del actor, solapamientos, atomicidad y rollback; persistencia → restricciones de PostgreSQL, concurrencia y auditoría; consultas → filtros de autorización, récords calculados y paginación; HTTP → DTO, guards, códigos y contratos de error.
- No dar por probada la integridad transaccional haciendo mocks del ORM. Si un test requiere PostgreSQL real y no está disponible, se reporta como omitido, nunca como verde.
- Antes de declarar terminada una tarea: `yarn typecheck && yarn lint && yarn test`.
- Ejecutar `yarn test:e2e` cuando el cambio toque HTTP, base de datos o configuración de la aplicación.
- No desactivar ni saltear tests para "dejar todo en verde". Si un test falla por una causa preexistente, documentarlo con evidencia.

## 8. Base de datos y migraciones

- Los cambios de esquema son de alto riesgo: requieren un cambio de OpenSpec con su `design.md` y una estrategia de rollback.
- Toda migración que crea o altera una entidad incluye las seis columnas de auditoría (§6.1). Su nulabilidad se define en el `design.md` del cambio; una vez que exista la capacidad de identidad, las columnas de alta y edición son `NOT NULL`.
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

- La rama principal del repositorio es `main`. Cada cambio de OpenSpec se implementa en una rama `change/<change-name>` creada desde `main`; no commitear directamente sobre `main`.
- Antes de commitear: `yarn typecheck && yarn lint && yarn test`.
- Revisar `git diff` completo antes de cada commit; no commitear archivos generados ni secretos.
- No usar `--no-verify` para saltear hooks.
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
