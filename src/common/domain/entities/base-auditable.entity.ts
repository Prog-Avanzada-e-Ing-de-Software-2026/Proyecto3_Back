import { Entity, Property } from '@mikro-orm/decorators/legacy';

@Entity({ abstract: true })
export abstract class AuditableEntity {
  @Property({ type: 'timestamptz' })
  createdAt: Date;

  @Property({ type: 'number' })
  createdById: number;

  @Property({ type: 'timestamptz', nullable: true })
  updatedAt: Date | null = null;

  @Property({ type: 'number', nullable: true })
  updatedById: number | null = null;

  @Property({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null = null;

  @Property({ type: 'number', nullable: true })
  deletedById: number | null = null;
}
