# Proposal

## Why

Después de migrar y sembrar el catálogo, la base no tiene ningún usuario y no existe ningún camino para crear el primero: el alta de alumno y de profesor no está implementada, y el login exige una credencial que nadie puede tener. El sistema queda inaccesible por cualquier vía, incluida la API del catálogo que acaba de sumarse, porque toda operación protegida exige sesión.

## What Changes

- Se agrega el seed **`usuario-inicial`**, que crea un usuario con rol `Administrador` a partir de dos variables de entorno.
- Se agrega **`CreateUsuarioUseCase`**, que valida email único, resuelve el rol, hashea la credencial con el mismo hasher de la aplicación y persiste con auditoría de alta.
- Se agrega **`save` al puerto `IUsuarioRepository`** y a su adaptador, que hoy solo lee.
- El seed es **idempotente**: si el email ya existe, no hace nada ni cambia la contraseña.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `identidad-usuario`: se agrega el comportamiento del alta del administrador inicial como proceso interno declarado, con su rol obligatorio y su credencial hasheada.

## Impact

- **Código afectado:** `src/seeder/` (seed y registro), `src/modules/auth/application/use-cases/` (alta de usuario), `src/modules/auth/domain/interfaces/` y `infrastructure/repositories/` (escritura del puerto), `env.example`.
- **Base de datos:** sin migraciones. `usuario` ya existe con `email` único y `password_hash`.
- **Configuración:** dos variables nuevas, obligatorias para ejecutar el seed.
- **Fuera de alcance:**
  - Las altas de alumno y profesor (`HU 16`, `HU 17`), que crean el `Usuario` junto con el perfil.
  - Cambiar la contraseña del administrador: si ya existe, el seed no la toca.
  - Roles adicionales para el administrador inicial: solo `Administrador`.
