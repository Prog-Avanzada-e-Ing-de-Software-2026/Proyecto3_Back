# AGENTS.md — proyecto3_back

Guía operativa para agentes de IA en este repositorio. La documentación y los artefactos de OpenSpec se escriben en español; el código, los identificadores técnicos y los mensajes de commit se escriben en inglés.

## 1. Contexto del proyecto

Backend de una aplicación de gestión de gimnasio: los profesores arman planes de entrenamiento y los alumnos registran sus entrenamientos. Está construido con NestJS 12, TypeScript estricto (ESM), MikroORM 7 y PostgreSQL, y se prueba con Vitest 4, oxlint y Prettier sobre Yarn 4.18.1 y Node 24.16. La documentación de dominio vive en `docs/preliminar/`: es preliminar, puede cambiar y se puede corregir y refinar. Todo cambio que altere comportamiento debe reflejarse además en un cambio de OpenSpec. Mantener el **lenguaje ubicuo** del dominio: no traducir ni renombrar sus términos en el código sin justificación.

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

Solo los cambios sin efecto en comportamiento, contratos, esquema o código (typos, aclaraciones en `docs/preliminar/`) pueden hacerse sin un cambio de OpenSpec. La excepción debe declararse explícitamente en la respuesta. Ante la duda, crear el cambio.

## 4. Convenciones de código

- **ESM:** `package.json` tiene `"type": "module"` y `tsconfig` usa `nodenext`. Todo import relativo lleva extensión `.js` (`import { AppModule } from './app.module.js'`).
- **TypeScript estricto:** no relajar `strict` ni usar `@ts-ignore` sin justificación escrita.
- **NestJS:** un módulo por capacidad. Estructura objetivo para código nuevo:
  - `src/<capacidad>/domain/` — entidades, value objects, reglas y puertos de repositorio.
  - `src/<capacidad>/application/` — casos de uso.
  - `src/<capacidad>/infrastructure/` — controladores, DTOs y persistencia.
  - `src/<capacidad>/<capacidad>.module.ts` — módulo NestJS.
- **MikroORM:**
  - Las entidades deben llamarse `*.entity.ts` (el config las busca con `./src/**/*.entity.ts`).
  - Usar los decoradores legacy de `@mikro-orm/decorators/legacy`, consistentes con el `ReflectMetadataProvider` configurado.
  - Las migraciones viven en `src/migrations`.
  - Toda entidad persistente hereda de la base auditable (ver §5); los campos de auditoría no se declaran entidad por entidad.
- **Reglas de dominio:** se validan dentro de la raíz del agregado, no en controladores ni en DTOs. Un VO es inmutable; una entidad conserva identidad.
- **Errores de dominio:** no exponer detalles de persistencia en la API.
- **Formato:** Prettier (`singleQuote`, `trailingComma: all`) y oxlint. No introducir reglas nuevas de lint sin justificarlo.

## 5. Auditoría de entidades

Toda entidad persistente registra **quién** creó, editó y eliminó cada fila. Es un requisito transversal del modelo: no se decide entidad por entidad ni caso de uso por caso de uso. El detalle de implementación (base abstracta, suscriptor sobre el `EntityManager`, interceptor) es una decisión de diseño del cambio de OpenSpec que introduzca la primera entidad; lo que no se negocia son los campos ni las reglas de esta sección.

Esta convención se incorporó por decisión explícita del usuario como documentación: no requiere un cambio de OpenSpec propio, pero obliga a que todo cambio posterior que cree o modifique una entidad la cumpla.

### 5.1 Campos obligatorios

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

### 5.2 Reglas de implementación

1. **Un solo lugar.** Los seis campos se completan en la base auditable y en el mecanismo de persistencia, nunca a mano en cada caso de uso ni en cada controlador.
2. **El actor sale del contexto de autenticación.** Jamás del body, del query string ni de un DTO. Si no hay actor identificado, la operación se rechaza; no se inventa un usuario "sistema" salvo en procesos internos explícitamente declarados.
3. **El cliente no puede escribirlos.** Los DTOs de entrada no exponen estos campos y, si llegan en el payload, se ignoran.
4. **Nada de escrituras que salteen el mecanismo.** `updateMany`, `nativeUpdate` o SQL crudo no pasan por el suscriptor y dejan la auditoría desactualizada. Si un caso de uso los necesita, actualiza `updatedAt` y `updatedById` explícitamente dentro de la misma transacción.
5. **UTC.** Las fechas se persisten en UTC (`timestamptz`) y se serializan en ISO-8601 con zona.
6. **La auditoría no se edita.** Ningún endpoint ni caso de uso modifica estos campos después de escritos; `createdAt` y `createdById` son inmutables por definición.

### 5.3 Eliminación y trazabilidad

