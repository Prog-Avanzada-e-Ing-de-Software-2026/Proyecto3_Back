import 'dotenv/config';

import { defineConfig } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { Alumno } from './modules/alumnos/domain/entities/alumno.entity.js';
import { Permiso } from './modules/auth/domain/entities/permiso.entity.js';
import { Rol } from './modules/auth/domain/entities/rol.entity.js';
import { Usuario } from './modules/auth/domain/entities/usuario.entity.js';
import { CategoriaEjercicio } from './modules/catalogo/categorias-ejercicio/domain/entities/categoria-ejercicio.entity.js';
import { Ejercicio } from './modules/catalogo/ejercicios/domain/entities/ejercicio.entity.js';
import { Material } from './modules/catalogo/materiales/domain/entities/material.entity.js';
import { ObjetivoPlan } from './modules/catalogo/objetivos-plan/domain/entities/objetivo-plan.entity.js';
import { Unidad } from './modules/catalogo/unidades/domain/entities/unidad.entity.js';
import { EjercicioRealizado } from './modules/entrenamientos/domain/entities/ejercicio-realizado.entity.js';
import { Entrenamiento } from './modules/entrenamientos/domain/entities/entrenamiento.entity.js';
import { Serie } from './modules/entrenamientos/domain/entities/serie.entity.js';
import { DiaDelPlan } from './modules/planes/domain/entities/dia-del-plan.entity.js';
import { EjercicioPlanificado } from './modules/planes/domain/entities/ejercicio-planificado.entity.js';
import { Plan } from './modules/planes/domain/entities/plan.entity.js';
import { PrescripcionSemanal } from './modules/planes/domain/entities/prescripcion-semanal.entity.js';
import { Profesor } from './modules/profesores/domain/entities/profesor.entity.js';

const ENTIDADES_AUDITADAS = [
  Usuario,
  Rol,
  Permiso,
  Alumno,
  Profesor,
  ObjetivoPlan,
  Material,
  Unidad,
  CategoriaEjercicio,
  Ejercicio,
  Plan,
  DiaDelPlan,
  PrescripcionSemanal,
  EjercicioPlanificado,
  Entrenamiento,
  EjercicioRealizado,
  Serie,
];

export default defineConfig({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME ?? 'mi_proyecto',

  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],

  metadataProvider: ReflectMetadataProvider,

  // Las lecturas habituales excluyen los registros dados de baja. El histórico
  // se consulta desactivando el filtro explícitamente en la consulta.
  filters: {
    bajaLogica: {
      cond: { deletedAt: null },
      default: true,
      entity: ENTIDADES_AUDITADAS,
    },
  },

  extensions: [Migrator],

  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    emit: 'ts',
    transactional: true,
    allOrNothing: true,
    // El snapshot lo administra `migration:create`; correr up/down no debe reescribirlo.
    snapshotOnMigrate: false,
  },

  debug: process.env.NODE_ENV === 'development',
});
