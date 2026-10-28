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
- **Abstracciones justificadas:** añadir interfaces, adaptadores o patrones solo si resuelven un problema concreto.
- **Entidades con comportamiento:** una entidad no es solo un contenedor de atributos; expresa las reglas que mantienen sus invariantes.
- **Pruebas trazables:** cada test describe el comportamiento observado e identifica el caso de prueba formal cuando exista.

Evitar tanto el **modelo anémico** como el **servicio que concentra todas las reglas**. No introducir ceremonias arquitectónicas si un caso de uso y las operaciones del dominio resuelven correctamente el requisito.

## 2. Arquitectura y distribución de responsabilidades

La arquitectura específica definida en `docs/agreements/arquitectura.md` y `AGENTS.md` es un **monolito modular**, particionado **por capacidad de negocio y luego por capas**, con DDD pragmático e interfaces/puertos selectivos. La separación semántica de comandos y consultas **no obliga a usar `@nestjs/cqrs`**.

```text
src/modules/<capacidad>/
├── <capacidad>.module.ts              # Composición NestJS
├── presentation/
│   ├── <capacidad>.controller.ts
│   └── dto/
├── application/
│   ├── use-cases/                     # Comandos / cambios de estado
│   └── queries/                       # Lecturas y proyecciones
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/                      # Solo reglas de dominio que no caben en entidad
│   └── interfaces/                    # Contratos selectivos, no por defecto
└── infrastructure/
    └── repositories/                  # Adaptadores cuando estén justificados
```

Árbol **conceptual**, no obligación de crear subcarpetas vacías. En el catálogo, la arquitectura específica dispone submódulos para cada concepto catalogable; se respetará esa decisión cuando se implementen.

| Capa | Responsabilidad | No debe hacer |
| --- | --- | --- |
| `presentation/` | recibir HTTP, DTO, validar formato, identificar actor, delegar | lógica de negocio, consultas ORM o transacciones |
| `application/` | coordinar casos de uso, consultas, permisos operativos y transacciones | duplicar invariantes de entidades |
| `domain/` | entidades, agregados, VOs y reglas de negocio | depender de HTTP o de detalles técnicos en sus reglas puras |
| `infrastructure/` | persistencia MikroORM, adaptadores, SQL y servicios técnicos | decidir reglas del dominio por su cuenta |

**Comando:** `Controller → UseCase → dominio → persistencia`.

**Consulta:** `Controller → Query → proyección → respuesta`.

Los casos de uso pueden acceder al `EntityRepository` de MikroORM mediante inyección, como establece la arquitectura vigente; no añadir un repositorio abstracto que solo reenvíe llamadas. Si hay una regla de negocio de una entidad, invocar sus operaciones desde el UseCase. Un servicio de dominio se justifica cuando la regla no pertenece claramente a una sola entidad.

## 3. Contratos HTTP, validaciones y seguridad

- **Controladores livianos:** recibir la solicitud y delegar al caso de uso/query; no contener SQL, ORM ni decisiones de negocio.
- **Tipado explícito:** declarar los tipos de parámetros y retornos de los métodos de controller, usando DTO o tipos de respuesta adecuados.
- **DTO de entrada y salida:** representar contratos HTTP, no entidades de dominio; no exponer directamente entidades ni información sensible.
- **Validación técnica:** usar DTO y los mecanismos aprobados (`class-validator`, `class-transformer` y `ValidationPipe` según `AGENTS.md`) para formato, tipos y campos permitidos.
- **Validación de dominio:** comprobar invariantes y estados válidos en agregados o servicios de dominio, aunque el DTO sea válido.
- **REST:** mantener coherencia en rutas, verbos HTTP, códigos de respuesta, errores y versionado cuando corresponda.
- **Autorización:** verificar identidad, permisos y acceso al recurso en backend; que el frontend oculte una acción **no sustituye** esta verificación.
- **Errores:** mantener errores semánticos de aplicación/dominio y traducirlos a respuestas HTTP sin filtrar detalles de implementación.

El actor utilizado para las operaciones que cambian estado debe provenir del contexto de autenticación y **nunca** de campos de auditoría enviados en el body.

## 4. Swagger / OpenAPI

Mantener documentados mediante **Swagger/OpenAPI** los endpoints expuestos al frontend, sus parámetros, contratos de entrada y salida y respuestas. La documentación debe permitir integrar los clientes sin adivinar el comportamiento.

Al crear o modificar un endpoint, revisar:

- Método y ruta, propósito y parámetros (path/query/body) con sus tipos.
- DTO de request/response y ejemplos **solo si representan contratos aprobados**.
- Códigos de respuesta relevantes, errores esperables y restricciones de acceso/autenticación.
- Cambios de compatibilidad de la API y su impacto en el frontend.
- Correspondencia entre documentación y comportamiento realmente implementado.

