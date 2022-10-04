import { ObgSession } from "src/app.types";

export interface SendFileData {
    obgSession: ObgSession,
    from: string,
    to: string,
    file: { name: string, buffer: { data: number[] } },
    caption?: string
}