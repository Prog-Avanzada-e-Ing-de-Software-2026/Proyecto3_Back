import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import {
  exigirActor,
  exigirFechaCalendario,
  exigirMomento,
  normalizarTextoObligatorio,
} from '../../../../common/domain/validaciones.js';
// oxlint-disable-next-line import/no-cycle -- la relación inversa de solo lectura cierra el ciclo del mapeo ORM, no una dependencia de módulo.
import { Alumno } from '../../../alumnos/domain/entities/alumno.entity.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
import type { CrearProfesor } from './profesor.input.js';

/**
 * Perfil de profesor. Su identidad de acceso vive en `Usuario`; el estado
 * activo es un atributo del dominio que se mantiene coherente con la baja
 * lógica, y la colección `alumnos` expone la relación inversa de solo lectura.
 */
@Entity({ tableName: 'profesor' })
export class Profesor {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  nombre!: string;

  @Property({ columnType: 'date' })
  fechaNacimiento!: string;

  @Property({ type: 'text', unique: true })
  numeroDocumento!: string;

  @Property({ type: 'text' })
  numeroTelefono!: string;

  @Property({ columnType: 'timestamptz' })
  fechaIngreso!: Date;

  @Property({ type: 'boolean', default: true })
  activo: boolean = true;

  @OneToMany(() => Alumno, (alumno) => alumno.profesorAsignado)
  alumnos = new Collection<Alumno>(this);

  @OneToOne(() => Usuario, {
    fieldName: 'usuario_id',
    owner: true,
    deleteRule: 'restrict',
  })
  usuario!: Usuario;

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'integer', nullable: true })
  createdById: number | null = null;

  @Property({ columnType: 'timestamptz', nullable: true })
  updatedAt: Date | null = null;

  @Property({ columnType: 'integer', nullable: true })
  updatedById: number | null = null;

  @Property({ columnType: 'timestamptz', nullable: true })
  deletedAt: Date | null = null;

  @Property({ columnType: 'integer', nullable: true })
  deletedById: number | null = null;

  static crear(datos: CrearProfesor): Profesor {
    if (datos.usuario === undefined || datos.usuario === null) {
      throw new ErrorSemantico(
        'entrada_invalida',
        'USUARIO_REQUERIDO',
        'El profesor requiere un usuario.',
      );
    }

    const profesor = new Profesor();
    profesor.nombre = normalizarTextoObligatorio(datos.nombre, 'NOMBRE');
    profesor.fechaNacimiento = exigirFechaCalendario(datos.fechaNacimiento, 'FECHA_NACIMIENTO');
    profesor.numeroDocumento = normalizarTextoObligatorio(datos.numeroDocumento, 'NUMERO_DOCUMENTO');
    profesor.numeroTelefono = normalizarTextoObligatorio(datos.numeroTelefono, 'NUMERO_TELEFONO');
    profesor.fechaIngreso = exigirMomento(datos.fechaIngreso);
    profesor.activo = true;
    profesor.usuario = datos.usuario;
    profesor.createdAt = exigirMomento(datos.createdAt);
    profesor.createdById = datos.createdById ?? null;

    return profesor;
  }

  estaActivo(): boolean {
    return this.activo;
  }

  darDeBaja(actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (!this.estaActivo()) {
      throw new ErrorSemantico(
        'conflicto',
        'PROFESOR_YA_DADO_DE_BAJA',
        'El profesor ya está dado de baja.',
      );
    }

    this.activo = false;
    this.deletedAt = instante;
    this.deletedById = actor;
    this.updatedAt = instante;
    this.updatedById = actor;
  }

  reactivar(actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (this.estaActivo()) {
      throw new ErrorSemantico('conflicto', 'PROFESOR_ACTIVO', 'El profesor no está dado de baja.');
    }

    this.activo = true;
    this.deletedAt = null;
    this.deletedById = null;
    this.updatedAt = instante;
    this.updatedById = actor;
  }

  registrarEdicion(actorId: number, momento: Date): void {
    this.updatedById = exigirActor(actorId);
    this.updatedAt = exigirMomento(momento);
  }

  get usuarioId(): number {
    return this.usuario.id;
  }

  get ultimoResponsableId(): number | null {
    return this.updatedById ?? this.createdById;
  }
}
