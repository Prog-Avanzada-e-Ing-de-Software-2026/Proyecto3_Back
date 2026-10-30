# Proyecto 3 — Backend de gestión de gimnasio

Backend del MVP de una aplicación de gestión de gimnasio: los profesores arman
planes de entrenamiento y los alumnos registran sus entrenamientos.

Proyecto académico de **Ingeniería y Calidad de Software 2026** — Facultad
Regional de Villa María, Ingeniería en Sistemas de Información (Grupo 10).

El sistema se especifica antes de implementarse: cada funcionalidad nace como un
cambio de OpenSpec aprobado y se traza a las reglas de negocio (`RN-01`..`RN-42`)
y a las historias de usuario (`HU 1`..`HU 29`) del dominio.

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | NestJS 12 |
| Lenguaje | TypeScript estricto (ESM, `nodenext`) |
| Persistencia | MikroORM 7 + PostgreSQL 18 |
| Validación | `class-validator` + `class-transformer` (DTO) |
| Documentación de API | `@nestjs/swagger` |
| Pruebas | Vitest 4 + Testcontainers |
| Lint y formato | oxlint (type-aware) + Prettier |
| Runtime y gestor de paquetes | Node.js 24 + Yarn 4.18.1 |
| Especificación | OpenSpec |

## Documentación

| Documento | Contenido |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Guía operativa: flujo de trabajo, arquitectura, comandos y convenciones |
| [`docs/dominio/Analisis de dominio.md`](docs/dominio/Analisis%20de%20dominio.md) | Lenguaje ubicuo y modelo del dominio (bounded context «Entrenamiento») |
| [`docs/dominio/Reglas de negocio.md`](docs/dominio/Reglas%20de%20negocio.md) | Fuente de verdad de las 42 reglas de negocio |
| [`docs/dominio/User Stories.md`](docs/dominio/User%20Stories.md) | 29 historias de usuario con criterios de aceptación |
| [`docs/dominio/Agregados y entidades.md`](docs/dominio/Agregados%20y%20entidades.md) | Agregados, entidades y value objects |
| [`docs/dominio/Decisiones abiertas.md`](docs/dominio/Decisiones%20abiertas.md) | Decisiones pendientes (`D-nn`, `DW-nn`) |
| [`docs/agreements/arquitectura.md`](docs/agreements/arquitectura.md) | Estructura de carpetas, capas y límites entre módulos |
| [`docs/agreements/testing.md`](docs/agreements/testing.md) | Estrategia de pruebas por capa |
| [`docs/agreements/buenas_practicas.md`](docs/agreements/buenas_practicas.md) | Contratos HTTP, persistencia, logging y ramas |
| [`openspec/`](openspec) | Especificaciones vigentes y cambios propuestos |

## Requisitos previos

Antes de comenzar, asegurate de tener instalado:

- **Node.js 24 o superior** ([descargar](https://nodejs.org/))
- **Yarn 4.18.1** (se habilita con `corepack enable`)
- **PostgreSQL 18** local o un servicio gestionado
- **Git** ([descargar](https://git-scm.com/))
- **Docker** solo si vas a correr los tests de integración con Testcontainers
  ([Docker Desktop](https://www.docker.com/products/docker-desktop/))

Verificá las versiones:

```bash
node --version    # v24.x.x o superior
yarn --version    # 4.18.1
psql --version    # psql (PostgreSQL) 18.x (si usás una instalación local)
docker --version  # solo para los tests de integración
```

El proyecto está fijado con `packageManager` y `engines` en `package.json`: una
versión distinta de Node o Yarn produce instalaciones y builds distintos a los
del CI.

## Puesta en marcha

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/Prog-Avanzada-e-Ing-de-Software-2026/Proyecto3_Back.git
cd Proyecto3_Back
```

### Paso 2: Instalar dependencias

```bash
corepack enable
yarn install
```

`yarn install` instala todo lo declarado en `package.json` y lo fija en
`yarn.lock`. Para instalar exactamente las versiones del lockfile sin
actualizarlo —lo que hace el CI— usá `yarn install --immutable`.

### Paso 3: Configurar variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp env.example .env
```

Contenido de `.env` para desarrollo local:

```dotenv
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_proyecto
DB_USER=postgres
DB_PASSWORD=postgres

# Servidor
PORT=3000

# Conexión TLS con PostgreSQL (disable | prefer | require | verify-ca | verify-full)
PGSSLMODE=disable
```

Significado de cada variable:

| Variable | Uso | Valor por defecto en el código |
| --- | --- | --- |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `mi_proyecto` |
| `DB_USER` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña del usuario | sin valor |
| `PGSSLMODE` | Modo TLS de la conexión; `pg` lo lee directo del entorno | sin valor |
| `PGCHANNELBINDING` | Canal binding de SCRAM (`disable` \| `prefer` \| `require`) | sin valor |
| `PORT` | Puerto HTTP del servidor | `3000` |

Las variables `DB_*` las consume `src/mikro-orm.config.ts`; `PORT` la consume
`src/main.ts`.

> **Importante:**
>
> - `.env` está en `.gitignore`: nunca lo subas al repositorio.
> - En producción usá credenciales propias del entorno y `PGSSLMODE=require`
>   cuando el proveedor de PostgreSQL lo exija.
> - Los valores de arriba son solo para desarrollo local.

### Paso 4: Preparar PostgreSQL

La aplicación necesita un servidor **PostgreSQL 18** accesible con las
credenciales del `.env`. Sirve cualquiera de estas dos opciones:

- **Instalación local** de PostgreSQL 18 ([descargar](https://www.postgresql.org/download/)).
- **Servicio gestionado** (Neon, Supabase, Railway, Render, etc.), que además
  entrega las credenciales y el modo TLS.

Creá la base de datos y completá `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y
`DB_PASSWORD` con esos datos:

```sql
-- Ejemplo con psql contra una instancia local
CREATE DATABASE mi_proyecto;
```

Si el proveedor te da una cadena de conexión del tipo
`postgresql://usuario:clave@host:5432/base?sslmode=require`, no la pegues en
`.env`: separá sus partes en las variables `DB_*` y poné `PGSSLMODE=require`.

Verificá que la aplicación llega a la base:

```bash
yarn db:debug               # muestra la configuración resuelta de la conexión
yarn db:migration:pending   # sí conecta: consulta el estado de las migraciones
```

Si alguno de los dos falla, el problema está en el `.env` o en el acceso de red
al servidor, no en el código.

> **Ojo con los valores vacíos:** `env.example` trae las variables sin valor a
> propósito. `DB_PORT=` vacío se convierte en `0` al leerlo, así que completá
> todas las variables en lugar de dejar solo las que creas necesarias.

### Paso 5: Ejecutar migraciones

Las migraciones crean el esquema (tablas, relaciones e índices). Viven en
`src/migrations` y se ejecutan contra la base configurada en `.env`:

```bash
yarn db:migration:up
```

Comandos disponibles:

```bash
yarn db:migration:pending   # migraciones pendientes
yarn db:migration:list      # historial de migraciones ejecutadas
yarn db:migration:create    # crear una migración vacía
yarn db:migration:down      # revertir la última migración
yarn db:migration:check     # comparar el esquema con las entidades
yarn db:debug               # diagnóstico de la conexión y la configuración
```

> **Estado actual:** el repositorio todavía no contiene migraciones. La primera
> se agrega junto con el cambio de OpenSpec que introduzca la primera entidad; en
> ese momento `yarn db:migration:up` crea el esquema y deja de ser un no-op.

Nunca edites una migración ya aplicada: creá una nueva. Los cambios de esquema
siempre van por migración y nunca por `schema:update`.

### Paso 6: Levantar el servidor

Modo desarrollo, con recarga automática:

```bash
yarn start:dev
```

Modo depuración (`--inspect` en el puerto 9229):

```bash
yarn start:debug
```

Modo producción, compilando primero:

```bash
yarn build
yarn start:prod
```

`yarn build` compila con el CLI de Nest a `dist/` y `yarn start:prod` ejecuta
`node dist/main`.

### Paso 7: Verificar que todo funciona

```bash
curl http://localhost:3000/
```

La respuesta esperada es `Hello World!`, que es el único endpoint expuesto hoy
(`GET /`, el de arranque de NestJS).

La documentación Swagger todavía no está publicada: `@nestjs/swagger` ya está
instalado, pero el `SwaggerModule` se registra en `src/main.ts` en el cambio de
OpenSpec que exponga el primer endpoint del dominio, y cada endpoint posterior se
documenta en el mismo cambio que lo crea. Cuando eso ocurra, la documentación
interactiva quedará disponible en `/api`.

### Paso 8: Ejecutar los tests

```bash
# Tests unitarios
yarn test

# Tests e2e (requiere PostgreSQL accesible, ver Paso 4)
yarn test:e2e

# Cobertura
yarn test:cov

# Modo watch
yarn test:watch
```

Los tests unitarios (`yarn test`) no necesitan Docker ni base de datos. La suite
e2e (`yarn test:e2e`) levanta la aplicación completa, así que necesita PostgreSQL
accesible con las credenciales de tu `.env`. Los tests de integración que
verifican persistencia, restricciones y transacciones usan **Testcontainers**:
levantan PostgreSQL 18 en un contenedor temporal y no tocan tu base de
desarrollo. Si Docker o PostgreSQL no están disponibles, la suite se reporta como
bloqueada; no se reemplaza por mocks, `skip` ni aserciones vacías.

## Calidad de código

Antes de cada commit:

```bash
yarn typecheck   # TypeScript sin emitir archivos
yarn lint        # oxlint type-aware sobre src/ y test/
yarn format      # Prettier sobre src/ y test/
yarn test        # Vitest
```

Además, el repositorio verifica que las referencias entre documentos no queden
rotas:

```bash
yarn check:docs
```

`oxlint` hace cumplir las guardas de arquitectura descritas en `AGENTS.md` §4:
sin ciclos entre módulos, sin `@nestjs/cqrs`, sin excepciones HTTP en
`src/modules/*/domain/**` y sin `any` explícito.

## Estructura del proyecto

```text
src/
├── main.ts                # bootstrap HTTP
├── app.module.ts          # módulo raíz
├── mikro-orm.config.ts    # configuración de MikroORM y migraciones
├── migrations/            # migraciones (se crean con cada cambio de esquema)
├── common/                # base auditable, filtro HTTP global, auditoría
└── modules/
    └── <capacidad>/       # alumnos, profesores, planes, entrenamientos, seguimiento, auth, catalogo
        ├── presentation/  # controllers y DTO
        ├── application/   # casos de uso (comandos y lecturas)
        ├── domain/        # entidades, value objects, reglas, puertos
        └── infrastructure/# repositorios y queries con MikroORM
test/                      # pruebas e2e
docs/                      # dominio y acuerdos del proyecto
openspec/                  # especificaciones y cambios
scripts/                   # gates de CI (reglas de negocio y referencias documentales)
```

La estructura de carpetas, las capas y la dirección permitida de dependencias se
detallan en `AGENTS.md` §5 y en `docs/agreements/arquitectura.md`.

## Flujo de trabajo

1. **Explorar** los specs existentes y la documentación de dominio.
2. **Proponer** un cambio de OpenSpec (`openspec new change <nombre-en-kebab-case>`)
   con `proposal`, `specs`, `design` y `tasks`.
3. **Validar** la planificación: `openspec validate <nombre> --strict`.
4. **Implementar** solo con aprobación explícita, en la rama
   `feature/<change-name>` creada desde `develop`.
5. **Verificar** con `yarn typecheck && yarn lint && yarn test` (y `yarn test:e2e`
   cuando el cambio toque HTTP o base de datos).
6. **Archivar** con `openspec archive <nombre>` cuando todas las tareas estén
   completas.

El repositorio sigue **GitFlow**: `main` conserva las versiones estables y
`develop` integra el trabajo; ninguna de las dos recibe commits directos. Los
commits siguen [Conventional Commits](https://www.conventionalcommits.org/) y
todo commit que implementa un cambio lleva el footer
`Refs: openspec/changes/<change-name>`.

El CI corre en cada push y pull request a `main` y `develop`:

| Workflow | Verificación |
| --- | --- |
| `ci` | `yarn typecheck`, `yarn lint`, tests unitarios y gate de cobertura de reglas (`scripts/check-rules.mjs`) |
| `docs` | `yarn check:docs`: cada referencia entre documentos debe existir |

Cada Pull Request declara las reglas que implementa en una línea
`Reglas: RN-01, RN-05`; el gate exige que cada regla declarada tenga al menos un
test que pase, identificado con el tag `[RN-nn]`. Con `workflow_dispatch` y
`enforce_all_rules` se exige el 100% de las 42 reglas antes del despliegue final.

## Despliegue

El despliegue en producción usa el mismo artefacto que el modo producción local:
`yarn build` genera `dist/` y `yarn start:prod` ejecuta `node dist/main`.

### Requisitos del entorno

- **Node.js 24** y **Yarn 4.18.1** en el entorno de build.
- **PostgreSQL 18** accesible desde la aplicación (servicio gestionado del
  proveedor o instancia propia).
- Las variables de entorno del [Paso 3](#paso-3-configurar-variables-de-entorno)
  definidas en el panel del proveedor, nunca en el repositorio. En producción:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` con las
    credenciales reales.
  - `PGSSLMODE=require` (o `verify-full`) si el proveedor exige TLS.
  - `PORT` solo si la plataforma no lo inyecta por su cuenta.

### Pasos

```bash
# 1. Instalar exactamente lo que fija el lockfile y compilar
yarn install --immutable
yarn build

# 2. Aplicar las migraciones pendientes sobre la base de producción
yarn db:migration:up

# 3. Arrancar el servidor
yarn start:prod
```

El orden importa: las migraciones se aplican **antes** de arrancar la versión
nueva, y `yarn db:migration:pending` sirve para confirmar qué se va a ejecutar.

Verificación posterior al despliegue:

```bash
curl https://<host-de-produccion>/
```

Una respuesta `Hello World!` con estado 200 confirma que el proceso está vivo y
que la conexión a PostgreSQL se estableció durante el arranque.

### Plataformas tipo PaaS (Heroku, Render, Railway)

El repositorio incluye un `Procfile` con el proceso web:

```text
web: yarn start:prod
```

Configuración habitual en el panel del proveedor:

| Ajuste | Valor |
| --- | --- |
| Build command | `yarn install --immutable && yarn build` |
| Start command | `yarn start:prod` (o lo que declare el `Procfile`) |
| Release / pre-deploy command | `yarn db:migration:up` |
| Variables de entorno | las del [Paso 3](#paso-3-configurar-variables-de-entorno) |
| Base de datos | PostgreSQL 18 como servicio gestionado del proveedor |

Si el proveedor no ofrece un paso de release, ejecutá `yarn db:migration:up`
como job previo al despliegue o desde un proceso de una sola ejecución con las
mismas variables de entorno.

### Alternativa: NestJS Mau

El proyecto incluye `@nestjs/mau` y el script `yarn deploy`, que despliega la
aplicación en AWS:

```bash
yarn deploy
```

Es una alternativa al despliegue manual; la configuración de la cuenta y de la
base de datos queda del lado de Mau y de AWS, y las variables de entorno se
cargan en el panel de Mau.

### Checklist antes de desplegar

- [ ] `yarn typecheck && yarn lint && yarn test` en verde.
- [ ] `yarn test:e2e` en verde si el cambio toca HTTP o base de datos.
- [ ] `yarn check:docs` en verde.
- [ ] `yarn db:migration:pending` revisado: se sabe qué migraciones se aplican.
- [ ] Ninguna migración ya aplicada fue editada.
- [ ] `.env` y cualquier credencial fuera del repositorio.
- [ ] `workflow_dispatch` del workflow `ci` con `enforce_all_rules` cuando
      corresponda al despliegue final.

El push, la creación del Pull Request, el merge y el despliegue son decisiones
del equipo: ninguna herramienta del repositorio las ejecuta por su cuenta.

## Autores

Grupo 10 — Ingeniería y Calidad de Software 2026, Facultad Regional de Villa
María:

- Correa, Valentín
- Gómez Ferrero, Andrés
- Letona, Mateo
- Liendo Ortiz, Agustín
- Wursten Gill, Santiago
