# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `GlobalExceptionFilter` es el único lugar que arma cuerpos de error y está registrado como `APP_FILTER`. `construirCuerpo` tiene tres ramas: `ErrorSemantico`, `HttpException` (mensaje fijo por estado) y cualquier otra cosa → `500`.
- El `ValidationPipe` se registra en `src/main.ts` con `{ transform: true, whitelist: true }` y esas mismas opciones están copiadas en `test/auth.e2e-spec.ts:90` y `test/roles-permisos.e2e-spec.ts:165`. La duplicación ya figuraba como riesgo aceptado en el design de `implement-login` (arnés duplicado).
- `class-validator` produce los mensajes por defecto en inglés, indexados por nombre de restricción (`isEmail`, `isNotEmpty`, `whitelist`, …). Hoy nadie los lee: el filtro descarta `exception.getResponse()`.
- Los seis DTO vigentes son planos; ninguno declara DTOs anidados.
- `test/probe.e2e-spec.ts:68` compara las claves exactas del cuerpo (`code`, `message`, `requestId`, `statusCode`) en fallos semánticos, y `test/auth.e2e-spec.ts:331` fija hoy que un campo no declarado se descarta en silencio.
- `AGENTS.md` §5.6 y §6.2 fijan `forbidNonWhitelisted` desactivado y que los campos no declarados «se ignoran».

## Goals / Non-Goals

**Goals:**

- Que el detalle por campo llegue al cliente sin que ningún controller lo arme y sin que el filtro deje de ser el único constructor del cuerpo.
- Que los DTOs sigan declarando solo formato y presencia, sin arrastrar una redacción de mensaje por decorador.
- Que las opciones de validación tengan una sola fuente, compartida por `main.ts` y los arneses e2e.
- Que el detalle sea determinista, en español y sin filtrar valores ni identificadores técnicos.

**Non-Goals:**

- Un `code` por regla de validación o por campo.
- Traducir en el filtro los mensajes de `ErrorSemantico`: esos ya los redacta el dominio o la aplicación.
- Validar parámetros de ruta o de consulta: hoy no existe ningún DTO que los reciba; el mecanismo queda listo para cuando exista.
- Cambiar la redacción del `401` de credenciales.

## Decisions

### D1 — El detalle viaja en una excepción de presentación, no en una `HttpException` cruda

Se agrega `EntradaInvalidaException extends BadRequestException` en `src/common/presentation/validation/`, que transporta `errores: DetalleValidacion[]` (`{ campo, mensaje }`). El filtro la reconoce con un guard tipado (`esErrorConDetalle`) antes de la rama `HttpException` y agrega `errores` al cuerpo.

**Por qué:** el filtro sigue siendo el único constructor del cuerpo (requisito «Un solo lugar arma la respuesta de error») y el detalle viaja como dato tipado, sin que el filtro tenga que interpretar la forma interna de `getResponse()`, que es un detalle de `ValidationPipe` y no un contrato del proyecto.

**Alternativas descartadas:**

- **Leer `getResponse()` en la rama `HttpException`:** acopla el filtro al payload interno de Nest y haría que cualquier `BadRequestException` lanzada en cualquier punto se intente interpretar como validación.
- **Un `ErrorSemantico` de categoría `entrada_invalida` con `detalles`:** mete una preocupación de transporte en `common/domain` y obliga a ampliar el error semántico base para algo que no es una regla del gimnasio.

### D2 — El mensaje vive en el decorador del DTO; el traductor solo lo transporta

Cada decorador de validación del DTO declara su `message` en español. El `exceptionFactory` no mantiene diccionario: convierte cada `ValidationError` en `{ campo, mensaje }` tomando `constraints[restricción]` tal cual, que es el texto que `class-validator` ya resolvió. La única redacción central es la de la restricción `whitelist`, que la inyecta el `ValidationPipe` y no proviene de ningún decorador.

**Por qué:** el mensaje es parte del contrato HTTP y ese contrato lo declara el DTO, así que vive al lado de la regla que lo produce. La redacción gana precisión por campo —«La contraseña es obligatoria» frente a un genérico por tipo de restricción— y desaparece la tabla que había que mantener sincronizada con los DTOs.

**El riesgo y cómo se cierra:** un decorador sin `message` expondría el texto inglés por defecto de `class-validator`. Un test recorre los DTO con `getMetadataStorage()` (exportado por `class-validator`) y falla si algún decorador de validación no declara `message`; las validaciones condicionales, como `@IsOptional()`, no generan mensaje y quedan fuera del control. El gate reemplaza la disciplina.

La clave real de la restricción de `whitelist` es `ValidationTypes.WHITELIST` —vale `whitelistValidation`, no `whitelist`—, así que el traductor la toma del enumerado exportado en lugar de un literal: un literal pasaba el test unitario con un error inventado y fallaba en el e2e contra el pipe real.

**Alternativas descartadas:**

- **Mapa central de restricción a mensaje:** redacción uniforme pero sin precisión por campo, una restricción nueva sin entrada cae en un genérico, y la tabla se desincroniza de los DTOs.
- **Las dos fuentes a la vez:** exige una regla de precedencia que hay que explicar y probar, sin ventaja sobre la primera.
- **Internacionalización con `i18n`:** dependencia y negociación de idioma para una sola redacción en español (ver «Fuera de alcance» del proposal).

### D3 — Una entrada por restricción incumplida y orden estable

Cada `ValidationError` de primer nivel puede traer varias restricciones; se emite una entrada por cada una. Antes de responder se ordena por `campo` y luego por nombre de restricción.

