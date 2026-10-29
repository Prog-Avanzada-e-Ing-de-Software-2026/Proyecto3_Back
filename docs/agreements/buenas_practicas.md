# Proyecto 3 — Guía de desarrollo y buenas prácticas del Backend

> **Destinatarios:** equipo de desarrollo y agentes de IA que trabajen en `Proyecto3_Back`.
>
> **Alcance:** NestJS + TypeScript + MikroORM + PostgreSQL. Esta guía **adapta** los principios generales, las prácticas backend y Git de *Buenas practicas final.pdf*, complementándolos con la arquitectura y las reglas operativas ya documentadas para el backend.
>
> **Estado:** documento de orientación vigente, subordinado a `AGENTS.md` y a `docs/agreements/arquitectura.md`. No sustituye la especificación OpenSpec aprobada, los contratos ni el código vigente, y no autoriza por sí solo cambios, commits, push, PR, merges ni despliegues.
>
> **Decisión de Git adoptada:** el equipo adoptó **GitFlow** (`main`, `develop`, `feature/*`, `fix/*`, `hotfix/*`). El modelo anterior de ramas `change/<change-name>` desde `main` **queda retirado**. El procedimiento operativo vigente vive en `AGENTS.md` §10, y esta guía lo desarrolla en §8; ante discrepancia manda `AGENTS.md`.

## 1. Principios de trabajo

- **KISS:** priorizar soluciones legibles y sencillas.
- **YAGNI:** no implementar infraestructura o abstracciones para necesidades no aprobadas.
- **DRY:** centralizar reglas y conocimiento repetidos cuando realmente deban conservarse consistentes.
- **SRP y SoC:** una responsabilidad principal por componente y límites claros entre presentación, aplicación, dominio y persistencia.
- **Encapsulamiento:** exponer operaciones de negocio en vez de permitir cambios arbitrarios del estado interno.
- **Bajo acoplamiento / alta cohesión:** módulos centrados en capacidades de negocio, con dependencias controladas.
- **Abstracciones justificadas:** los **puertos de persistencia son obligatorios** en los casos de uso —comandos y lecturas— y en los Query Objects cuando existan (§2.1): acceden a los datos a través de un contrato y nunca del ORM. No se exige una interfaz independiente por operación. Cualquier otra interfaz, adaptador o patrón se añade solo si resuelve un problema concreto.
- **Entidades con comportamiento:** una entidad no es solo un contenedor de atributos; expresa las reglas que mantienen sus invariantes.
- **Pruebas trazables:** cada test describe el comportamiento observado e identifica el caso de prueba formal cuando exista.

Evitar tanto el **modelo anémico** como el **servicio que concentra todas las reglas**. No introducir ceremonias arquitectónicas si un caso de uso y las operaciones del dominio resuelven correctamente el requisito.

## 2. Arquitectura y distribución de responsabilidades

La arquitectura específica definida en `docs/agreements/arquitectura.md` y `AGENTS.md` es un **monolito modular**, particionado **por capacidad de negocio y luego por capas**, con DDD pragmático y abstracciones selectivas. Esta sección resume el criterio práctico; el fundamento y el detalle están en esos documentos. La separación semántica de comandos y consultas **no obliga a usar `@nestjs/cqrs`**.

```text
src/modules/<capacidad>/
├── <capacidad>.module.ts              # Composición NestJS
├── presentation/
│   ├── <capacidad>.controller.ts
│   └── dto/
├── application/
│   └── use-cases/                     # Casos de uso: comandos y lecturas
│       ├── <verbo>-<sustantivo>.use-case.ts
│       ├── <verbo>-<sustantivo>.input.ts   # Entrada de aplicación
│       ├── <nombre>.query.ts               # Opcional: Query Object para lecturas complejas
│       ├── <nombre>.query.interface.ts     # Puerto de lectura, si se crea
│       └── <nombre>.result.ts              # Proyección, si corresponde
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── factories/                     # Solo cuando aporten valor
│   ├── services/                      # Solo reglas de dominio que no caben en entidad
│   └── interfaces/                    # Puertos de escritura (IPlanRepository)
└── infrastructure/
    ├── repositories/                  # Implementación MikroORM de escritura
    └── queries/                       # Consultas especializadas (proyecciones, joins)
```

