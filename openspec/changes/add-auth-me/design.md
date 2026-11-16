# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `RefreshSesionUseCase` ya resuelve lo que la consulta necesita: recibe un identificador, relee el `Usuario`, rechaza al que está dado de baja o cuyo rol lo está, y devuelve `SesionOtorgada` (`id`, `email`, `rol`, `permisos`).
- El guard deja el identificador del actor en la petición (`@ActorActual()`), y ya rechazó la sesión inválida o de un usuario dado de baja antes de llegar al handler.
- `LoginUseCase` y `RefreshSesionUseCase` comparten la proyección `sesionOtorgadaDe()`.

## Goals / Non-Goals

**Goals:**

- Que el cliente tenga un único tipo de respuesta para «quién soy», sin emitir tokens.
- No agregar un segundo camino de lectura del usuario.

**Non-Goals:**

- Datos de perfil de alumno o profesor.
- Refresco transparente.

## Decisions

### D1 — Se reutiliza el caso de uso de la renovación, renombrado

`RefreshSesionUseCase` pasa a llamarse `ReadSesionUseCase` y lo usan los dos endpoints: la renovación le suma la emisión de la cookie, y la consulta solo devuelve su resultado.

**Por qué:** el caso de uso no renueva nada —eso lo hace el controller emitiendo la cookie—; lo que hace es leer la sesión vigente del usuario. Con el nombre actual, usarlo desde `/me` mentiría sobre lo que hace, y duplicarlo dejaría dos lecturas del mismo agregado que se pueden desincronizar.

**Alternativas descartadas:**

- **Un `GetMeUseCase` nuevo:** duplica la lectura y la proyección para devolver lo mismo.
- **Leer el usuario que el guard ya dejó en la petición:** el guard expone una forma estructural (`id` y `permisosEfectivos()`) pensada para autorizar, sin el email ni el nombre del rol; devolverlo obligaría a ampliar ese contrato compartido por el bien de un endpoint.

### D2 — La respuesta es la misma proyección del login y la renovación

`GET /api/auth/me` devuelve `SesionOtorgada`.

**Por qué:** el cliente ya tiene ese tipo para el login y el refresh; uno distinto para los mismos datos obliga a mapear en el front sin ganar nada.

**Alternativas descartadas:**

- **Devolver el `Usuario` completo:** expone el hash y las columnas de auditoría.
- **Devolver solo `permisos`:** deja al front sin el rol, que es lo que usa para la navegación (`HU 14`).

### D3 — No lleva `@Public()` ni permiso declarado

La ruta queda protegida por el guard como cualquier otra y no declara `@RequierePermiso`.

**Por qué:** consultar la identidad propia no es una operación administrativa; exigir un permiso dejaría a cualquier usuario sin acceso a sus propios datos. El rechazo del usuario dado de baja lo resuelve el guard, que relee el `Usuario` en cada petición.

## Risks / Trade-offs

- **[Consulta por request]** Cada llamada cuesta una lectura del usuario con su rol y permisos. → Es la misma que ya hace el guard en esa petición; si el volumen lo justificara, el guard podría exponer el `Usuario` completo, que es exactamente la alternativa descartada en `D1` y se reevaluaría junto con la autorización.
- **[Renombre]** El renombre de `RefreshSesionUseCase` toca el módulo y el controller. → Cubierto por los e2e existentes de renovación, que no cambian de contrato.

## Migration Plan

Sin migraciones ni configuración nueva. **Rollback:** revertir el commit; el endpoint desaparece y los demás contratos quedan igual.

## Open Questions

Ninguna.