**Por qué:** el requisito promete orden estable entre solicitudes equivalentes, y el orden de `ValidationError[]` depende del descubrimiento de metadatos. Ordenar es más barato y más honesto que confiar en él.

### D4 — Se recorren los `children` de un DTO anidado

Las entradas de un `ValidationError` con `children` se emiten con el campo compuesto por puntos (`direccion.calle`).

**Por qué:** `ValidationPipe` produce `children` para DTOs anidados y descartarlos sería un agujero silencioso que el requisito de detalle por campo prohíbe. Hoy ningún DTO es anidado; el costo es acotado y evita reabrir el filtro cuando aparezca el primero.

### D5 — `forbidNonWhitelisted: true`, con `AGENTS.md` actualizado en el mismo cambio

La propiedad no declarada deja de descartarse y pasa a rechazarse con `400` y una entrada en `errores`. `AGENTS.md` §6.2, regla 3, pasa de «se ignoran» a «se rechazan» y §5.6 deja de describir la opción como desactivada. El criterio de «no declarada» es el de `class-validator`: toda propiedad del objeto que no tenga **ningún** metadato de validación en la clase. Una propiedad declarada sin validadores se descarta igual y, si debe admitirse tal cual, se marca con `@Allow()`.

**La opción es global y no se configura por DTO.** Se declara una vez en el `ValidationPipe` y alcanza a todo DTO de entrada. La obligación por DTO es otra: cada propiedad que deba aceptarse necesita al menos un decorador de validación —sin decoradores no hay metadatos y el pipe la trata como no declarada— y, según D2, su `message` en español. Un DTO tipado como interfaz o `any` queda fuera del pipe por completo, porque `ValidationPipe.toValidate` no valida metatipos que no sean clase; de ahí la exigencia de `AGENTS.md` §5.6 de declarar los DTO como clase.

**Por qué:** es el síntoma original. Con el descarte silencioso, un atributo mal escrito se manifiesta como «falta `email`», que es un mensaje correcto pero que esconde la causa real. **Consecuencia asumida:** un cliente que mande columnas de auditoría o campos sobrantes recibe `400`; el cambio es deliberado y, mientras no existan consumidores del backend, no se declara como ruptura.

**Alternativa descartada:** dejar la opción desactivada y confiar en el detalle de «campo obligatorio ausente». El cliente seguiría sin enterarse de que escribió mal el nombre del campo.

### D6 — Las opciones de validación tienen una sola fuente

Se extrae la construcción del `ValidationPipe` a `src/common/presentation/validation/` y la usan `src/main.ts` y los dos arneses e2e que hoy la duplican. `test/probe.e2e-spec.ts` no registra `ValidationPipe` y no cambia.

**Por qué:** este cambio modifica esas opciones; mantener tres copias garantiza que la próxima modificación deje una suite verde midiendo otra cosa.

### D7 — El mensaje genérico depende de la clase del estado, no solo de la tabla

En la rama `HttpException`, un estado sin mensaje declarado usa el genérico de fallo interno solo si es `5xx`; para `4xx` usa un genérico de solicitud rechazada. El `code` derivado del estado (`ERROR_HTTP`) no cambia.

**Por qué:** hoy un `405` o un `415` responden con el texto de fallo inesperado y estado de cliente, lo que confunde al cliente y contradice el requisito de que el mensaje sea apto para mostrarse.

**Alternativa descartada:** ampliar las tablas con más estados. No cubre los que aparezcan después y no arregla la incoherencia de fondo.

### D8 — El `400` con detalle se documenta una vez en Swagger

Un decorador compartido declara el esquema del `400` con `errores` y se aplica a los endpoints que reciben cuerpo.

**Por qué:** `docs/agreements/buenas_practicas.md` §4 exige que la documentación acompañe al comportamiento; seis esquemas copiados divergen a la primera corrección.

## Risks / Trade-offs

- **[Campo `errores` en un cuerpo que antes tenía cuatro propiedades]** → aparece solo en fallos de validación; el resto del contrato queda intacto y no hay consumidores del backend que dependan de la forma anterior.
- **[Una versión más estricta del cuerpo rechaza campos sobrantes]** → es el comportamiento buscado; se actualiza la regla de `AGENTS.md`, el test que fijaba el descarte y la documentación Swagger.
- **[El detalle de credenciales revela si la cuenta existe]** → los mensajes describen formato y presencia, nunca existencia ni el valor recibido; se cubre con un test dedicado y `HU 14` queda intacta.
- **[Un `400` semántico se confunde con una validación]** → `errores` solo aparece cuando la excepción lo transporta; se verifica con el `SIN_CAMBIOS` de `PATCH /api/roles/:id`, que debe conservar cuatro claves.
- **[El nombre real de la restricción de `whitelist` no es el nombre público]** → el traductor usa `ValidationTypes.WHITELIST` del enumerado exportado y el e2e lo comprueba contra el pipe real, que fue lo que detectó la diferencia entre `whitelist` y `whitelistValidation`.
- **[Deriva entre el arnés e2e y `main.ts`]** → D6 la elimina como categoría de defecto.

## Migration Plan

Sin migraciones de datos ni cambios de esquema. El despliegue es una única versión del backend; el rollback consiste en revertir los commits del cambio, sin estado persistido que restaurar. Los clientes deben tolerar un campo opcional nuevo y un cuerpo más estricto; ambos efectos se documentan en Swagger y en el proposal.

## Open Questions

- La redacción exacta de cada mensaje se fija en la implementación y se cubre con tests; no altera el contrato ni el desglose de tareas.