**Estado real:** la dependencia `@nestjs/swagger` (v12, ESM) ya está instalada, pero **el `SwaggerModule` todavía no está registrado** en `src/main.ts`: hoy no existe documento OpenAPI ni ruta de documentación. Registrar el módulo y decorar los controllers es comportamiento de la aplicación, así que se hace en el cambio de OpenSpec que exponga el primer endpoint; hasta entonces, no asumir que existe `/api` ni referenciar decoradores de Swagger en código que todavía no los necesita.

## 5. Persistencia, integridad y auditoría

- Persistir con **MikroORM y PostgreSQL**, respetando el EntityManager contextual y el límite transaccional del caso de uso cuando corresponda.
- Diseñar relaciones y restricciones en base de datos, no confiar solo en comprobaciones previas como `exists(...)` ante concurrencia.
- Usar migraciones para evolucionar el esquema; no sincronizar ni modificar el esquema destructivamente por fuera del procedimiento acordado.
- Todas las tablas deben contar al menos con el índice asociado a su clave primaria (u otro índice correspondiente); evaluar índices adicionales a partir de búsquedas, filtros, joins, ordenamientos y necesidades reales, evitando redundancias.
- En entidades con baja lógica, considerar restricciones/índices únicos parciales según las reglas aprobadas.
- Respetar la **auditoría transversal** definida en `AGENTS.md`: `createdAt`, `createdById`, `updatedAt`, `updatedById`, `deletedAt` y `deletedById`. Los nombres, nulabilidad, fechas UTC, manejo del actor y comportamiento de eliminación/reactivación se rigen por esa norma.
- No inventar bases auditables, subscribers ni detalles del mecanismo mientras no estén implementados y aprobados.

## 6. Logging, errores y trazabilidad

- Aplicar un manejo consistente de excepciones y registros centralizados para solicitudes, errores, eventos importantes y cambios de estado.
- Dar contexto suficiente para reconstruir una operación cuando proceda, sin saturar los logs con métodos triviales.
- No incluir secretos, tokens, credenciales ni datos personales innecesarios en mensajes de log.
- Distinguir la trazabilidad técnica (**logs**) de la auditoría de entidades (**quién/cuándo realizó cambios persistidos**): una no reemplaza a la otra.
- **Estado real del proyecto:** todavía no existen ni el mecanismo de logging centralizado ni la base auditable; los campos de auditoría se implementan en el cambio de OpenSpec que introduzca la primera entidad persistente (§6 de `AGENTS.md`). Esta sección describe el destino, no una infraestructura disponible: no dar por hecho que existen ni referenciar módulos que aún no fueron creados.

## 7. Pruebas y calidad

- **Unitarias:** casos de uso, entidades, VOs y reglas; pruebas cerca del archivo fuente usando el sufijo vigente del backend, `.spec.ts`.
- **Integración:** persistencia, relaciones, migraciones, restricciones, índices, auditoría y transacciones; usar PostgreSQL real cuando resulte necesario.
- **E2E:** endpoints, validación de DTO, autorización, errores y efectos observables; respetar la estructura y el sufijo `.e2e-spec.ts` definidos en `AGENTS.md`.
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
4. Escoger `UseCase` para comandos, `Query` para lecturas y servicios de dominio solo para reglas que los justifiquen.
5. Determinar garantías de persistencia, auditoría, índices, migraciones, efectos de concurrencia y pruebas necesarias.
6. No inventar rutas, esquemas, permisos, eventos ni infraestructura que no consten en fuentes aprobadas.

### Antes de entregar

- [ ] Controller liviano, entradas/salidas tipadas, DTO y validación técnica correctos.
- [ ] Invariantes de negocio dentro del dominio; orquestación y transacciones en aplicación.
- [ ] Cambios de DB respaldados por migraciones y pruebas pertinentes.
- [ ] Contratos Swagger/OpenAPI actualizados **cuando el `SwaggerModule` esté registrado**; mientras no lo esté, reportar el pendiente en lugar de inventar documentación.
- [ ] Logging relevante y auditoría preservada, sin exponer información sensible.
- [ ] Pruebas de comportamiento y casos formales trazables; resultados realmente ejecutados.
- [ ] `git diff` limitado al alcance del cambio; documentación y referencias OpenSpec consistentes.
- [ ] Commits y PR acordes a GitFlow adoptado (`feature/*`, `fix/*`, `hotfix/*`) y a las autorizaciones de `AGENTS.md` §10.
- [ ] Sin push, PR, merge o despliegue automático sin las autorizaciones requeridas por `AGENTS.md`.

