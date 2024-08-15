import { put, list, del, head } from '@vercel/blob';

const getBlobClient = () => {
    return {
        putBlob: async (filename: string, data: Buffer | ReadableStream<Uint8Array>, options?: { access: 'public' }) => {
            return await put(filename, data, options);
        },
        listBlobs: async (options?: { cursor?: string; limit?: number; prefix?: string }) => {
            return await list(options);
        },
        deleteBlob: async (filename: string) => {
            return await del(filename);
        },
        headBlob: async (url: string, options?: { token?: string; abortSignal?: AbortSignal }) => {
            return await head(url, options);
        }
    };
};

declare const globalThis: {
    blobClientGlobal: ReturnType<typeof getBlobClient>;
} & typeof global;

const blobClient = globalThis.blobClientGlobal ?? getBlobClient();

export default blobClient;

if (process.env.NODE_ENV !== 'production') {
    globalThis.blobClientGlobal = blobClient;
}

