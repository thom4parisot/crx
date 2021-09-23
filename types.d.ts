#!/usr/bin/env node
declare module "src/resolver" {
    function _exports(pathOrFiles: string | Array<string>): Promise<any>;
    export = _exports;
    export type PathMetadata = {
        path: string;
        src: string;
    };
}
declare module "src/crx2" {
    function _exports(privateKey: Buffer, publicKey: Buffer, contents: Buffer): Buffer;
    export = _exports;
}
declare module "src/crx3.pb" {
    export namespace CrxFileHeader {
        function read(pbf: any, end: any): any;
        function _readField(tag: any, obj: any, pbf: any): void;
        function write(obj: any, pbf: any): void;
    }
    export namespace AsymmetricKeyProof {
        function read(pbf: any, end: any): any;
        function _readField(tag: any, obj: any, pbf: any): void;
        function write(obj: any, pbf: any): void;
    }
    export namespace SignedData {
        function read(pbf: any, end: any): any;
        function _readField(tag: any, obj: any, pbf: any): void;
        function write(obj: any, pbf: any): void;
    }
}
declare module "src/crx3" {
    function _exports(privateKey: Buffer, publicKey: Buffer, contents: Buffer): Buffer;
    export = _exports;
}
declare module "src/index" {
    export = ChromeExtension;
    /**
     * @typedef {Object} BrowserManifest
     * @property {string} minimum_chrome_version
     * @property {string} version
     */
    /**
     * @typedef {Object} BrowserExtensionOptions
     */
    /**
     * @class BrowserExtension
     */
    class ChromeExtension {
        /**
         * @constructor
         * @param {BrowserExtensionOptions} attrs
         */
        constructor(attrs: BrowserExtensionOptions);
        /** @type {string | null} */
        appId: string | null;
        /** @type {string} */
        rootDirectory: string;
        /** @type {Buffer} */
        publicKey: Buffer;
        /** @type {Buffer} */
        privateKey: Buffer;
        /** @type {string | null} */
        codebase: string | null;
        /** @type {string} */
        path: string;
        /** @type {string} */
        src: string;
        /** @type {Array.<string>} */
        ignore: Array<string>;
        /** @type {CrxVersion} */
        version: CrxVersion;
        /** @type {boolean} */
        loaded: boolean;
        /** @type {BrowserManifest} */
        manifest: BrowserManifest;
        /**
         * Packs the content of the extension in a crx file.
         *
         * @param {Buffer=} contentsBuffer
         * @returns {Promise<Buffer>}
         * @example
         *
         * crx.pack().then(function(crxContent){
         *  // do something with the crxContent binary data
         * });
         *
         */
        pack(contentsBuffer?: Buffer | undefined): Promise<Buffer>;
        /**
         * Loads extension manifest and copies its content to a workable path.
         *
         * @param {string=} path
         * @returns {Promise<ChromeExtension>}
         */
        load(path?: string | undefined): Promise<ChromeExtension>;
        /**
         * Generates a public key.
         *
         * BC BREAK `this.publicKey` is not stored anymore (since 1.0.0)
         * BC BREAK callback parameter has been removed in favor to the promise interface.
         *
         * @returns {Promise<Buffer>} Resolves to {Buffer} containing the public key
         * @example
         *
         * crx.generatePublicKey(function(publicKey){
         *   // do something with publicKey
         * });
         */
        generatePublicKey(): Promise<Buffer>;
        /**
         *
         * BC BREAK `this.contents` is not stored anymore (since 1.0.0)
         *
         * @returns {Promise<Buffer>}
         */
        loadContents(): Promise<Buffer>;
        /**
         * Generates an appId from the publicKey.
         * Public key has to be set for this to work, otherwise an error is thrown.
         *
         * BC BREAK `this.appId` is not stored anymore (since 1.0.0)
         * BC BREAK introduced `publicKey` parameter as it is not stored any more since 2.0.0
         *
         * @param {Buffer|string} [keyOrPath] the public key to use to generate the app ID
         * @returns {string}
         */
        generateAppId(keyOrPath?: string | Buffer | undefined): string;
        /**
         * Generates an updateXML file from the extension content.
         *
         * If manifest does not include `minimum_chrome_version`, defaults to:
         * - '29.0.0' for CRX2, which is earliest extensions API available
         * - '64.0.3242' for CRX3, which is when Chrome etension packager switched to CRX3
         *
         * BC BREAK `this.updateXML` is not stored anymore (since 1.0.0)
         *
         * [Chrome Extensions APIs]{@link https://developer.chrome.com/extensions/api_index}
         * [Chrome verions]{@link https://en.wikipedia.org/wiki/Google_Chrome_version_history}
         * [Chromium switches to CRX3]{@link https://chromium.googlesource.com/chromium/src.git/+/b8bc9f99ef4ad6223dfdcafd924051561c05ac75}
         * @returns {Buffer}
         */
        generateUpdateXML(): Buffer;
    }
    namespace ChromeExtension {
        export { PathMetadata, BrowserManifest, BrowserExtensionOptions };
    }
    /**
     * CrxVersion
     */
    type CrxVersion = number;
    namespace CrxVersion {
        const VERSION_2: number;
        const VERSION_3: number;
    }
    type BrowserManifest = {
        minimum_chrome_version: string;
        version: string;
    };
    type BrowserExtensionOptions = Object;
    type PathMetadata = import("src/resolver").PathMetadata;
}
declare module "src/cli" {
    export = program;
    import program = require("commander");
}
