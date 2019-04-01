"use strict";

var path = require("path");
var join = path.join;
var crypto = require("crypto");
var RSA = require("node-rsa");
var archiver = require("archiver");
var resolve = require("./resolver.js");
var crx2 = require("./crx2.js");
var crx3 = require("./crx3.js");

const DEFAULTS = {
  appId: null,
  rootDirectory: "",
  publicKey: null,
  privateKey: null,
  codebase: null,
  path: null,
  src: "**",
  version: 3,
};

class ChromeExtension {
  constructor(attrs) {
    // Setup defaults
    Object.assign(this, DEFAULTS, attrs);

    this.loaded = false;
  }

  /**
   * Packs the content of the extension in a crx file.
   *
   * @param {Buffer=} contentsBuffer
   * @returns {Promise}
   * @example
   *
   * crx.pack().then(function(crxContent){
   *  // do something with the crxContent binary data
   * });
   *
   */
  pack (contentsBuffer) {
    if (!this.loaded) {
      return this.load().then(this.pack.bind(this, contentsBuffer));
    }

    var selfie = this;
    var packP = [
      this.generatePublicKey(),
      contentsBuffer || selfie.loadContents()
    ];

    return Promise.all(packP).then(function(outputs) {
      var publicKey = outputs[0];
      var contents = outputs[1];

      selfie.publicKey = publicKey;

      if (selfie.version === 2) {
        return crx2(selfie.privateKey, publicKey, contents);
      }

      return crx3(selfie.privateKey, publicKey, contents);
    });
  }

  /**
   * Loads extension manifest and copies its content to a workable path.
   *
   * @param {string=} path
   * @returns {Promise}
   */
  load (path) {
    var selfie = this;

    return resolve(path || selfie.rootDirectory).then(function(metadata) {
      selfie.path = metadata.path;
      selfie.src = metadata.src;

      var manifestPath = join(selfie.path, "manifest.json");
      delete require.cache[manifestPath];

      selfie.manifest = require(manifestPath);
      selfie.loaded = true;

      return selfie;
    });
  }

  /**
   * Generates a public key.
   *
   * BC BREAK `this.publicKey` is not stored anymore (since 1.0.0)
   * BC BREAK callback parameter has been removed in favor to the promise interface.
   *
   * @returns {Promise} Resolves to {Buffer} containing the public key
   * @example
   *
   * crx.generatePublicKey(function(publicKey){
   *   // do something with publicKey
   * });
   */
  generatePublicKey () {
    var privateKey = this.privateKey;

    return new Promise(function(resolve, reject) {
      if (!privateKey) {
        return reject(
          "Impossible to generate a public key: privateKey option has not been defined or is empty."
        );
      }

      var key = new RSA(privateKey);

      resolve(key.exportKey("pkcs8-public-der"));
    });
  }

  /**
   *
   * BC BREAK `this.contents` is not stored anymore (since 1.0.0)
   *
   * @returns {Promise}
   */
  loadContents () {
    var selfie = this;

    return new Promise(function(resolve, reject) {
      var archive = archiver("zip");
      var contents = Buffer.from("");

      if (!selfie.loaded) {
        throw new Error(
          "crx.load needs to be called first in order to prepare the workspace."
        );
      }

      archive.on("error", reject);

      /*
        TODO: Remove in v4.
        It will be better to resolve an archive object
        rather than fitting everything in memory.

        @see https://github.com/oncletom/crx/issues/61
      */
      archive.on("data", function(buf) {
        contents = Buffer.concat([contents, buf]);
      });

      archive.on("finish", function() {
        resolve(contents);
      });

      archive
        .glob(selfie.src, {
          cwd: selfie.path,
          matchBase: true,
          ignore: ["*.pem", ".git", "*.crx"]
        })
        .finalize();
    });
  }

  /**
   * Generates an appId from the publicKey.
   * Public key has to be set for this to work, otherwise an error is thrown.
   *
   * BC BREAK `this.appId` is not stored anymore (since 1.0.0)
   * BC BREAK introduced `publicKey` parameter as it is not stored any more since 2.0.0
   *
   * @param {Buffer|string} [publicKey] the public key to use to generate the app ID
   * @returns {string}
   */
  generateAppId (keyOrPath) {
    keyOrPath = keyOrPath || this.publicKey;

    if (typeof keyOrPath !== "string" && !(keyOrPath instanceof Buffer)) {
      throw new Error("Public key is neither set, nor given");
    }

    // Handling Windows Path
    // Possibly to be moved in a different method
    if (typeof keyOrPath === "string") {
      var charCode = keyOrPath.charCodeAt(0);

      // 65 (A) < charCode < 122 (z)
      if (charCode >= 65 && charCode <= 122 && keyOrPath[1] === ":") {
        keyOrPath = keyOrPath[0].toUpperCase() + keyOrPath.slice(1);

        keyOrPath = Buffer.from(keyOrPath, "utf-16le");
      }
    }

    return crypto
      .createHash("sha256")
      .update(keyOrPath)
      .digest()
      .toString("hex")
      .split("")
      .map(x => (parseInt(x, 16) + 0x0a).toString(26))
      .join("")
      .slice(0, 32);
  }

  /**
   * Generates an updateXML file from the extension content.
   *
   * If manifest does not include `minimum_chrome_version`, defaults to:
   * - '29.0.0' for CRX2, which is earliest extensions API available
   * - '64.0.3242' for CRX3, which is when Chrome etension packager switched to CRX3
   *
   * BC BREAK `this.updateXML` is not stored anymore (since 1.0.0)
   *
   * @see
   *   [Chrome Extensions APIs]{@link https://developer.chrome.com/extensions/api_index}
   * @see
   *   [Chrome verions]{@link https://en.wikipedia.org/wiki/Google_Chrome_version_history}
   * @see
   *   [Chromium switches to CRX3]{@link https://chromium.googlesource.com/chromium/src.git/+/b8bc9f99ef4ad6223dfdcafd924051561c05ac75}
   * @returns {Buffer}
   */
  generateUpdateXML () {
    if (!this.codebase) {
      throw new Error("No URL provided for update.xml.");
    }

    var browserVersion = this.manifest.minimum_chrome_version
      || (this.version < 3 && "29.0.0") // Earliest version with extensions API
      || "64.0.3242"; // Chrome started generating CRX3 packages

    return Buffer.from(`<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${this.appId || this.generateAppId()}'>
    <updatecheck codebase='${this.codebase}' version='${this.manifest.version}' prodversionmin='${browserVersion}' />
  </app>
</gupdate>`);
  }
}

module.exports = ChromeExtension;
