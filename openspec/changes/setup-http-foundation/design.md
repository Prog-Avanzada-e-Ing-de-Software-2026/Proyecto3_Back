# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `src/` solo contiene el bootstrap de NestJS: `main.ts` crea la aplicación sin `bufferLogs`, `AppModule` registra `MikroOrmModule.forRoot` y el único endpoint es `GET /`.
- No existe `src/common/`, ni filtro global, ni errores semánticos, ni logger estructurado.
- No existe ninguna capacidad especificada: `openspec/specs/` está vacío.
- Stack instalado: NestJS 12.1.3, Express 5.2.1, TypeScript 6.0.3, Vitest 4.1.12, Node 24, Yarn 4.18.1.
- **El arnés e2e está roto en `develop`, antes de este cambio.** `yarn test:e2e` falla con `SyntaxError: Invalid or unexpected token` al compilar el módulo de pruebas. Causa diagnosticada: `entitiesTs: ['./src/**/*.entity.ts']` hace que MikroORM importe `src/mock/mock.entity.ts` mediante el cargador ESM nativo de Node 24, cuyo *type stripping* rechaza los decoradores legacy. Verificado: con `entitiesTs` vacío el módulo compila, y con `NODE_OPTIONS="--import @swc-node/register/esm-register"` la suite e2e existente pasa.

## Goals / Non-Goals

**Goals:**

- Dejar un contrato de error HTTP único y un logger estructurado que cualquier capacidad posterior consuma sin redefinirlos.
- Que `yarn test:e2e` quede verde, porque sin arnés HTTP funcional no se puede demostrar ninguno de los dos comportamientos.
- Mantener el cambio acotado a `src/common/`, `src/main.ts`, `src/app.module.ts` y el arnés de pruebas.

**Non-Goals:**

- `ValidationPipe`, `SwaggerModule`, autenticación, cookies, autorización y persistencia.
- Cualquier endpoint funcional nuevo, incluido `/health`.
- La traducción de excepciones del driver u ORM a errores semánticos dentro de `infrastructure/`: no hay todavía ningún puerto de persistencia que las produzca. La regla queda vigente y se implementa con la primera entidad, en `add-usuario-identity`.
- Retirar `MockEntity` o cambiar `mikro-orm.config.ts` más allá de lo necesario para las pruebas.

## Decisions

### D1 — Pino mediante `nestjs-pino`, con `pino-http`

`nestjs-pino` 5.3.1 declara compatibilidad con `@nestjs/core` y `@nestjs/common` `^12.0.2`; el repositorio tiene 12.1.3 instalado. Trae `pino-http` para el registro de solicitudes, `redact` nativo y un logger compatible con la interfaz `Logger` de NestJS.

**Alternativas descartadas:**

- `nest-winston`: requiere armar a mano el middleware HTTP y la redacción; más superficie para el mismo resultado.
- Logger propio sobre `pino` sin integración Nest: obliga a inyectar el logger en cada componente y no captura los logs de bootstrap del framework.
- `pino` puro con `app.use(pinoHttp)`: pierde la integración de dependencias y el tipado de Nest; se volvería a envolver en un provider, es decir, `nestjs-pino` escrito a mano.

### D2 — Orden interno: logger primero, filtro después

El filtro global es el principal consumidor del logger: registra trazas de 5xx y arma la respuesta de error. Se instala y configura Pino antes de escribir el filtro para no construirlo dos veces ni cambiar su dependencia a mitad de camino.

**Alternativa descartada:** filtro con `Logger` de Nest sin Pino y sustitución posterior; toca el mismo archivo dos veces y deja un commit intermedio cuyo comportamiento no es el final.

### D3 — Errores semánticos con categoría y código estable

La base de errores semánticos vive en `src/common/domain/errors/`. Cada error declara una **categoría** —`no_encontrado`, `conflicto`, `no_autenticado`, `prohibido`, `entrada_invalida`, `inesperado`— y un **código** estable en mayúsculas (`PLAN_SOLAPADO`, `USUARIO_DADO_DE_BAJA`, ...). No conoce HTTP.

**Alternativas descartadas:**

