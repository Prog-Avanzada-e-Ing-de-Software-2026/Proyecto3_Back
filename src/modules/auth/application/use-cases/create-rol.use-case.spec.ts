import { beforeAll, describe, expect, it } from 'vitest';
import { PermisoRepositoryFalso, RolRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import { CreateRolUseCase } from './create-rol.use-case.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

function armar(permisos: Permiso[] = []) {
  const permisosRepo = new PermisoRepositoryFalso();
  permisosRepo.precargar(...permisos);
  const rolesRepo = new RolRepositoryFalso();

  return {
    rolesRepo,
    caso: new CreateRolUseCase(rolesRepo, new FindPermisoByNombreUseCase(permisosRepo)),
  };
}

describe('CreateRolUseCase', () => {
  it('[identidad-usuario] crea el rol con sus permisos y registra al actor', async () => {
    const crearPlan = Permiso.crear({ nombre: 'plan:crear' });
    const { rolesRepo, caso } = armar([crearPlan]);

    const rol = await caso.execute({ nombre: ' Profesor ', permisos: ['plan:crear'] }, 1);

    expect(rol.nombre).toBe('Profesor');
    expect(rol.permisos.getItems()).toEqual([crearPlan]);
    expect(rol.createdById).toBe(1);
    expect(rol.createdAt).toBeInstanceOf(Date);
    expect(rol.updatedAt).toBeNull();
    expect(rolesRepo.guardados).toHaveLength(1);
  });

  it('[identidad-usuario] rechaza el nombre de un rol que ya existe', async () => {
    const { rolesRepo, caso } = armar();
    rolesRepo.precargar(Rol.crear({ nombre: 'Profesor' }));

    await expect(caso.execute({ nombre: '  Profesor  ' })).rejects.toMatchObject({
      codigo: 'ROL_DUPLICADO',
    });
    expect(rolesRepo.guardados).toHaveLength(1);
  });

  it('[identidad-usuario] rechaza un nombre que difiere solo en mayúsculas', async () => {
    const { rolesRepo, caso } = armar();
    rolesRepo.precargar(Rol.crear({ nombre: 'Profesor' }));

    await expect(caso.execute({ nombre: 'PROFESOR' })).rejects.toMatchObject({
      codigo: 'ROL_DUPLICADO',
    });
    expect(rolesRepo.guardados).toHaveLength(1);
  });

  it('[identidad-usuario] rechaza un permiso inexistente antes de escribir', async () => {
    const { rolesRepo, caso } = armar();

    await expect(caso.execute({ nombre: 'Profesor', permisos: ['Inexistente'] })).rejects.toThrow(
      ErrorSemantico,
    );
    expect(rolesRepo.guardados).toHaveLength(0);
  });

  it('[identidad-usuario] asigna cualquier permiso vigente sin mirar los del actor', async () => {
    const crearPlan = Permiso.crear({ nombre: 'plan:crear' });
    const gestionarRoles = Permiso.crear({ nombre: 'rol:editar' });
    const { rolesRepo, caso } = armar([crearPlan, gestionarRoles]);

    const rol = await caso.execute({ nombre: 'Profesor', permisos: ['plan:crear'] }, 1);

    expect(rol.permisos.getItems()).toEqual([crearPlan]);
    expect(rol.createdById).toBe(1);
    expect(rolesRepo.guardados).toHaveLength(1);
  });

  it('[identidad-usuario] un rol sin permisos es válido y no consulta al actor', async () => {
    const { rolesRepo, caso } = armar();

    const rol = await caso.execute({ nombre: 'Alumno', permisos: [] });

    expect(rol.permisos.getItems()).toEqual([]);
    expect(rol.createdById).toBeNull();
    expect(rolesRepo.guardados).toHaveLength(1);
  });
});
