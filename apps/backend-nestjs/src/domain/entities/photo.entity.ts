import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Photo Entity
 *
 * TypeORM entity representing a photo in the SQLite database.
 * Maps to the 'photos' table with auto-generated schema.
 */
@Entity('photos')
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column({ name: 'stored_filename', unique: true })
  storedFilename: string;

  @Column()
  url: string;

  @Column()
  size: number;

  @Column('simple-json')
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