- Extender `HttpException` en dominio/aplicación: `AGENTS.md` §5.4 y la regla de oxlint lo prohíben; además acopla la regla de negocio al transporte.
- Devolver resultados `{ ok: false }`: `AGENTS.md` §4 y §8 exigen que el error se lance.
- Que cada error cargue su propio estado HTTP: filtra la decisión de transporte hacia adentro y rompe la traducción única.

### D4 — Contrato de error: cuerpo de cuatro campos

Cuerpo: `{ statusCode, code, message, requestId }`.

**Alternativa descartada:** RFC 9457 (`application/problem+json`, `type`/`title`/`detail`/`instance`). Es el estándar y sería defendible, pero agrega campos cuyo significado el frontend todavía no consumió y obliga a inventar URIs de `type` para códigos que aún no existen. Queda como pregunta abierta; migrar después es un cambio de contrato, no de arquitectura.

### D5 — El filtro normaliza también las excepciones del framework

El filtro distingue tres entradas:

1. Error semántico → traducción por categoría.
2. `HttpException` emitida por el framework (por ejemplo el 404 del router, y más adelante el 400 del `ValidationPipe`) → se normaliza al mismo cuerpo, con un código derivado del estado.
3. Cualquier otra cosa → 500 genérico.

**Por qué:** sin el punto 2, una ruta inexistente pasaría de 404 a 500. El punto 2 no habilita a los controllers a lanzar `HttpException`: la regla de §5.4 sigue vigente y se verifica en revisión.

### D6 — Filtro registrado como `APP_FILTER`, logger inyectado por la interfaz de Nest

`APP_FILTER` en lugar de `app.useGlobalFilters(new ...)` en `main.ts`: permite inyección de dependencias, se comporta igual en pruebas que en producción y no obliga a duplicar el registro en cada módulo de prueba.

El filtro depende de `Logger` de `@nestjs/common` —respaldado por Pino— y no de `PinoLogger`. Mantiene el filtro independiente del proveedor de logging y testeable con un doble.

### D7 — Identificador de solicitud: uno solo, resuelto en un punto

Se acepta `X-Request-Id` entrante solo si cumple `^[A-Za-z0-9_-]{8,64}$`; en caso contrario se genera un UUID. La resolución vive en un middleware pequeño de `common/presentation/`, que deja el valor en la solicitud y lo escribe en la respuesta. `pino-http` usa ese mismo valor como `genReqId`, de modo que el `requestId` del cuerpo de error y el de los logs no pueden divergir.

**Alternativas descartadas:**

- Aceptar cualquier valor entrante: permite inyección de contenido arbitrario en logs y cabeceras.
- Generar siempre uno nuevo: rompe la correlación con un proxy o con el frontend.

### D8 — La petición y la respuesta nunca se registran en bruto

`pino-http` se configura con un serializador de `req` que conserva solo método, ruta e identificador, y con `redact` para `req.headers.cookie`, `req.headers.authorization`, `res.headers["set-cookie"]` y los campos sensibles habituales. No se registran cuerpos.

**Por qué:** la lista de campos sensibles crece (contraseña, DNI, tokens de recuperación). No registrar cuerpos convierte la redacción en una segunda barrera en lugar de la única.

### D9 — Salida JSON de una línea en todos los entornos

Sin `pino-pretty`. El formato legible en desarrollo agrega una dependencia y hace que el entorno local no ejercite el formato que verá Heroku.

### D10 — Nivel por entorno con reserva segura

`LOG_LEVEL` con lista blanca (`fatal|error|warn|info|debug|trace|silent`); si falta, `info`; si el valor no está en la lista, `info` y un aviso único. Un valor inválido no puede impedir el arranque.

### D11 — Registro único del fallo

El filtro registra el error: 5xx con traza y causa, 4xx con código y mensaje sin traza. `pino-http` registra el evento de finalización de la solicitud con su estado, sin repetir la traza.

**Alternativa descartada:** que `pino-http` registre también el error vía `req.err`; duplica el evento y hace ambiguo cuál es la causa.

### D12 — Arnés de pruebas: `@swc-node/register` para el cargador ESM