Árbol **conceptual**, no obligación de crear subcarpetas vacías. En el catálogo, la arquitectura específica dispone submódulos para cada concepto catalogable; se respetará esa decisión cuando se implementen.

| Capa | Responsabilidad | No debe hacer |
| --- | --- | --- |
| `presentation/` | recibir HTTP, DTO, validar formato, identificar actor, construir el Input y delegar | lógica de negocio, consultas ORM o transacciones |
| `application/` | coordinar casos de uso (comandos y lecturas) y, cuando existan, Query Objects; permisos operativos y la unidad de trabajo **a través de sus puertos** | duplicar invariantes de entidades; importar `@mikro-orm/*` |
| `domain/` | entidades, agregados, VOs, reglas de negocio y puertos de escritura | depender de HTTP o de detalles técnicos en sus reglas puras |
| `infrastructure/` | implementar los puertos con MikroORM, consultas especializadas y traducción de excepciones técnicas | decidir reglas del dominio por su cuenta; recibir DTO |

**Comando:** `Controller → Input → UseCase → dominio → I<Agregado>Repository → MikroOrm<Agregado>Repository`.

**Consulta:** `Controller → UseCase → puerto de persistencia → lector MikroORM → proyección → respuesta`. Si la consulta lo justifica, el caso de uso se reemplaza por un **Query Object** con su puerto de lectura.

Ningún caso de uso ni Query Object inyecta `EntityRepository`, `EntityManager` ni `QueryBuilder`: reciben su contrato por constructor y lo vincula el `*.module.ts`. Si hay una regla de negocio de una entidad, invocar sus operaciones desde el caso de uso. Un servicio de dominio se justifica cuando la regla no pertenece claramente a una sola entidad.

### 2.1. Frontera de datos: puertos, Query Objects e Inputs

Reglas de convivencia entre capas; el detalle y el fundamento están en `AGENTS.md` §5 y `docs/agreements/arquitectura.md`.

- **Interfaces de persistencia:** el acceso a datos siempre pasa por un contrato, y un contrato puede agrupar operaciones relacionadas de lectura y escritura. Un puerto, una implementación; no apilar un repositorio sobre otro ni declarar una interfaz nueva por operación si la existente cubre lo necesario.
- **Query Objects:** son **opcionales**. Un caso de uso resuelve la lectura; se agrega un Query Object en `application/use-cases/<nombre>.query.ts` cuando la consulta lo justifica —varias entidades, filtros dinámicos, ordenamiento, paginación o agregaciones— con nombre de intención y `execute(input)`. No se crea uno por lectura.
- **Proyecciones:** cuando no hace falta el agregado completo, el contrato de lectura devuelve una proyección (`*.result.ts`) en lugar de hidratar entidades.
- **DTO → Input → entidad:** el DTO es contrato HTTP; el Input, la entrada de aplicación; la entidad, el objeto con invariantes. El controller construye el Input y el caso de uso no conoce el DTO.
- **Input de aplicación:** puede ser un tipo, una interfaz o una clase según lo que la intención necesite; no se crea un archivo o una abstracción adicional cuando no aporta valor.
- **El DTO nunca llega a un repositorio ni a MikroORM**, ni directo ni envuelto en un `Partial`/`any`.
- **Factory o método de creación:** solo cuando aporta —datos de varias fuentes, valores por defecto que deben aplicarse siempre o un nombre de negocio de armado—. No se crea una Factory por entidad ni una que esquive invariantes.

