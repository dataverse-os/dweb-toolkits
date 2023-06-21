import {Filelike, Web3Storage as Web3StorageSDK} from 'web3.storage';

// const
export class Web3Storage {
    private accessToken = import.meta.env.VITE_WEB3_STORAGE_TOKEN

    getAccessToken() {
        return this.accessToken;
    }

    makeFileObjects() {
        const obj = { hello: 'world' };
        const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });

        const files = [
            new File(['contents-of-file-1'], 'plain-utf8.txt'),
            new File([blob], 'hello.json'),
        ];
        return files;
    }

    makeStorageClient() {
        return new Web3StorageSDK({ token: this.getAccessToken() ?? '' });
    }

    async storeFiles(files: any) {
        console.log("files: ", files);
        const client = this.makeStorageClient();
        const cid = await client.put(files, { wrapWithDirectory: false });
        return cid;
    }

    async retrieveFiles(cid: string) {
        const client = this.makeStorageClient();
        const res = await client.get(cid);
        if (!res || !res.ok) {
            throw new Error(`failed to get ${cid}`);
        }
        let data;
        const files = await res.files();
        for (const file of files) {
            data = await file.text();
        }

        return data;
    }

    async checkStatus(cid: string) {
        const client = this.makeStorageClient();
        const status = await client.status(cid);
        console.log(status);
        if (status) { /* empty */ }
    }
}

export const stringToStream = (str: string): ReadableStream<Uint8Array> => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    return new ReadableStream({
        start(controller) {
            controller.enqueue(uint8Array);
            controller.close();
        }
    });
}

export default class Upload implements Filelike {
    name: string;
    data: Uint8Array;

    constructor(name: string, data: Uint8Array) {
        this.name = name;
        this.data = data;
    }

    stream(): ReadableStream {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return new ReadableStream({
            start(controller) {
                controller.enqueue(Buffer.from(self.data));
                controller.close();
            },
        });
    }
}

export const web3Storage = new Web3Storage();