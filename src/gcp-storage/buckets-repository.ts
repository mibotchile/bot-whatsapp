import { Bucket } from "@google-cloud/storage";

export class BucketRepository {
    static buckets: Bucket[] = []

    static save(bucket: Bucket) {
        this.buckets.push(bucket)
    }

    static findByName(name: string): Bucket {
        return this.buckets.find(b => b.name === name)
    }

    static delete(name: string) {
        const bucketIndex = this.buckets.findIndex(b => b.name === name)
        this.buckets.splice(bucketIndex, 1)
    }
}