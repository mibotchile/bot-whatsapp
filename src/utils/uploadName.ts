//2022/202209/

import { now } from "./date"


export const buildUploadPath = (fileName: string) => {
    const nowDate = now().replace(' ', '-')
    const [year, month, day] = nowDate.split('-')
    return `${year}/${month}/${day}/${fileName}`
    // return `${year}/${year}${month}/${year}${month}${day}/${fileName}`
}