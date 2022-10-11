import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('channel_map', { schema: 'public' })
export class ChannelMap {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    client_uid: string

    @Column()
    project_uid: string

    @Column()
    channel_number: string

    @Column()
    created_by: string

    @Column()
    updated_by: string

    @Column()
    created_at: string

    @Column()
    updated_at: string

    @Column({ default: 1 })
    status: number
}
