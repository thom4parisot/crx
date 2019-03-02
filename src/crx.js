"use strict";

var path = require("path");
var join = path.join;
var archiver = require("archiver");
var resolve = require("./resolver.js");
var {generateAppId, generatePublicKey, sign} = require("../crypto");

const DEFAULTS = {
  appId: null,
  rootDirectory: "",
  publicKey: null,
  privateKey: null,
  codebase: null,
  path: null,
  src: "**",
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

      var signature = selfie.generateSignature(contents);

      return selfie.generatePackage(signature, publicKey, contents);
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
    return generatePublicKey(this.privateKey, "der");
  }

  /**
   * Generates a SHA1 package signature.
   *
   * BC BREAK `this.signature` is not stored anymore (since 1.0.0)
   *
   * @param {Buffer} contents
   * @returns {Buffer}
   */
  generateSignature (contents) {
    return sign(contents, this.privateKey);
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
   * Generates and returns a signed package from extension content.
   *
   * BC BREAK `this.package` is not stored anymore (since 1.0.0)
   *
   * @param {Buffer} signature
   * @param {Buffer} publicKey
   * @param {Buffer} contents
   * @returns {Buffer}
   */
  generatePackage (signature, publicKey, contents) {
    var keyLength = publicKey.length;
    var sigLength = signature.length;
    var zipLength = contents.length;
    var length = 16 + keyLength + sigLength + zipLength;

    var crx = Buffer.alloc(length);

    crx.write("Cr24" + new Array(13).join("\x00"), "binary");

    crx[4] = 2;
    crx.writeUInt32LE(keyLength, 8);
    crx.writeUInt32LE(sigLength, 12);

    publicKey.copy(crx, 16);
    signature.copy(crx, 16 + keyLength);
    contents.copy(crx, 16 + keyLength + sigLength);

    return crx;
  }

  /**
   *
   *
   *
   * @returns
   */
  /**
   * Generates an updateXML file from the extension content.
   *
   * @param  {Object=} options
   * @param  {String=} options.appId    AppId generated `generateAppId()` or `generateAppIdFromPath()`
   * @param  {String=} options.codebase Absolute URL from which the self-hosted and signed extension will be accessible from.
   * @return {Buffer}
   */
  generateUpdateXML (options={}) {
    const {appId, codebase} = options;

    if (!this.codebase) {
      throw new Error("No URL provided for update.xml.");
    }

    return Buffer.from(`<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${appId || this.appId || generateAppId(this.publicKey)}'>
    <updatecheck codebase='${codebase || this.codebase}' version='${this.manifest.version}' />
  </app>
</gupdate>`);
  }
}

module.exports = ChromeExtension;
