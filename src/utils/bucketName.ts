export const buildBucketName = (clientUid: string) => {
    return `wpp_${clientUid.toLowerCase()}`
}