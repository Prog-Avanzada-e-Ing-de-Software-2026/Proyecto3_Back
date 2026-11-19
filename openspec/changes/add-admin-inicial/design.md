# Design

## Context

Ver `proposal.md` — Why. El estado actual que condiciona el enfoque:

- `IUsuarioRepository` expone `findByEmail` y `findById`, ambos con `filters: false`: ven al usuario dado de baja, que es lo que exige el login.
- No hay ningún caso de uso que cree un `Usuario`; el único camino de alta que existe es el seed del catálogo, que crea roles y permisos.
- `IPasswordHasher` ya envuelve argon2id con los parámetros del proyecto.
- `AGENTS.md` §5.2: `seeder/` contiene solo entrypoints que resuelven casos de uso; la lógica vive en el módulo.

## Goals / Non-Goals

**Goals:**

- Que una instalación nueva sea usable sin tocar SQL.
- Que el alta del usuario quede donde la van a reusar las historias de alta de alumno y profesor.

**Non-Goals:**

- Cambiar la contraseña de un administrador existente.
- Crear perfiles de `Alumno` o `Profesor`.

## Decisions

### D1 — Dos variables de entorno, validadas por el seed

`ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_PASSWORD`, leídas por el seed. Si falta alguna, o la contraseña tiene menos de 8 caracteres, el proceso falla con un mensaje explícito antes de escribir.

**Por qué:** la credencial no puede viajar en el repositorio, y un seed con un valor por defecto terminaría creando un administrador con una contraseña conocida.

**Alternativas descartadas:**

- **Credencial fija en el código:** un administrador con contraseña pública en cualquier entorno.
- **Argumentos de línea de comandos:** quedan en el historial del shell y en la lista de procesos.

### D2 — El alta es un caso de uso, no lógica del seed

`CreateUsuarioUseCase` resuelve el rol, verifica el email, hashea y persiste. El seed solo lo invoca.

**Por qué:** `AGENTS.md` §5.2 lo exige para todo seed, y es el mismo camino que van a usar las altas de alumno y profesor para crear el `Usuario` de la persona. Escribirlo dentro del seed obligaría a duplicarlo después.

**Alternativas descartadas:**

- **Persistir con el ORM desde el seed:** saltea el puerto y la auditoría, y contradice la separación de capas.

### D3 — El puerto suma `save`, no un repositorio nuevo

`IUsuarioRepository` gana `save(usuario)` y su adaptador lo implementa con `@Transactional()`, igual que los otros dos puertos del módulo.

**Por qué:** el borde de persistencia ya existe y es el mismo agregado; crear un segundo puerto para escribir lo que el primero lee partiría el agregado en dos contratos.

### D4 — La idempotencia la resuelve el seed tolerando el duplicado

`CreateUsuarioUseCase` rechaza un email que ya existe, porque el alta de la API debe hacerlo. El seed interpreta ese rechazo como «ya está hecho» y termina sin error.

**Por qué:** la alternativa sería darle al caso de uso un modo idempotente, que es exactamente el cambio de semántica que ya se descartó para el catálogo. El contrato del seed es «que exista», no «crearlo».

**Costo aceptado:** el seed tiene un `catch` que distingue un código de error esperado del resto. Se acota a ese código y cualquier otro se propaga.

### D5 — El rol se resuelve por nombre y debe estar activo

El caso de uso recibe el nombre del rol y lo resuelve con `IRolRepository.findByNombre`; si no existe o está dado de baja, rechaza.

**Por qué:** el `Usuario` referencia al rol por clave foránea y el modelo prohíbe vincularlo a un rol inexistente o dado de baja; la spec de identidad ya lo exige.

## Risks / Trade-offs

- **[Contraseña en el entorno]** Queda en `.env` y en la configuración del despliegue. → Es el mismo tratamiento que los secretos de sesión: el `.env` no se versiona y `env.example` queda vacío.
- **[Contraseña débil]** Nadie impone una política más allá del mínimo de 8. → El seed es una herramienta de puesta en marcha, no la vía normal de alta; se documenta el mínimo y se confía en el operador.
- **[Un administrador con todas las llaves]** El usuario inicial tiene el rol `Administrador`, que hoy incluye todo el catálogo de autorización. → Es lo que hace posible administrar el resto; la deuda del auto-bloqueo ya está registrada aparte.

## Migration Plan

1. Definir `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_PASSWORD` en el entorno donde se ejecute.
2. `yarn db:migration:up && yarn db:seed catalogo-identidad && yarn db:seed usuario-inicial`.
3. **Rollback:** revertir el commit; el usuario creado queda en la base y se puede eliminar a mano si molesta.

## Open Questions

Ninguna.