| Artefacto | Vive en | Qué valida |
| --- | --- | --- |
| DTO HTTP | `presentation/dto/` | Formato, tipos y campos obligatorios (`class-validator`) |
| Input de aplicación | junto a su caso de uso | Nada: ya viene validado |
| Entidad / agregado | `domain/entities/` | Invariantes del gimnasio |

## 3. Contratos HTTP, validaciones y seguridad

- **Controladores livianos:** recibir la solicitud y delegar al caso de uso; no contener SQL, ORM ni decisiones de negocio.
- **Tipado explícito:** declarar los tipos de parámetros y retornos de los métodos de controller, usando DTO o tipos de respuesta adecuados.
- **DTO de entrada y salida:** representar contratos HTTP, no entidades de dominio; no exponer directamente entidades ni información sensible.
- **Frontera de datos:** el controller transforma el DTO en un Input de aplicación antes de invocar el caso de uso; el DTO no se convierte en entidad ni se entrega a un repositorio (§2.1).
- **Validación técnica:** usar DTO y los mecanismos aprobados (`class-validator`, `class-transformer` y `ValidationPipe` según `AGENTS.md`) para formato, tipos y campos permitidos.
- **Validación de dominio:** comprobar invariantes y estados válidos en agregados o servicios de dominio, aunque el DTO sea válido.
- **REST:** mantener coherencia en rutas, verbos HTTP, códigos de respuesta, errores y versionado cuando corresponda.
- **Autorización:** verificar identidad, permisos y acceso al recurso en backend; que el frontend oculte una acción **no sustituye** esta verificación.
- **Errores:** mantener errores semánticos de aplicación/dominio y traducirlos a respuestas HTTP sin filtrar detalles de implementación. El manejo general está centralizado (§6).

El actor utilizado para las operaciones que cambian estado debe provenir del contexto de autenticación y **nunca** de campos de auditoría enviados en el body.

## 4. Swagger / OpenAPI

Mantener documentados mediante **Swagger/OpenAPI** los endpoints expuestos al frontend, sus parámetros, contratos de entrada y salida y respuestas. La documentación debe permitir integrar los clientes sin adivinar el comportamiento.

Al crear o modificar un endpoint, revisar:

- Método y ruta, propósito y parámetros (path/query/body) con sus tipos.
- DTO de request/response y ejemplos **solo si representan contratos aprobados**.
- Códigos de respuesta relevantes, errores esperables y restricciones de acceso/autenticación.
- Cambios de compatibilidad de la API y su impacto en el frontend.
- Correspondencia entre documentación y comportamiento realmente implementado.

**Entrega:** la dependencia `@nestjs/swagger` (v12, ESM) está instalada en `package.json`. El registro del `SwaggerModule` en `src/main.ts`, la ruta de documentación y la decoración de los controllers se entregan en el cambio de OpenSpec que exponga el primer endpoint; cada endpoint posterior se documenta en el mismo cambio que lo crea.

## 5. Persistencia, integridad y auditoría

