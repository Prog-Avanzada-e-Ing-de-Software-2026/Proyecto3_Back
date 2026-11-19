# Tasks

## 1. Escritura del usuario

- [x] 1.1 Agregar `save(usuario)` a `IUsuarioRepository` e implementarlo en el adaptador MikroORM con `@Transactional()`. Verificación: test de integración contra PostgreSQL real que persista un usuario y lo relea por email. Trazabilidad: `design.md` D3.

## 2. Caso de uso

- [x] 2.1 Implementar `CreateUsuarioUseCase`: normaliza el email, rechaza el duplicado —incluido el de un usuario dado de baja—, resuelve el rol por nombre exigiendo que exista y esté activo, hashea la contraseña, y persiste con el actor si lo recibe. Verificación: test unitario con dobles que cubra alta válida, email repetido, rol inexistente, rol dado de baja y contraseña demasiado corta. Trazabilidad: `identidad-usuario` — Alta del administrador inicial; `design.md` D2, D5.

## 3. Seed

- [x] 3.1 Implementar el seed `usuario-inicial` y registrarlo: lee `ADMIN_INICIAL_EMAIL` y `ADMIN_INICIAL_PASSWORD`, falla si faltan o si la contraseña tiene menos de 8 caracteres, invoca el caso de uso con el rol `Administrador` y tolera el rechazo por email duplicado. Verificación: test de integración que compruebe el alta, que el hash no contiene la contraseña, que una segunda ejecución no crea otro usuario ni cambia la credencial, y que sin el rol en el catálogo el proceso falla sin persistir. Trazabilidad: `identidad-usuario` — Alta del administrador inicial; `design.md` D1, D4.
- [x] 3.2 Documentar las dos variables en `env.example`. Verificación: `yarn check:docs` en verde y las variables presentes en el archivo.

## 4. Verificación

- [x] 4.1 Ejecutar la verificación completa del repositorio. Verificación: `yarn typecheck && yarn lint && yarn test && yarn test:e2e` en verde y `openspec validate add-admin-inicial --strict` con código 0.

## Workflow follow-up

- Archivar con `openspec archive add-admin-inicial` después del merge a `develop`.
- El PR de `implement-login` documenta el orden de ejecución: catálogo y después el usuario inicial.