Se agrega `--import @swc-node/register/esm-register` a la ejecución de Vitest (dependencia ya instalada, hoy sin uso). Con eso el cargador nativo de Node compila los `.ts` con decoradores que MikroORM importa por ruta absoluta y la suite existente pasa. Verificado manualmente antes de este diseño.

**Alternativa descartada:** apuntar `entitiesTs` a `[]` en pruebas. Deja de ejercitar el descubrimiento real de entidades y traslada el problema a la primera entidad de verdad.

**Alternativa descartada:** un `setupFiles` con un plugin de Vite. No alcanza: el import problemático lo ejecuta el cargador nativo, fuera del grafo de transformación de Vite.

### D13 — Pruebas del cambio no dependen de `AppModule`

`AppModule` arrastra `MikroOrmModule.forRoot` y, por lo tanto, base de datos. Las pruebas HTTP del filtro y del logger usan un módulo de Nest mínimo con `LoggerModule` y un controller de sonda en `test/support/`. La suite e2e existente (`test/app.e2e-spec.ts`) se conserva como regresión del arnés y sigue usando `AppModule`.

## Módulos, entidades y migraciones afectadas

- `src/common/domain/errors/`: base de errores semánticos y categorías. **Sin** dependencias de Nest ni de HTTP.
- `src/common/presentation/`: filtro global, middleware de identificador de solicitud y opciones de `pino-http`.
- `src/app.module.ts`: registro de `APP_FILTER` y `LoggerModule`.
- `src/main.ts`: `bufferLogs` y `useLogger`.
- `test/support/`: módulo y controller de sonda para HTTP.
- `package.json`, `vitest.config.ts`, `vitest.config.e2e.ts`: dependencias y banderas del cargador.
- **Entidades:** ninguna. **Migraciones:** ninguna. **Base de datos:** no se toca.

## Risks / Trade-offs

- **[Compatibilidad de `nestjs-pino`]** Su peer exige `@nestjs/core` y `@nestjs/common` `^12.0.2`, mientras `package.json` declara `^12.0.1`. → Instalado 12.1.3, compatible. Fijar la versión mínima en el cambio si aparece un warning de peer.
- **[Cargador nativo de Node 24]** Cualquier import dinámico de `.ts` con decoradores fuera de Vite vuelve a romper el arnés. → La bandera de `@swc-node/register` queda en los scripts de prueba, no en una nota.
- **[Redacción por lista negra]** Un campo sensible nuevo puede filtrarse si se registra en bruto. → No se registran cuerpos; el serializador de `req` es de lista blanca.
- **[Taxonomía especulativa]** Crear errores concretos sin consumidor. → Solo se crea la base y las categorías; cada error concreto nace con su caso de uso.
- **[Ruido de logs]** `autoLogging` registra también sondas de infraestructura. → Se configura `ignore` para rutas de salud cuando existan; hoy no hay.
- **[Punto 2 de D5]** Normalizar `HttpException` del framework podría usarse como atajo para lanzar HTTP desde capas internas. → Se revisa en el PR; el lint de §4 ya bloquea `@nestjs/common` en `domain/`.
- **[Contrato de error sin consumidor]** El frontend todavía no acordó el cuerpo. → Contrato mínimo y documentado; cualquier cambio se hace en un cambio de OpenSpec posterior.

## Migration Plan

1. Agregar dependencias y la bandera del cargador; verificar que `yarn test` y `yarn test:e2e` siguen verdes antes de tocar `src/`.
2. Registrar `LoggerModule` y el logger de bootstrap; verificar arranque.
3. Incorporar errores semánticos, middleware de identificador y filtro; registrar `APP_FILTER`.
4. Ejecutar `yarn typecheck && yarn lint && yarn test && yarn test:e2e`.

**Rollback:** revertir los commits del cambio. No hay migraciones ni datos, así que el rollback es completo: la API vuelve al manejo de errores por defecto de Nest y los logs vuelven a `ConsoleLogger`. Retirar `LOG_LEVEL` del entorno es inocuo.

## Open Questions

- Forma definitiva del cuerpo de error acordada con el frontend. Se resuelve al integrar el primer endpoint funcional, sin cambiar el enfoque de este diseño.