- Persistir con **MikroORM y PostgreSQL**, respetando el `EntityManager` contextual y el límite transaccional que **decide el caso de uso**; la ejecución de la transacción vive en la implementación del puerto, no en `application/`.
- Los **puertos de escritura reciben y devuelven agregados o entidades** del dominio, nunca DTOs ni Inputs de aplicación. Los **contratos de lectura pueden devolver proyecciones** cuando no hace falta cargar la entidad completa.
- **Consultas especializadas:** cuando la consulta lo justifica, la implementación vive en `infrastructure/queries/` y puede usar `QueryBuilder` con joins, `LEFT JOIN` cuando la relación es opcional, filtros dinámicos y proyección de campos. `QueryBuilder` es una herramienta a evaluar: si las operaciones del ORM alcanzan, no se agrega. Evitar N+1, joins que nadie consume y consultas sin límite; paginar con ordenamiento estable.
- **Baja lógica:** el filtro de registros activos (`deletedAt IS NULL`) lo aplica la implementación del contrato de lectura, no cada consulta a mano; la baja y la reactivación son casos de uso propios y no saltean la auditoría (§6 de `AGENTS.md`).
- Diseñar relaciones y restricciones en base de datos, no confiar solo en comprobaciones previas como `exists(...)` ante concurrencia.
- Usar migraciones para evolucionar el esquema; no sincronizar ni modificar el esquema destructivamente por fuera del procedimiento acordado.
- Todas las tablas deben contar al menos con el índice asociado a su clave primaria (u otro índice correspondiente); evaluar índices adicionales a partir de búsquedas, filtros, joins, ordenamientos y necesidades reales, evitando redundancias.
- En entidades con baja lógica, considerar restricciones/índices únicos parciales según las reglas aprobadas.
- Respetar la **auditoría transversal** definida en `AGENTS.md`: `createdAt`, `createdById`, `updatedAt`, `updatedById`, `deletedAt` y `deletedById`. Los nombres, nulabilidad, fechas UTC, manejo del actor y comportamiento de eliminación/reactivación se rigen por esa norma.
- No inventar bases auditables, subscribers ni detalles del mecanismo mientras no estén implementados y aprobados.

## 6. Logging, errores y trazabilidad

- Aplicar un manejo consistente de excepciones y registros centralizados para solicitudes, errores, eventos importantes y cambios de estado. **Un solo lugar** arma la respuesta HTTP de error: el filtro global.
- **`try/catch` selectivo:** usarlo solo para traducir una excepción técnica a un error con significado, recuperarse de un fallo esperable con una alternativa concreta, agregar contexto sin ocultar la causa o compensar una operación que no puede ser atómica. Prohibido el `catch` que traga el error, el que solo registra y devuelve vacío y el que se repite en cada método sin poder hacer nada distinto de propagar.
- **Errores semánticos:** se lanzan, no se devuelven como valor. Las excepciones del driver y del ORM se traducen en `infrastructure/`; ni el mensaje del motor ni una traza SQL atraviesan el puerto.
- Dar contexto suficiente para reconstruir una operación cuando proceda, sin saturar los logs con métodos triviales.
- No incluir secretos, tokens, credenciales ni datos personales innecesarios en mensajes de log.
- Distinguir la trazabilidad técnica (**logs**) de la auditoría de entidades (**quién/cuándo realizó cambios persistidos**): una no reemplaza a la otra.
- **Alcance del mecanismo:** el filtro global, el logging centralizado y la base auditable se construyen con la primera entidad y el primer endpoint, según `AGENTS.md` §6 y §7. Esta sección fija el destino y las reglas, no nombres de clases ni módulos.

## 7. Pruebas y calidad

- **Unitarias:** casos de uso de escritura y de lectura, entidades, VOs y reglas; pruebas cerca del archivo fuente usando el sufijo vigente del backend, `.spec.ts`. Los casos de uso —y los Query Objects, cuando existan— se prueban contra un **doble del contrato**, verificando el Input recibido y el agregado o proyección devuelto. No se exigen pruebas de Query Objects si la lectura se resolvió con un caso de uso.
- **Integración:** persistencia, relaciones, migraciones, restricciones, índices, auditoría, baja lógica, transacciones y consultas especializadas con `QueryBuilder`/joins cuando se hayan implementado; usar PostgreSQL real cuando resulte necesario.
- **E2E:** endpoints, validación de DTO, construcción del Input, autorización, errores y efectos observables; respetar la estructura y el sufijo `.e2e-spec.ts` definidos en `AGENTS.md`.
- **Trazabilidad:** títulos claros para cada `describe`/`it`; cuando exista caso formal de prueba, reflejar su nombre o identificador.
- **Correspondencia:** preferir un archivo unitario asociado a cada archivo fuente probado. Integración y E2E pueden agruparse por flujo o funcionalidad.
- **Riesgo:** priorizar invariantes, autorización, concurrencia, operaciones transaccionales y procesos críticos. No declarar comprobada la integridad transaccional únicamente por mocks.
- **Evidencia:** reportar suites ejecutadas, resultado y bloqueos. No marcar como exitoso un test omitido por falta de PostgreSQL/Docker.

