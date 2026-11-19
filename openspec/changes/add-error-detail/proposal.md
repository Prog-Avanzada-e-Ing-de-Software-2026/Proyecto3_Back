# Proposal: detalle de error en las respuestas de validación

## Why

Hoy cualquier fallo de validación de entrada responde el mismo `400` con `code: "SOLICITUD_INVALIDA"` y `message: "La solicitud no es válida."`, sin indicar qué campo falló. Un cliente que escribe mal un atributo del cuerpo, que envía un email con formato inválido o que omite un campo obligatorio recibe exactamente la misma respuesta, y no tiene forma de corregir la solicitud sin adivinar.

La causa es que el `ValidationPipe` sí produce el detalle por campo, pero `GlobalExceptionFilter` lo descarta al normalizar toda `HttpException` por código de estado. El efecto es transversal: alcanza a los seis DTO ya expuestos y a todo endpoint futuro, porque el filtro es único por diseño (`http-error-contract`, «Un solo lugar arma la respuesta de error»).

## What Changes

- El cuerpo de error incorpora un campo opcional `errores` con un elemento por campo inválido, cada uno con el campo y un mensaje apto para mostrarse al cliente. El campo aparece solo cuando el fallo proviene de validación de entrada; las demás respuestas conservan el cuerpo de cuatro campos.
- Los mensajes de validación se emiten en español y con vocabulario del dominio, en lugar de los textos por defecto de `class-validator` en inglés. Hoy esos textos no se exponen porque el filtro los descarta.
- Una propiedad del cuerpo no declarada en el DTO pasa de ignorarse en silencio a rechazarse con `400` y una entrada en `errores` que la nombra. Esto incluye las columnas de auditoría: `AGENTS.md` §6.2, regla 3, cambia de «se ignoran» a «se rechazan».
- Una `HttpException` con un estado fuera de la tabla de mensajes deja de responder el texto de fallo inesperado y usa un mensaje acorde a su clase de estado (`4xx` del cliente, `5xx` del servidor).
- La especificación de Swagger de los endpoints alcanzados documenta el `400` con `errores`, según `docs/agreements/buenas_practicas.md` §4.

## Capabilities

### New Capabilities

Ninguna. El comportamiento pertenece a una capacidad existente.

### Modified Capabilities

- `http-error-contract`: el requisito «Cuerpo único de respuesta de error» admite `errores` en los fallos de validación; se agregan requisitos para el detalle por campo, el rechazo de propiedades no declaradas y la coherencia del mensaje genérico con el estado de las excepciones HTTP no previstas.

## Impact

- **Código:** `src/main.ts` (opciones del `ValidationPipe`), `src/common/presentation/global-exception.filter.ts` (cuerpo y mensajes), un módulo nuevo o ampliado en `src/common/presentation/` para traducir los errores del `ValidationPipe` al contrato, y la documentación Swagger de los controllers alcanzados.
- **Contratos HTTP:** el cuerpo de error gana un campo opcional; dos comportamientos de entrada cambian (propiedades desconocidas rechazadas, mensajes de validación en español). El `code` y el `message` del `400` de validación se mantienen estables. El backend todavía no tiene consumidores, así que ningún cambio de forma se declara como ruptura.
- **Documentación normativa:** `AGENTS.md` §5.6 y §6.2, regla 3, que hoy fijan `forbidNonWhitelisted` desactivado y el descarte silencioso de campos no declarados.
- **Pruebas:** `src/common/presentation/global-exception.filter.spec.ts`, `test/probe.e2e-spec.ts`, `test/auth.e2e-spec.ts` y `test/roles-permisos.e2e-spec.ts`; el arnés e2e repite el `ValidationPipe` y debe reflejar las mismas opciones que `main.ts`.
- **Sin migraciones ni cambios de dependencias.**

## Fuera de alcance

- Exponer un código por regla de validación (por ejemplo `EMAIL_INVALIDO`): el detalle vive en `errores` y el `code` sigue siendo de la clase de fallo.
- Internacionalización de mensajes: una sola redacción en español, sin negociación de idioma por cabecera.
- Detallar el cuerpo de los `400` que emite un dominio o una aplicación con `ErrorSemantico`: ese mensaje ya es explícito y no es una validación de transporte.
- Cambiar la política de credenciales de `HU 14`: un email con formato inválido sigue siendo un rechazo de formato y no revela si la cuenta existe.
- Revisar el resto de los códigos de error de negocio ya expuestos.

## Trazabilidad

- `HU 14`, criterio «Ante credenciales inválidas, el sistema debe informarlo sin indicar cuál de los dos datos falló»: se respeta; el detalle de `errores` describe formato y presencia, nunca la existencia de la cuenta.
- No hay `RN-nn` que regule los mensajes de error HTTP; la materia se rige por `openspec/specs/http-error-contract/` y `AGENTS.md` §5.6 y §6.2.
