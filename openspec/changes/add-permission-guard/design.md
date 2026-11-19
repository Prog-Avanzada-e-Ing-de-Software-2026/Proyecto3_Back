# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `AuthGuard` está registrado como `APP_GUARD` en `AuthModule` y aplica a toda la aplicación. Lee la cookie `access`, verifica firma y tipo, **carga el `Usuario` con su rol y sus permisos** (`findById` con `populate`) y deja en la petición solo `request.actorId`.
- `@Public()` ya usa el patrón de metadata + `Reflector.getAllAndOverride`, y es la única forma en que el guard distingue una ruta abierta.
- `Usuario.permisosEfectivos()` devuelve los permisos vigilantes del rol, excluyendo los dados de baja.
- `GlobalExceptionFilter` traduce `prohibido` a `403`; el arnés de sonda ya demuestra el cuerpo y el código.
- No hay ninguna ruta que declare un permiso.

## Goals / Non-Goals

**Goals:**

- Que declarar un permiso sea una línea en el handler, y olvidarlo signifique una operación sin restricción visible en revisión.
- Un solo acceso a la base por petición: el usuario que la sesión ya cargó es el que autoriza.

**Non-Goals:**

- Reglas de pertenencia al recurso (`RN-12`, `RN-35`): no dependen del rol.
- Cache de permisos por rol.

## Decisions

### D1 — Un solo guard aplica sesión y permiso

`AuthGuard` sigue siendo el único `APP_GUARD` y ahora también evalúa el permiso declarado. La alternativa era un `PermisoGuard` posterior que leyera el usuario que el primero dejó en la petición.

**Por qué:** un segundo guard depende del orden de registro de los `APP_GUARD` para no evaluar permisos de una sesión inexistente, y ese orden es un detalle de configuración que nadie revisa. Con un guard, la secuencia `401` antes de `403` es una consecuencia del código, no de la posición en un arreglo.

**Alternativas descartadas:**

- **`PermisoGuard` separado leyendo `request.usuario`:** separa responsabilidades, pero introduce un acoplamiento por orden y una segunda condición de error si el primero no corrió.
- **Guard por controller con `@UseGuards`:** vuelve al default abierto; el olvido no se detecta.

### D2 — El permiso exigido es metadata del handler

`@RequierePermiso(nombre)` escribe el nombre con `SetMetadata`, y el guard lo lee con `getAllAndOverride` sobre handler y clase, igual que `@Public()`.

**Por qué:** la política queda declarada junto a la ruta, y un permiso declarado en la clase se puede sobrescribir en el método. Una lista de rutas en configuración habría que mantenerla sincronizada con los controllers.

**Alternativas descartadas:**

- **Un `enum` de permisos y una tabla ruta→permiso:** segunda fuente de verdad frente al catálogo persistido.
- **Un permiso por verbo HTTP:** el permiso nombra una operación del negocio; `POST` no es «dar de alta un alumno».

### D3 — El guard expone el usuario resuelto, no solo su identificador

La petición autenticada pasa a llevar el `Usuario` cargado; `request.actorId` se conserva derivado para no romper `@ActorActual()`.

**Por qué:** el guard ya pagó la consulta y hoy la descarta. Guardar el usuario permite autorizar sin una segunda lectura y deja disponible el mismo dato que el caso de uso necesita para la auditoría.

**Alternativas descartadas:**

- **Volver a consultar en el guard de permiso:** duplica la lectura por petición.
- **Llevar los permisos como `string[]` en la petición:** alcanza para autorizar, pero pierde el resto del agregado que el guard ya tiene y obliga a otra consulta si un caso de uso lo necesita.

### D4 — El permiso se busca por nombre en los permisos efectivos

La comprobación es `usuario.permisosEfectivos().some(permiso => permiso.nombre === requerido)`, con comparación exacta sobre el nombre del catálogo.

**Por qué:** es la lectura literal de `identidad-usuario` («la autorización se decide por la presencia de un permiso»), y deja fuera a los permisos dados de baja y a los roles dados de baja, que `permisosEfectivos()` ya filtra.

## Risks / Trade-offs

- **[Código sin consumidor]** El guard se entrega antes que la primera ruta que lo use, que llega en `add-alta-alumno`. → Se prueba contra un endpoint de sonda en el arnés e2e, que es un consumidor real para la verificación; si `add-alta-alumno` no se abre, queda una pieza probada pero inerte.
- **[Nombre de permiso como cadena]** Un nombre mal escrito en el decorador compila y deja la operación abierta a cualquiera, porque ningún usuario tendría ese permiso. → Las constantes de `src/seeder/catalogos.ts` son la fuente de los nombres y las tareas exigen usarlas en el decorador; el escenario «sin el permiso» del arnés falla si el nombre no matchea.
- **[Un permiso por operación]** Operaciones que exigen dos permisos no se pueden expresar. → No hay ninguna en el MVP; si aparece, se agrega una variante que reciba una lista, no un permiso compuesto inventado.

## Migration Plan

Sin migraciones ni cambios de configuración: es código nuevo sobre rutas existentes que no declaran permisos. **Rollback:** revertir el commit; ninguna ruta cambia de comportamiento porque ninguna declara un permiso todavía.

## Open Questions

Ninguna.
