import { Injectable } from '@nestjs/common';
import { File, GetFilesOptions, Storage } from '@google-cloud/storage';
import { BucketRepository } from './buckets-repository';
import { isValidURL } from 'src/utils/url';

@Injectable()
export class GCPStorageService {
    storage: Storage;
    //bucket:Bucket
    constructor() {
        const GCoptions = {
            keyFilename: process.env.GC_CREDENTIALS_PATH,
            projectId: process.env.GC_PROJECT_NAME,
        };
        this.storage = new Storage(GCoptions);
    }

    async getBuckets() {
        const [buckets] = await this.storage.getBuckets({ prefix: 'wpp_' })
        BucketRepository.buckets = buckets
    }

    async getBucket(bucketName: string) {
        if (BucketRepository.buckets.length === 0) {
            await this.getBuckets()
        }
        const bucket = BucketRepository.findByName(bucketName)
        if (!bucket) {
            await this.createBucket(bucketName)
        }
        return BucketRepository.findByName(bucketName)
    }

    async getFiles(bucketName: string, query?: GetFilesOptions) {
        const bucket = await this.getBucket(bucketName)
        const data = await bucket.getFiles(query);
        return data;
    }

    async createBucket(name: string) {
        const [bucket, metadata] = await this.storage.createBucket(name, { coldline: true, regional: true, location: 'us-central1' })
        console.log(bucket);
        console.log(metadata);
        BucketRepository.save(bucket)
    }



    async donwloadFile(bucketName: string, path: string, destination: string) {
        try {
            console.log('[DESCARGANDO ' + path + ' ... ]');
            const bucket = await this.getBucket(bucketName)

            await bucket.file(path).download({ destination });
            console.log('[ ' + path + ' DESCARGADO ]');
            return true;
        } catch (error) {
            console.log('[ ERROR AL DESCARGAR EL ACRHIVO ' + path + ']');
            console.log('[  ' + error + ']');
            return false;
        }
    }

    async donwloadFromURL(
        gcpURL: string,
        destinationFolder?: string
    ): Promise<{ metadata?: { destination: string, fileName: string }, succes: boolean }> {
        //https://storage.googleapis.com/${audioFileData.bucket}/${audioFileData.name}

        if (!isValidURL(gcpURL)) return { succes: false }
        const [bucketName, filePath, fileName] = this.getDataFromUrl(new URL(gcpURL))

        const destination = (destinationFolder ? `${destinationFolder}/` : '') + fileName

        try {
            console.log('[DESCARGANDO ' + fileName + ' ... ]');
            const bucket = await this.getBucket(bucketName)

            await bucket.file(filePath).download({ destination });
            console.log('[ ' + fileName + ' DESCARGADO ]');
            return { succes: true, metadata: { destination, fileName } }
        } catch (error) {
            console.log('[ ERROR AL DESCARGAR EL ACRHIVO ' + fileName + ']');
            console.log('[  ' + error + ']');
            return { succes: false }
        }
    }

    getDataFromUrl(gcpURL: URL) {
        const url = new URL(gcpURL)
        const parts = url.pathname.split('/')
        const bucketName = parts[1]
        const filePath = parts.slice(2).join('/')
        const fileName = parts.pop()
        return [bucketName, filePath, fileName]

    }

    async uploadFile(bucketName: string, path: string, destination: string, makePublic = true) {
        try {
            console.log('[SUBIENDO ' + path + ' ... ]');
            const bucket = await this.getBucket(bucketName)

            const [file] = await bucket.upload(path, { destination, public: makePublic });
            console.log('[ ' + path + ' SUBIDO ]');
            return file;
        } catch (error) {
            console.log('[ ERROR AL SUBIR EL ACRHIVO ' + path + ']');
            console.log('[  ' + error + ']');
            return undefined;
        }
    }

    async renameFile(bucketName: string, path: string, newName: string) {
        try {
            const pathParts = path.split('/');
            pathParts[pathParts.length - 1] = newName;
            const destination = pathParts.join('/');
            const bucket = await this.getBucket(bucketName)

            await bucket.file(path).rename(destination);
            return true;
        } catch (error) {
            console.log('[ ERROR AL RENOMBRAR EL ACRHIVO ' + path + ']');
            console.log('[  ' + error + ']');
            return false;
        }
    }

    async getFilesByExtension(bucketName: string, path: string, extensions: string[]) {
        const filteredFiles = {} as any;
        if (extensions.length === 0) return;
        const bucket = await this.getBucket(bucketName)

        const [files] = await bucket.getFiles({ prefix: path });
        console.log('[ FILES ] ');
        extensions.forEach((e) => {
            filteredFiles[e] = files.map((f) => f.metadata).filter((f) => f.name.endsWith('.' + e));
            console.log(`[${e} => ${filteredFiles[e].length}]`);
        });

        return filteredFiles;
    }

    async makePublic(bucketName: string, filePath: string) {
        try {
            const bucket = await this.getBucket(bucketName)

            await bucket.file(filePath).makePublic();
            return true;
        } catch (e) {
            console.log('ERROR AL HACEL PUBLICO EL AUDIO', e);
            return false;
        }
    }

    getPublicURL(file: File): string {
        try {
            return file.publicUrl()
        } catch (e) {
            console.log('ERROR ', e);
            return e
        }
    }

    async getDirectories(bucketName: string, path: string): Promise<string[]> {
        if (!path.endsWith('/')) path += '/';
        const bucket = await this.getBucket(bucketName)

        const [_, __, apiResponse] = await bucket.getFiles({ prefix: path, delimiter: '/', autoPaginate: false });
        // const [_files, _nextQuery, apiResponse] = await bucket.getFiles({ prefix: path, delimiter: '/', autoPaginate: false });

        return apiResponse.prefixes ? apiResponse.prefixes : [];
    }

    async getAllDirectories(bucketName: string, path: string): Promise<string[]> {
        console.log('SCANNED', path);

        const folders = await this.getDirectories(bucketName, path);

        for (const folder of folders) {
            console.log('____', folder);

            folders.push(...(await this.getAllDirectories(bucketName, folder)));
        }
        return folders;
    }
}
