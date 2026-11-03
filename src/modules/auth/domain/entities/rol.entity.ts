import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import {
  exigirActor,
  exigirMomento,
  exigirTexto,
  normalizarCodigo,
} from '../../../../common/domain/validaciones.js';
import { Permiso } from './permiso.entity.js';

export interface CrearRol {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  createdAt: Date;
  createdById?: number | null;
}

/**
 * Rol del catálogo de autorización. Es la raíz del agregado que posee la
 * asignación de permisos: la colección solo se modifica por sus métodos.
 */
@Entity({ tableName: 'rol' })
export class Rol {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text', unique: true })
  codigo!: string;

  @Property({ type: 'text' })
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion: string | null = null;

  @ManyToMany({ entity: () => Permiso, pivotTable: 'rol_permiso' })
  permisos = new Collection<Permiso>(this);

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

  static crear(datos: CrearRol): Rol {
    const rol = new Rol();
    rol.codigo = normalizarCodigo(datos.codigo);
    rol.nombre = exigirTexto(datos.nombre, 'NOMBRE');
    rol.descripcion = datos.descripcion ?? null;
    rol.createdAt = exigirMomento(datos.createdAt);
    rol.createdById = datos.createdById ?? null;

    return rol;
  }

  estaActivo(): boolean {
    return this.deletedAt === null;
  }

  asignarPermiso(permiso: Permiso, actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (this.permisos.contains(permiso)) {
      throw new ErrorSemantico(
        'conflicto',
        'PERMISO_DUPLICADO',
        'El rol ya tiene asignado ese permiso.',
      );
    }

    this.permisos.add(permiso);
    this.updatedAt = instante;
    this.updatedById = actor;
  }

  quitarPermiso(permiso: Permiso, actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (!this.permisos.contains(permiso)) {
      throw new ErrorSemantico(
        'no_encontrado',
        'PERMISO_NO_ASIGNADO',
        'El rol no tiene asignado ese permiso.',
      );
    }

    this.permisos.remove(permiso);
    this.updatedAt = instante;
    this.updatedById = actor;
  }

  darDeBaja(actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (!this.estaActivo()) {
      throw new ErrorSemantico('conflicto', 'ROL_YA_DADO_DE_BAJA', 'El rol ya está dado de baja.');
    }

    this.deletedAt = instante;
    this.deletedById = actor;
    this.updatedAt = instante;
    this.updatedById = actor;
  }

  reactivar(actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (this.estaActivo()) {
      throw new ErrorSemantico('conflicto', 'ROL_ACTIVO', 'El rol no está dado de baja.');
    }

    this.deletedAt = null;
    this.deletedById = null;
    this.updatedAt = instante;
    this.updatedById = actor;
  }

  registrarEdicion(actorId: number, momento: Date): void {
    this.updatedById = exigirActor(actorId);
    this.updatedAt = exigirMomento(momento);
  }

  get ultimoResponsableId(): number | null {
    return this.updatedById ?? this.createdById;
  }
}
