# Proposal

## Why

El cliente solo obtiene el rol y los permisos del usuario en el momento del login o de una renovación. Si el usuario recarga la página, o si el front necesita revalidar lo que muestra sin forzar una renovación de la sesión, hoy no tiene forma de preguntar quién está autenticado: tendría que llamar a `/refresh`, que emite un token nuevo y hace trabajo que nadie pidió.

## What Changes

- Se expone **`GET /api/auth/me`**, que devuelve el usuario autenticado con su rol y sus permisos efectivos.
- La respuesta usa **la misma proyección que el login y la renovación** (`id`, `email`, `rol`, `permisos`), para que el cliente tenga un solo tipo.
- La operación **no emite cookies ni tokens**: solo lee.
- Se reutiliza la lectura que ya usa la renovación, renombrada para que su nombre no diga «refresh» cuando también sirve a una consulta.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `autenticacion-sesion`: se agrega el comportamiento observable de consultar al usuario autenticado sin renovar la sesión.

## Impact

- **Código afectado:** `src/modules/auth/presentation/auth.controller.ts` (un método), el caso de uso de lectura de la sesión y los tests e2e de autenticación.
- **Base de datos:** sin cambios.
- **API:** un endpoint nuevo bajo el prefijo existente. No modifica ninguno de los contratos actuales.
- **Fuera de alcance:**
  - Editar el perfil propio: no lo pide ninguna historia y abre una superficie de escritura que hoy no existe.
  - Devolver datos de `Alumno` o `Profesor`: dependen de las altas, que todavía no tienen contrato.
  - Refrescar el token de forma transparente desde este endpoint.
