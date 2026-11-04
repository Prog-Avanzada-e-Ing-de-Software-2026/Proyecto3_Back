import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import {
  exigirActor,
  exigirMomento,
  normalizarTextoObligatorio,
  normalizarEmail,
} from '../../../../common/domain/validaciones.js';
import type { Permiso } from './permiso.entity.js';
import { Rol } from './rol.entity.js';
import type { CrearUsuario } from './usuario.input.js';

/**
 * Identidad de acceso. El estado activo se deriva de la baja lógica y los
 * permisos efectivos de su rol; ninguno de los dos se persiste.
 */
@Entity({ tableName: 'usuario' })
export class Usuario {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text', unique: true })
  email!: string;

  @Property({ type: 'text' })
  passwordHash!: string;

  @ManyToOne(() => Rol, {
    fieldName: 'rol_id',
    deleteRule: 'restrict',
  })
  rol!: Rol;

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

  static crear(datos: CrearUsuario): Usuario {
    if (datos.rol === undefined || datos.rol === null) {
      throw new ErrorSemantico('entrada_invalida', 'ROL_REQUERIDO', 'El usuario requiere un rol.');
    }

    const usuario = new Usuario();
    usuario.email = normalizarEmail(datos.email);
    usuario.passwordHash = normalizarTextoObligatorio(datos.passwordHash, 'CREDENCIAL');
    usuario.rol = datos.rol;
    usuario.createdAt = exigirMomento(datos.createdAt);
    usuario.createdById = datos.createdById ?? null;

    return usuario;
  }

  estaActivo(): boolean {
    return this.deletedAt === null;
  }

  permisosEfectivos(): Permiso[] {
    return this.rol.permisos.getItems().filter((permiso) => permiso.estaActivo());
  }

  darDeBaja(actorId: number, momento: Date): void {
    const actor = exigirActor(actorId);
    const instante = exigirMomento(momento);

    if (!this.estaActivo()) {
      throw new ErrorSemantico(
        'conflicto',
        'USUARIO_YA_DADO_DE_BAJA',
        'El usuario ya está dado de baja.',
      );
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
      throw new ErrorSemantico(
        'conflicto',
        'USUARIO_ACTIVO',
        'El usuario no está dado de baja.',
      );
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

  get rolId(): number {
    return this.rol.id;
  }

  get ultimoResponsableId(): number | null {
    return this.updatedById ?? this.createdById;
  }
}
