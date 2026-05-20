import { AfterLoad, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export abstract class DefaultEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date

    // SQL Server's uniqueidentifier returns UUIDs uppercase; Postgres uses lowercase.
    // Normalize on read so cross-store joins (e.g. SQL quiz.id ↔ Cosmos quiz_id) match.
    @AfterLoad()
    normalizeId() {
        if (this.id) this.id = this.id.toLowerCase()
    }
}