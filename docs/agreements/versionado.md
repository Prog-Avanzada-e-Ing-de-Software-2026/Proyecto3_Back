# Proyecto 3 — Guía de versionado del Backend

> **Destinatarios:** equipo de desarrollo y agentes de IA que trabajen en `Proyecto3_Back`.
>
> **Alcance:** versionado del backend NestJS + TypeScript + MikroORM + PostgreSQL. Define cómo se numera el artefacto, cómo se identifican las entregas al cliente y cómo se materializa cada versión en la historia de Git.
>
> **Estado:** acuerdo vigente del equipo. Desarrolla la estrategia de versionado en detalle; las ramas, los commits, el push y los PR siguen rigiéndose por `AGENTS.md` §10 y `buenas_practicas.md` §8. Ante discrepancia manda `AGENTS.md` y la discrepancia se reporta para corregir la guía, nunca se resuelve en silencio.

## 1. Objetivo y alcance

**Objetivo:** que cualquier integrante del equipo o agente de IA pueda responder sin ambigüedad qué número identifica al backend después de un cambio y qué tag le corresponde, sin depender de la memoria de quien hizo el cambio.

Esta guía cubre:

- El **versionado interno** del backend, su formato y los criterios de incremento.
- El **versionado externo** de las entregas al cliente.
- El **uso de Git tags** y su vínculo con Pull Requests, GitFlow y Conventional Commits.

No cubre el versionado de dependencias ni de los artefactos de OpenSpec, y no define un esquema de versión en las rutas HTTP: esta guía numera el artefacto del backend, no la URL de la API. Un cambio incompatible del contrato público se refleja en `X` aunque la ruta se mantenga.

## 2. Versionado interno

El backend usa el formato `X.Y.Z` y **comienza en `0.0.0`**.

| Componente | Significado | Qué lo incrementa |
| --- | --- | --- |
| `X` | Breaking change del contrato público de la API | Eliminar endpoints, modificar rutas de forma incompatible o cambiar parámetros obligatorios y estructuras de respuesta de manera que los consumidores deban adaptarse. |
| `Y` | Cambio compatible del contrato de la API | Incorporar endpoints, parámetros opcionales o nuevas capacidades expuestas por la API que mantengan la compatibilidad existente. |
| `Z` | Cambio interno significativo | Refactorizaciones, correcciones internas, mejoras de implementación o incorporación de componentes y servicios que todavía no se exponen mediante endpoints. |

Los tres componentes son números enteros no negativos; no se usan etiquetas, sufijos ni metadatos sobre el número.

> El campo `version` de `package.json` no es la fuente de esta numeración: la versión interna se declara en la descripción del PR y se materializa en el tag.

## 3. Reglas de incremento

1. **`X` reinicia `Y` y `Z` a cero.** `1.2.3` con un breaking change pasa a `2.0.0`.
2. **`Y` reinicia `Z` a cero.** `1.2.3` con un cambio compatible de API pasa a `1.3.0`.
3. **`Z` incrementa sin tocar `X` ni `Y`.** `1.2.3` con un cambio interno significativo pasa a `1.2.4`.
4. **Ante varios cambios, se aplica solamente el incremento de mayor impacto:** `X` > `Y` > `Z`. Un PR que agrega un endpoint y además refactoriza sube `Y`, no `Z`; si además rompe el contrato, sube `X`.
5. **No se incrementa la versión** por cambios exclusivamente documentales, de testing, de formato o de mantenimiento menor sin impacto significativo sobre el código o su ejecución.

El incremento se decide por el **impacto real del cambio**, no por la cantidad de commits, por el tamaño del diff ni por el tipo de commit.

## 4. Versionado externo

El versionado externo identifica las **entregas al cliente** y es independiente del versionado interno.

- La **primera entrega del MVP es `1.0`**, con independencia de la versión interna alcanzada en ese momento. Un backend en `0.3.1` puede entregarse como `1.0`, y una entrega `1.0` no obliga a que el interno llegue a `1.0.0`.
- No se deriva el número externo a partir del interno con una fórmula fija: la correspondencia se decide en cada entrega.
- Las entregas posteriores se numeran cuando se planifique cada una; esta guía fija únicamente el punto de partida del MVP.

## 5. Git tags

Todo tag de versión usa el formato **`vX.Y.Z`** y refleja la versión **interna** correspondiente; el versionado externo no se publica como tag.

Procedimiento:

1. El Pull Request hacia `develop` o `main` declara en su descripción la versión interna que le corresponde (§6.3).
2. Una vez aprobado e integrado el PR, se crea el tag sobre el **commit resultante de la integración** —el merge—, nunca sobre el último commit de la rama de trabajo.
3. El tag se publica en el remoto.
4. **No se crea una versión nueva** cuando los cambios no requieren incremento (§3): un PR documental no genera tag.

Crear y publicar un tag son decisiones del equipo, igual que el push, el PR y el merge (`AGENTS.md` §10). El procedimiento se ejecuta cuando la integración ya ocurrió y con el pedido explícito correspondiente.

## 6. Relación con GitFlow, Conventional Commits y Pull Requests

### 6.1 GitFlow

El versionado se apoya en el modelo de ramas vigente (`AGENTS.md` §10, `buenas_practicas.md` §8.1):

| Integración | Rama destino | Tag |
| --- | --- | --- |
| `feature/*` o `fix/*` → `develop` | `develop` | `vX.Y.Z` sobre el merge de integración, si el cambio requiere incremento |
| `develop` → `main` | `main` | `vX.Y.Z` sobre el merge de integración, si el cambio requiere incremento |
| `hotfix/*` → `main` | `main` | `vX.Y.Z` sobre el merge de integración, si el cambio requiere incremento |

### 6.2 Conventional Commits

Los commits siguen Conventional Commits (`AGENTS.md` §9, `buenas_practicas.md` §8.2). Los Breaking Changes se identifican con `!` en el encabezado y el footer `BREAKING CHANGE:`:

```text
feat(api)!: require alumno id in training query

BREAKING CHANGE: the alumno id is now a mandatory parameter.
```

El tipo de commit **no determina automáticamente el incremento de versión**: `feat` puede ser `Y` si agrega un endpoint o `Z` si agrega un componente interno; `fix` suele ser `Z`, pero es `X` si corrige un contrato de forma incompatible. La clasificación se decide por el impacto real (§2 y §3).

### 6.3 Pull requests

- Todo PR hacia `develop` o `main` **indica la versión interna** correspondiente en su descripción, por ejemplo `Versión: 1.2.0`.
- El PR describe los cambios observables para justificar la clasificación; si implementa un cambio de OpenSpec, mantiene el footer `Refs: openspec/changes/<change-name>` en sus commits.
- La versión declarada se confirma después de la revisión: si el alcance final cambia, la versión declarada se corrige antes de integrar.
- Si el PR no requiere incremento, lo declara explícitamente y no origina tag.

## 7. Ejemplos prácticos

### 7.1 Clasificación

Partiendo de `1.2.3`:

| Cambio | Incremento | Versión resultante |
| --- | --- | --- |
| Se agrega `POST /entrenamientos` | `Y` | `1.3.0` |
| Se agrega un parámetro de filtro opcional a `GET /alumnos` | `Y` | `1.3.0` |
| Se elimina `GET /profesores` | `X` | `2.0.0` |
| Un parámetro que era opcional pasa a ser obligatorio | `X` | `2.0.0` |
| Cambia la estructura de la respuesta de un endpoint existente y el frontend debe adaptarse | `X` | `2.0.0` |
| Se incorpora el componente de catálogo sin exponer endpoints | `Z` | `1.2.4` |
| Se corrige un cálculo interno sin alterar la respuesta | `Z` | `1.2.4` |
| Se agrega un endpoint y se refactoriza el módulo | `Y` (mayor impacto) | `1.3.0` |
| Se actualiza `docs/agreements/testing.md` sin tocar código | Sin incremento | `1.2.3` |

### 7.2 Comandos Git

Ver la versión antes de integrar:

```bash
git fetch --tags
git tag --list 'v*'
```

Crear el tag después del merge, sobre el commit de integración:

```bash
git switch develop
git pull --ff-only
git tag v1.3.0
```

Publicarlo en el remoto:

```bash
git push origin v1.3.0
```

Verificar el tag publicado:

```bash
git show v1.3.0 --stat
git ls-remote --tags origin
```

## 8. Checklist antes de cerrar un PR

- [ ] El impacto real del cambio está identificado y clasificado como `X`, `Y` o `Z`.
- [ ] La descripción del PR declara la versión interna resultante, o indica que no requiere incremento.
- [ ] Un Breaking Change lleva `!` en el encabezado y el footer `BREAKING CHANGE:`.
- [ ] El tag `vX.Y.Z` se crea recién después del merge, sobre el commit de integración.
- [ ] No se creó un tag para cambios documentales, de testing, de formato o de mantenimiento menor sin impacto significativo.
- [ ] La creación y publicación del tag se coordinaron con el equipo, igual que el push y el merge.
