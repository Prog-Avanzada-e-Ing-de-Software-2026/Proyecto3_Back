import type { INestApplication } from '@nestjs/common';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GlobalExceptionFilter } from '../src/common/presentation/global-exception.filter.js';
import { CreatePermisoUseCase } from '../src/modules/auth/application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from '../src/modules/auth/application/use-cases/create-rol.use-case.js';
import { FindPermisoByIdUseCase } from '../src/modules/auth/application/use-cases/find-permiso-by-id.use-case.js';
import { FindPermisoByNombreUseCase } from '../src/modules/auth/application/use-cases/find-permiso-by-nombre.use-case.js';
import { FindRolByIdUseCase } from '../src/modules/auth/application/use-cases/find-rol-by-id.use-case.js';
import { ListPermisosUseCase } from '../src/modules/auth/application/use-cases/list-permisos.use-case.js';
import { ListRolesUseCase } from '../src/modules/auth/application/use-cases/list-roles.use-case.js';
import { ReplaceRolPermisosUseCase } from '../src/modules/auth/application/use-cases/replace-rol-permisos.use-case.js';
import { UpdatePermisoUseCase } from '../src/modules/auth/application/use-cases/update-permiso.use-case.js';
import { UpdateRolUseCase } from '../src/modules/auth/application/use-cases/update-rol.use-case.js';
import {
  PERMISO_REPOSITORY,
  ROL_REPOSITORY,
  USUARIO_REPOSITORY,
} from '../src/modules/auth/auth.repository-tokens.js';
import { NOMBRES_PERMISO } from '../src/modules/auth/domain/catalogos.js';
import { Permiso } from '../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../src/modules/auth/domain/entities/usuario.entity.js';
import {
  CONFIGURACION_SESION,
  leerConfiguracionSesion,
} from '../src/modules/auth/infrastructure/config/jwt-config.js';
import { AuthGuard } from '../src/modules/auth/presentation/auth.guard.js';
import { PermisosController } from '../src/modules/auth/presentation/permisos.controller.js';
import { RolesController } from '../src/modules/auth/presentation/roles.controller.js';
import { SesionService } from '../src/modules/auth/presentation/sesion.service.js';
import {
  PermisoRepositoryFalso,
  RolRepositoryFalso,
  UsuarioRepositoryFalso,
} from './support/fakes-auth.js';
import { initOrmMetadata } from './support/orm-metadata.js';

const CONFIGURACION = leerConfiguracionSesion();

function crearModulo(
  roles: RolRepositoryFalso,
  permisos: PermisoRepositoryFalso,
  usuarios: UsuarioRepositoryFalso,
): new () => object {
  const buscarPermiso = new FindPermisoByNombreUseCase(permisos);

  @Module({
    imports: [JwtModule.register({})],
    controllers: [RolesController, PermisosController],
    providers: [
      ListRolesUseCase,
      FindRolByIdUseCase,
      ListPermisosUseCase,
      FindPermisoByIdUseCase,
      FindPermisoByNombreUseCase,
      UpdateRolUseCase,
      UpdatePermisoUseCase,
      {
        provide: CreateRolUseCase,
        useFactory: () => new CreateRolUseCase(roles, usuarios, buscarPermiso),
      },
      { provide: ReplaceRolPermisosUseCase, useFactory: () => new ReplaceRolPermisosUseCase(roles, usuarios, buscarPermiso) },
      { provide: CreatePermisoUseCase, useFactory: () => new CreatePermisoUseCase(permisos) },
      SesionService,
      { provide: CONFIGURACION_SESION, useValue: CONFIGURACION },
      { provide: ROL_REPOSITORY, useValue: roles },
      { provide: PERMISO_REPOSITORY, useValue: permisos },
      { provide: USUARIO_REPOSITORY, useValue: usuarios },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    ],
  })
  class ModuloDeCatalogo {}

  return ModuloDeCatalogo;
}

function accessPara(usuarioId: number): Promise<string> {
  return new JwtService({}).signAsync(
    { sub: usuarioId, tipo: 'access' },
    { secret: CONFIGURACION.secretoAccess, expiresIn: CONFIGURACION.ttlAccess },
  );
}

