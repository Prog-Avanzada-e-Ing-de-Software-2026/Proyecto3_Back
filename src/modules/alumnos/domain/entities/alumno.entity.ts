import { Entity, ManyToOne, OneToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import {
  exigirFechaCalendario,
  exigirMomento,
  normalizarTextoObligatorio,
} from '../../../../common/domain/validaciones.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
// oxlint-disable-next-line import/no-cycle -- el profesor declara la colección inversa de solo lectura sobre esta relación.
import { Profesor } from '../../../profesores/domain/entities/profesor.entity.js';
import type { CrearAlumno } from './alumno.input.js';

/**
 * Perfil de alumno. Su identidad de acceso vive en `Usuario`; el estado activo
 * es un atributo del dominio que se mantiene coherente con la baja lógica.
 */
@Entity({ tableName: 'alumno' })
export class Alumno {
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

  @Property({ type: 'text', nullable: true })
  observaciones: string | null = null;

  @Property({ type: 'boolean', default: true })
  activo: boolean = true;

  @ManyToOne({
    entity: () => Profesor,
    fieldName: 'profesor_asignado_id',
    nullable: true,
    deleteRule: 'restrict',
  })
  profesorAsignado: Profesor | null = null;

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

  static crear(datos: CrearAlumno): Alumno {
    if (datos.usuario === undefined || datos.usuario === null) {
      throw new ErrorSemantico('entrada_invalida', 'USUARIO_REQUERIDO', 'El alumno requiere un usuario.');
    }

    const alumno = new Alumno();
    alumno.nombre = normalizarTextoObligatorio(datos.nombre, 'NOMBRE');
    alumno.fechaNacimiento = exigirFechaCalendario(datos.fechaNacimiento, 'FECHA_NACIMIENTO');
    alumno.numeroDocumento = normalizarTextoObligatorio(datos.numeroDocumento, 'NUMERO_DOCUMENTO');
    alumno.numeroTelefono = normalizarTextoObligatorio(datos.numeroTelefono, 'NUMERO_TELEFONO');
    alumno.fechaIngreso = exigirMomento(datos.fechaIngreso);
    alumno.observaciones = datos.observaciones ?? null;
    alumno.activo = true;
    alumno.profesorAsignado = datos.profesorAsignado ?? null;
    alumno.usuario = datos.usuario;

    return alumno;
  }

  estaActivo(): boolean {
    return this.activo;
  }

  darDeBaja(): void {
    if (!this.estaActivo()) {
      throw new ErrorSemantico(
        'conflicto',
        'ALUMNO_YA_DADO_DE_BAJA',
        'El alumno ya está dado de baja.',
      );
    }

    this.activo = false;
  }

  reactivar(): void {
    if (this.estaActivo()) {
      throw new ErrorSemantico('conflicto', 'ALUMNO_ACTIVO', 'El alumno no está dado de baja.');
    }

    this.activo = true;
  }

  get usuarioId(): number {
    return this.usuario.id;
  }

  get profesorAsignadoId(): number | null {
    return this.profesorAsignado?.id ?? null;
  }
}
