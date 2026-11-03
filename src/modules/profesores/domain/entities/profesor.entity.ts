import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import {
  exigirActor,
  exigirFechaCalendario,
  exigirMomento,
  exigirTexto,
} from '../../../../common/domain/validaciones.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';

export interface CrearProfesor {
  nombre: string;
  fechaNacimiento: string;
  numeroDocumento: string;
  numeroTelefono: string;
  fechaIngreso: Date;
  usuario: Usuario;
  createdAt: Date;
  createdById?: number | null;
}

/**
 * Perfil de profesor. Su identidad de acceso vive en `Usuario`; el estado
 * activo se deriva de la baja lógica.
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

  @ManyToOne(() => Usuario, {
    fieldName: 'usuario_id',
    unique: true,
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
    profesor.nombre = exigirTexto(datos.nombre, 'NOMBRE');
    profesor.fechaNacimiento = exigirFechaCalendario(datos.fechaNacimiento, 'FECHA_NACIMIENTO');
    profesor.numeroDocumento = exigirTexto(datos.numeroDocumento, 'NUMERO_DOCUMENTO');
    profesor.numeroTelefono = exigirTexto(datos.numeroTelefono, 'NUMERO_TELEFONO');
    profesor.fechaIngreso = exigirMomento(datos.fechaIngreso);
    profesor.usuario = datos.usuario;
    profesor.createdAt = exigirMomento(datos.createdAt);
    profesor.createdById = datos.createdById ?? null;

    return profesor;
  }

  estaActivo(): boolean {
    return this.deletedAt === null;
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