describe('Catálogo de roles y permisos (e2e)', () => {
  let app: INestApplication;
  let roles: RolRepositoryFalso;
  let permisos: PermisoRepositoryFalso;
  let usuarios: UsuarioRepositoryFalso;
  let administrador: Usuario;
  let alumno: Usuario;
  let administradorDePermisos: Usuario;

  beforeAll(() => {
    initOrmMetadata();
  });

  beforeEach(async () => {
    const crearPlan = Permiso.crear({ nombre: NOMBRES_PERMISO.CREAR_PLAN });
    crearPlan.id = 1;
    crearPlan.createdAt = new Date('2026-01-01T10:00:00.000Z');
    const gestionarRoles = Permiso.crear({ nombre: NOMBRES_PERMISO.GESTIONAR_ROLES });
    gestionarRoles.id = 2;
    gestionarRoles.createdAt = new Date('2026-01-01T10:00:00.000Z');
    const gestionarPermisos = Permiso.crear({ nombre: NOMBRES_PERMISO.GESTIONAR_PERMISOS });
    gestionarPermisos.id = 3;
    gestionarPermisos.createdAt = new Date('2026-01-01T10:00:00.000Z');

    permisos = new PermisoRepositoryFalso();
    permisos.precargar(crearPlan, gestionarRoles, gestionarPermisos);

    // El administrador tiene lo que puede otorgar, menos `Gestionar permisos`:
    // así la escalada es observable.
    const rolAdmin = Rol.crear({
      nombre: 'Administrador',
      permisos: [crearPlan, gestionarRoles],
    });
    rolAdmin.id = 1;
    rolAdmin.createdAt = new Date('2026-01-01T10:00:00.000Z');

    const rolAlumno = Rol.crear({ nombre: 'Alumno', permisos: [crearPlan] });
    rolAlumno.id = 2;
    rolAlumno.createdAt = new Date('2026-01-01T10:00:00.000Z');

    roles = new RolRepositoryFalso();
    roles.precargar(rolAdmin, rolAlumno);

    administrador = Usuario.crear({
      email: 'admin@gym.com',
      passwordHash: 'hash',
      rol: rolAdmin,
    });
    administrador.id = 1;
    alumno = Usuario.crear({ email: 'alumno@gym.com', passwordHash: 'hash', rol: rolAlumno });
    alumno.id = 2;
    const rolAdminPermisos = Rol.crear({
      nombre: 'Administrador de permisos',
      permisos: [gestionarPermisos],
    });
    rolAdminPermisos.id = 3;
    rolAdminPermisos.createdAt = new Date('2026-01-01T10:00:00.000Z');
    roles.precargar(rolAdminPermisos);
    administradorDePermisos = Usuario.crear({
      email: 'permisos@gym.com',
      passwordHash: 'hash',
      rol: rolAdminPermisos,
    });
    administradorDePermisos.id = 3;

    usuarios = new UsuarioRepositoryFalso([administrador, alumno, administradorDePermisos]);

    const modulo = await Test.createTestingModule({
      imports: [crearModulo(roles, permisos, usuarios)],
    }).compile();

    app = modulo.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.setGlobalPrefix('api');
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Gym MVP API').build()),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[identidad-usuario] sin sesión responde 401 en las lecturas y en las escrituras', async () => {
    await request(app.getHttpServer()).get('/api/roles').expect(401);
    await request(app.getHttpServer()).get('/api/permisos').expect(401);
    await request(app.getHttpServer()).post('/api/roles').send({ nombre: 'X' }).expect(401);
  });

  it('[identidad-usuario] con sesión sin el permiso responde 403 en la escritura', async () => {
    const access = await accessPara(2);
    const respuesta = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Cookie', `access=${access}`)
      .send({ nombre: 'Entrenador' })
      .expect(403);

    expect(respuesta.body.code).toBe('SIN_PERMISO');
  });

  it('[identidad-usuario] lista roles y permisos con el permiso de cada catálogo', async () => {
    const deRoles = await accessPara(1);
    const dePermisos = await accessPara(3);

    const listaRoles = await request(app.getHttpServer())
      .get('/api/roles')
      .set('Cookie', `access=${deRoles}`)
      .expect(200);
    const listaPermisos = await request(app.getHttpServer())
      .get('/api/permisos')
      .set('Cookie', `access=${dePermisos}`)
      .expect(200);

    expect(listaRoles.body).toHaveLength(3);
    expect(listaRoles.body[0].permisos).toContain(NOMBRES_PERMISO.GESTIONAR_ROLES);
    expect(listaPermisos.body.map((permiso: { nombre: string }) => permiso.nombre)).toContain(
      NOMBRES_PERMISO.CREAR_PLAN,
    );
  });

  it('[identidad-usuario] una lectura sin el permiso del catálogo responde 403', async () => {
    const access = await accessPara(2);

    const roles = await request(app.getHttpServer())
      .get('/api/roles')
      .set('Cookie', `access=${access}`)
      .expect(403);
    const permisos = await request(app.getHttpServer())
      .get('/api/permisos')
      .set('Cookie', `access=${access}`)
      .expect(403);

    expect(roles.body.code).toBe('SIN_PERMISO');
    expect(permisos.body.code).toBe('SIN_PERMISO');
  });

  it('[identidad-usuario] el detalle exige el permiso del catálogo', async () => {
    const access = await accessPara(2);

    await request(app.getHttpServer())
      .get('/api/roles/1')
      .set('Cookie', `access=${access}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/permisos/1')
      .set('Cookie', `access=${access}`)
      .expect(403);
  });

  it('[identidad-usuario] da de alta un rol con permisos y lo devuelve en el detalle', async () => {
    const access = await accessPara(1);

    const creado = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Cookie', `access=${access}`)
      .send({ nombre: 'Entrenador', descripcion: 'Acompaña', permisos: [NOMBRES_PERMISO.CREAR_PLAN] })
      .expect(201);

    expect(creado.body).toMatchObject({
      nombre: 'Entrenador',
      descripcion: 'Acompaña',
      permisos: [NOMBRES_PERMISO.CREAR_PLAN],
    });

    await request(app.getHttpServer())
      .get(`/api/roles/${creado.body.id}`)
      .set('Cookie', `access=${access}`)
      .expect(200)
      .expect(({ body }) => expect(body.nombre).toBe('Entrenador'));
  });

  it('[identidad-usuario] rechaza un nombre de rol repetido con conflicto', async () => {
    const access = await accessPara(1);
    const respuesta = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Cookie', `access=${access}`)
      .send({ nombre: 'Alumno' })
      .expect(409);

    expect(respuesta.body.code).toBe('ROL_DUPLICADO');
  });

  it('[identidad-usuario] rechaza renombrar un rol requerido', async () => {
    const access = await accessPara(1);
    const respuesta = await request(app.getHttpServer())
      .patch('/api/roles/2')
      .set('Cookie', `access=${access}`)
      .send({ nombre: 'Estudiante' })
      .expect(409);

    expect(respuesta.body.code).toBe('NOMBRE_REQUERIDO');
  });

  it('[identidad-usuario] reemplaza el conjunto de permisos de un rol', async () => {
    const access = await accessPara(1);

    const respuesta = await request(app.getHttpServer())
      .put('/api/roles/2/permisos')
      .set('Cookie', `access=${access}`)
      .send({ permisos: [NOMBRES_PERMISO.GESTIONAR_ROLES] })
      .expect(200);

    expect(respuesta.body.permisos).toEqual([NOMBRES_PERMISO.GESTIONAR_ROLES]);
  });

  it('[identidad-usuario] rechaza otorgar un permiso que el actor no tiene', async () => {
    const access = await accessPara(1);
    const respuesta = await request(app.getHttpServer())
      .put('/api/roles/2/permisos')
      .set('Cookie', `access=${access}`)
      .send({ permisos: [NOMBRES_PERMISO.GESTIONAR_PERMISOS] })
      .expect(403);

    expect(respuesta.body.code).toBe('PERMISO_NO_OTORGABLE');
  });

  it('[identidad-usuario] rechaza un permiso inexistente al reemplazar el conjunto', async () => {
    const access = await accessPara(1);
    const respuesta = await request(app.getHttpServer())
      .put('/api/roles/2/permisos')
      .set('Cookie', `access=${access}`)
      .send({ permisos: ['Inexistente'] })
      .expect(404);

    expect(respuesta.body.code).toBe('PERMISO_NO_ENCONTRADO');
  });

  it('[identidad-usuario] responde no encontrado para un rol inexistente', async () => {
    const access = await accessPara(1);
    const respuesta = await request(app.getHttpServer())
      .get('/api/roles/999')
      .set('Cookie', `access=${access}`)
      .expect(404);

    expect(respuesta.body.code).toBe('ROL_NO_ENCONTRADO');
  });

  it('[identidad-usuario] da de alta y edita un permiso', async () => {
    const access = await accessPara(3);

    const creado = await request(app.getHttpServer())
      .post('/api/permisos')
      .set('Cookie', `access=${access}`)
      .send({ nombre: 'Gestionar materiales', descripcion: 'Materiales del gimnasio' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/permisos/${creado.body.id}`)
      .set('Cookie', `access=${access}`)
      .send({ descripcion: 'Alta y baja de materiales' })
      .expect(200)
      .expect(({ body }) => expect(body.descripcion).toBe('Alta y baja de materiales'));
  });
  it('[identidad-usuario] publica las nueve operaciones del catálogo en Swagger', async () => {
    const access = await accessPara(1);
    const documentacion = await request(app.getHttpServer())
      .get('/api/docs-json')
      .set('Cookie', `access=${access}`)
      .expect(200);

    expect(Object.keys(documentacion.body.paths).sort()).toEqual([
      '/api/permisos',
      '/api/permisos/{id}',
      '/api/roles',
      '/api/roles/{id}',
      '/api/roles/{id}/permisos',
    ]);
  });
});
