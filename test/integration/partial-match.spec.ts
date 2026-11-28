import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { partialMatch } from '../../src/common/infrastructure/queries/partial-match.js';
import { paginationQueryBuilder } from '../../src/common/infrastructure/queries/pagination-query-builder.js';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { CategoriaEjercicio } from '../../src/modules/catalogo/categorias-ejercicio/domain/entities/categoria-ejercicio.entity.js';
import { Ejercicio } from '../../src/modules/catalogo/ejercicios/domain/entities/ejercicio.entity.js';
import { Unidad } from '../../src/modules/catalogo/unidades/domain/entities/unidad.entity.js';
import { cerrarPostgres, iniciarPostgres, vaciarTablas } from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

const alta = new Date('2026-01-01T10:00:00.000Z');

let entorno: EntornoPostgres;

function ejercicio(
  nombre: string,
  descripcion: string | null,
  categoria: CategoriaEjercicio,
  unidad: Unidad,
): Ejercicio {
  const entidad = new Ejercicio();
  entidad.nombre = nombre;
  entidad.descripcion = descripcion;
  entidad.categoria = categoria;
  entidad.unidad = unidad;
  entidad.createdAt = alta;

  return entidad;
}

async function sembrar(): Promise<void> {
  const em = entorno.orm.em.fork();

  const categoria = new CategoriaEjercicio();
  categoria.nombre = 'Fuerza';
  categoria.createdAt = alta;

  const unidad = new Unidad();
  unidad.nombre = 'repeticiones';
  unidad.createdAt = alta;

  em.persist([
    categoria,
    unidad,
    ejercicio('Extensión de cuádriceps', 'Pierna, extensión en máquina', categoria, unidad),
    ejercicio('Press de banca', 'Pecho, empuje', categoria, unidad),
    ejercicio('Sentadilla 100%', null, categoria, unidad),
    ejercicio('Sentadilla 100 reps', null, categoria, unidad),
    ejercicio('Sentadilla búlgara', null, categoria, unidad),
  ]);

  await em.flush();
}

function nombres(filas: Ejercicio[]): string[] {
  return filas.map((fila) => fila.nombre);
}

beforeAll(async () => {
  entorno = await iniciarPostgres();
  await entorno.orm.migrator.up();
}, 180_000);

beforeEach(async () => {
  await vaciarTablas(entorno.orm);
  await sembrar();
});

afterAll(async () => {
  await cerrarPostgres(entorno);
});

describe('partialMatch', () => {
  it('[busqueda] encuentra sin tilde un nombre con tilde', async () => {
    const filas = await entorno.orm.em
      .fork()
      .find(Ejercicio, partialMatch<Ejercicio>('extension', ['nombre']));

    expect(nombres(filas)).toEqual(['Extensión de cuádriceps']);
  });

  it('[busqueda] da igual la tilde y la mayúscula del término', async () => {
    const filas = await entorno.orm.em
      .fork()
      .find(Ejercicio, partialMatch<Ejercicio>('EXTENSIÓN', ['nombre']));

    expect(nombres(filas)).toEqual(['Extensión de cuádriceps']);
  });

  it('[busqueda] trata el comodín del término como literal', async () => {
    const filas = await entorno.orm.em
      .fork()
      .find(Ejercicio, partialMatch<Ejercicio>('100%', ['nombre']));

    expect(nombres(filas)).toEqual(['Sentadilla 100%']);
  });

  it('[busqueda] busca en más de una columna', async () => {
    const filas = await entorno.orm.em
      .fork()
      .find(Ejercicio, partialMatch<Ejercicio>('empuje', ['nombre', 'descripcion']));

    expect(nombres(filas)).toEqual(['Press de banca']);
  });

  it('[busqueda] excluye las filas dadas de baja', async () => {
    const em = entorno.orm.em.fork();
    const rol = Rol.crear({ nombre: 'Administrador' });
    rol.createdAt = alta;
    const administrador = Usuario.crear({
      email: 'admin@gym.com',
      passwordHash: 'hash-argon2id',
      rol,
    });
    administrador.createdAt = alta;
    em.persist([rol, administrador]);
    await em.flush();

    const banca = await em.findOneOrFail(Ejercicio, { nombre: 'Press de banca' });
    banca.deletedAt = new Date();
    banca.deletedById = administrador.id;
    await em.flush();

    const filas = await em.fork().find(Ejercicio, partialMatch<Ejercicio>('banca', ['nombre']));

    expect(filas).toEqual([]);
  });

  it('[busqueda] un término vacío no filtra', async () => {
    const filas = await entorno.orm.em.fork().find(Ejercicio, partialMatch<Ejercicio>('   ', ['nombre']));

    expect(filas).toHaveLength(5);
  });

  it('[busqueda] se compone con la paginación', async () => {
    const consulta = paginationQueryBuilder(
      entorno.orm.em.fork().createQueryBuilder(Ejercicio, 'e').select('*').where({ deletedAt: null }),
      { page: 1, limit: 2 },
    )
      .andWhere(partialMatch<Ejercicio>('sentadilla', ['nombre']))
      .orderBy({ nombre: 'asc' });

    const [items, total] = await consulta.getResultAndCount();

    expect(items).toHaveLength(2);
    expect(nombres(items)).toEqual(
      expect.arrayContaining(['Sentadilla 100 reps', 'Sentadilla 100%']),
    );
    expect(total).toBe(3);
  });
});