- **Baja lógica por defecto.** Cuando la entidad conserva historial o está referenciada por otras (alumno, profesor, plan, entrenamiento), eliminar significa completar `deletedAt` y `deletedById` y excluirla de las consultas. La fila permanece y con ella queda el rastro de quién la dio de baja.
- **Borrado físico** solo en catálogos sin referencias y cuando la historia no importa (por ejemplo, una máquina nunca usada, `US-01`). Al borrar la fila desaparece su auditoría: si el dominio exige conservarla, la baja debe ser lógica.
- **Índices únicos sobre entidades con baja lógica:** un `UNIQUE` plano queda bloqueado por la fila dada de baja. Usar índices parciales (`WHERE deleted_at IS NULL`).
- **Reactivación explícita.** Volver a poner `deletedAt` en `null` es un caso de uso del dominio, no un update genérico, y actualiza `updatedAt` y `updatedById` como cualquier otra edición.

## 6. Testing y verificación

- Tests unitarios colocados junto al código, con sufijo `.spec.ts`.
- Tests e2e en `test/`, con sufijo `.e2e-spec.ts`.
- Todo cambio de comportamiento sigue test-first: primero un test que falla (RED), luego la implementación (GREEN), luego refactor.
- Cada test debe verificar todos los efectos observables de la regla (salida, error, datos persistidos) y pasar por la interfaz pública.
- Toda entidad nueva cubre alta, edición y baja verificando los seis campos de auditoría (§5.1) a través de la interfaz pública, incluido que el actor provenga del contexto de autenticación y no del payload.
- Antes de declarar terminada una tarea: `yarn typecheck && yarn lint && yarn test`.
- Ejecutar `yarn test:e2e` cuando el cambio toque HTTP, base de datos o configuración de la aplicación.
- No desactivar ni saltear tests para "dejar todo en verde". Si un test falla por una causa preexistente, documentarlo con evidencia.

## 7. Base de datos y migraciones

- Los cambios de esquema son de alto riesgo: requieren un cambio de OpenSpec con su `design.md` y una estrategia de rollback.
- Toda migración que crea o altera una entidad incluye las seis columnas de auditoría (§5.1). Su nulabilidad se define en el `design.md` del cambio; una vez que exista la capacidad de identidad, las columnas de alta y edición son `NOT NULL`.
- Nunca editar una migración ya aplicada. Crear una nueva.
- Nunca ejecutar operaciones destructivas (`DROP`, `TRUNCATE`, borrado de datos) sin aprobación explícita del usuario.
- Las credenciales viven en `.env` (ignorado por git). Nunca commitear `.env` ni secretos.

## 8. Conventional Commits

Todos los commits siguen [Conventional Commits](https://www.conventionalcommits.org/). Los mensajes se escriben en inglés, en modo imperativo.

### 8.1 Formato

```text
<type>(<scope>): <subject>

<body>

<footer>
```

- `subject`: imperativo, minúsculas, sin punto final, encabezado total ≤ 72 caracteres.
- `body`: qué y por qué, no cómo; líneas ≤ 72 caracteres.
- `footer`: referencias y breaking changes.

### 8.2 Tipos permitidos

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

### 8.3 Scopes

Usar un scope corto que identifique el área afectada. Ejemplos: `api`, `domain`, `db`, `auth`, `config`, `openspec`, `deps`, `test`.

### 8.4 Reglas

- Un commit = una unidad lógica de trabajo. No mezclar refactors no relacionados ni cambios de formato masivos.
- El código, sus tests y su documentación van en el mismo commit.
- Todo commit que implementa un cambio de OpenSpec incluye el footer `Refs: openspec/changes/<change-name>`.
- El commit de archivado usa `chore(openspec): archive <change-name>`.
- Los breaking changes se marcan con `!` en el tipo/scope y un footer `BREAKING CHANGE: <descripción>`.
- Sin atribución de IA: nunca agregar `Co-Authored-By` ni trailers equivalentes.
- No hacer `push`, abrir PR ni mergear sin pedido explícito del usuario.

### 8.5 Ejemplos

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

## 9. Git y revisión

- Cada cambio de OpenSpec se implementa en una rama `change/<change-name>`; no commitear directamente sobre `main`.
- Antes de commitear: `yarn typecheck && yarn lint && yarn test`.
- Revisar `git diff` completo antes de cada commit; no commitear archivos generados ni secretos.
- No usar `--no-verify` para saltear hooks.
- El push, la creación de PR y el merge son decisiones del usuario.

## 10. CodeGraph

El proyecto tiene un índice de CodeGraph en `.codegraph/` (datos locales, no se commitean).

- Para preguntas estructurales (arquitectura, flujos, impacto de un cambio, referencias), usar `codegraph_explore` o `codegraph explore` antes de búsquedas amplias con `grep`/`find`.
- Después de editar código, ejecutar `codegraph sync -q .` antes de confiar en consultas del CLI.
- Cada worktree necesita su propio índice; nunca copiar ni symlinkear `.codegraph/`.

## 11. Seguridad

- No leer ni exponer `.env`, credenciales, claves ni tokens.
- No ejecutar comandos remotos (`ssh`, `scp`, `rsync`) ni publicar artefactos sin autorización explícita.
- Ante una operación destructiva o irreversible, detenerse y pedir aprobación.