El `AGENTS.md` actual establece verificaciones como `yarn typecheck && yarn lint && yarn test` y `yarn test:e2e` cuando corresponda, además del flujo test-first/OpenSpec. Confirmar los scripts disponibles antes de ejecutarlos.

## 8. Git y colaboración

> **Modelo vigente:** GitFlow adoptado por el equipo. Esta sección lo desarrolla; el procedimiento operativo y las autorizaciones sobre commits, push y PR se rigen por `AGENTS.md` §10. `main` y `develop` no reciben commits directos.

### 8.1. GitFlow adaptado y su vínculo con OpenSpec

| Rama | Uso |
| --- | --- |
| `main` | Versiones estables. Solo recibe merges de `develop` y de `hotfix/*`. |
| `develop` | Integración del trabajo en desarrollo; rama base de `feature/*` y `fix/*`. |
| `feature/<change-name>` | Funcionalidad: nace de `develop` y vuelve mediante PR. |
| `fix/<change-name>` | Corrección durante desarrollo: nace de `develop` y vuelve mediante PR. |
| `hotfix/<nombre>` | Incidencia urgente estable: nace de `main` y se integra a `main` y `develop`. |

Mantener ramas acotadas y sincronizadas con su rama base; utilizar `hotfix/*` cuando lo justifique la situación.

**Vínculo con OpenSpec:** `<change-name>` es el nombre en kebab-case del cambio de OpenSpec, de modo que rama, cambio y commits comparten identidad (`feature/add-plan-builder` para el cambio `add-plan-builder`). Una rama `fix/*` que altera comportamiento también requiere su cambio de OpenSpec; `hotfix/*` no exime del flujo ni de las verificaciones. El modelo anterior `change/<change-name>` desde `main` queda retirado.

### 8.2. Conventional Commits

Formato obligatorio según la guía:

```text
<type>(<scope>): <subject>

<body opcional>

<footer opcional>
```

- Mensajes **en inglés**, en modo **imperativo**; `subject` minúsculo, sin punto final, y encabezado completo **≤ 72 caracteres**.
- `scope` identifica el área afectada (`api`, `domain`, `db`, `auth`, `config`, `openspec`, `deps`, `test`, etc.).
- `body` opcional: qué cambió y por qué; líneas **≤ 72 caracteres**.
- `footer`: referencias a tareas/especificaciones. Si se implementa un cambio OpenSpec, utilizar `Refs: openspec/changes/<change-name>` conforme a `AGENTS.md`.
- **Breaking change:** usar `!` y `BREAKING CHANGE:` en el footer.

| Tipo | Uso |
| --- | --- |
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de defecto |
| `docs` | Documentación |
| `style` | Formato sin cambio funcional |
| `refactor` | Reestructuración sin cambiar comportamiento |
| `perf` | Rendimiento |
| `test` | Pruebas |
| `build` | Compilación/dependencias/herramientas |
| `ci` | Integración continua |
| `chore` | Mantenimiento |
| `revert` | Revertir commit |

Ejemplos:

```text
feat(domain): add weekly prescription value object

Refs: openspec/changes/add-plan-builder
```

```text
fix(api): reject duplicate exercise in same session

Refs: openspec/changes/register-training
```

Un commit representa una unidad lógica e incluye las pruebas y documentación asociadas cuando corresponde; evitar mezclar refactors no relacionados.

### 8.3. Pull requests

El título debe identificar el cambio. La descripción debe permitir comprender **qué, por qué y cómo se verificó**. Toda rama `feature/*` o `fix/*` abre su PR contra `develop`; una `hotfix/*` abre el PR contra `main` y un segundo merge lleva la corrección a `develop`. Estructura base:

```md
## Objetivo y contexto
<!-- Problema, historia/tarea, issue o cambio OpenSpec asociado -->

## Resumen de cambios
<!-- Módulos, casos de uso, reglas y contratos modificados -->

## Validación y pruebas
<!-- Comandos, resultados reales, tests omitidos y causa -->

## Impacto y consideraciones
<!-- Migraciones, API, permisos, configuración, compatibilidad, riesgos; "No aplica" si corresponde -->

## Evidencias
<!-- Ejemplos request/response, logs sanitizados o enlaces útiles si ayudan -->
```

No incluir secretos, credenciales, tokens ni información personal en los PR ni en las evidencias.

## 9. Protocolo de trabajo para desarrolladores y agentes de IA

### Antes de implementar

1. Leer `AGENTS.md`, `docs/agreements/arquitectura.md`, las especificaciones vigentes y el código real.
2. Identificar el requerimiento, la capacidad de negocio, el actor autorizado y las invariantes afectadas.
3. Seguir el **flujo OpenSpec** establecido por `AGENTS.md` para cambios de comportamiento; no pasar a implementación sin la aprobación que exige.
4. Implementar cada comando y cada lectura con un **caso de uso**; agregar un Query Object solo si la consulta lo justifica. El acceso a datos pasa por un contrato de persistencia, reutilizando el existente cuando ya cubre la operación. Servicios de dominio solo para reglas que lo justifiquen y Factory solo si aporta valor.
5. Definir el artefacto de cada borde: DTO HTTP en presentación, Input de aplicación junto al caso de uso —tipo, interfaz o clase, según lo que aporte—, entidad en dominio. El DTO no llega a la persistencia.
6. Determinar garantías de persistencia, auditoría, índices, migraciones, baja lógica, efectos de concurrencia y pruebas necesarias.
7. No inventar rutas, esquemas, permisos, eventos ni infraestructura que no consten en fuentes aprobadas.

### Antes de entregar

- [ ] Controller liviano, entradas/salidas tipadas, DTO validado y transformado en Input antes de invocar el caso de uso.
- [ ] Invariantes de negocio dentro del dominio; orquestación en aplicación y unidad de trabajo ejecutada por la implementación del puerto.
- [ ] Puertos en uso: sin `EntityRepository`, `EntityManager` ni `QueryBuilder` en `application/`; los contratos de escritura reciben agregados y los de lectura devuelven proyecciones cuando corresponde, sin crear una interfaz por operación.
- [ ] Consultas especializadas resueltas en `infrastructure/queries/` cuando la consulta lo justifica; `QueryBuilder` solo si las operaciones del ORM no alcanzan, sin N+1, joins innecesarios ni consultas sin límite.
- [ ] Query Objects creados solo donde la lectura lo justifica; ninguna lectura obligada a tener uno.
- [ ] Baja lógica: registros dados de baja excluidos en las lecturas habituales y reactivación como caso de uso explícito.
- [ ] `try/catch` solo donde aporta; excepciones técnicas traducidas en infraestructura y respuesta de error centralizada.
- [ ] Cambios de DB respaldados por migraciones y pruebas pertinentes.
- [ ] Contratos Swagger/OpenAPI actualizados junto con cada endpoint que se agregue.
- [ ] Logging relevante y auditoría preservada, sin exponer información sensible.
- [ ] Pruebas de comportamiento y casos formales trazables; resultados realmente ejecutados.
- [ ] `git diff` limitado al alcance del cambio; documentación y referencias OpenSpec consistentes.
- [ ] Commits y PR acordes a GitFlow adoptado (`feature/*`, `fix/*`, `hotfix/*`) y a las autorizaciones de `AGENTS.md` §10.
- [ ] Sin push, PR, merge o despliegue automático sin las autorizaciones requeridas por `AGENTS.md`.

