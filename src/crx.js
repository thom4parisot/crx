'use strict';

var fs = require("fs");
var path = require("path");
var join = path.join;
var crypto = require("crypto");
var spawn = require("child_process").spawn;
var wrench = require("wrench");
var archiver = require("archiver");
var rm = require('rimraf');
var Promise = require('es6-promise').Promise;

function ChromeExtension(attrs) {
  if ((this instanceof ChromeExtension) !== true) {
    return new ChromeExtension(attrs);
  }

  /*
   Defaults
   */
  this.appId = null;

  this.manifest = '';

  this.loaded = false;

  this.package = null;

  this.rootDirectory = '';

  this.publicKey = null;

  this.privateKey = null;

  this.signature = null;

  this.contents = null;

  this.codebase = null;

  /*
  Copying attributes
   */
  for (var name in attrs) {
    this[name] = attrs[name];
  }

  this.path = join("tmp", "crx-" + (Math.random() * 1e17).toString(36))
}

ChromeExtension.prototype = {

  /**
   * Destroys generated files.
   *
   * @returns {Promise}
   */
  destroy: function () {
    var path = this.path;

    return new Promise(function(resolve, reject){
      rm(path, function(err){
        if (err){
          return reject(err);
        }

        resolve();
      });
    });
  },

  pack: function (cb) {
    if (!this.loaded) {
      return this.load().then(this.pack.bind(this, cb));
    }

    this.generatePublicKey(function (err) {
      if (err) return cb(err);

      var manifest = JSON.stringify(this.manifest);

      this.writeFile("manifest.json", manifest, function (err) {
        if (err) return cb(err);

        this.loadContents(function (err) {
          if (err) return cb(err);

          this.generateSignature();
          this.generatePackage();

          cb.call(this, null, this.package)
        })
      })
    })
  },

  /**
   * Loads extension manifest and copies its content to a workable path.
   *
   * @returns {Promise}
   */
  load: function () {
    if (!fs.existsSync("tmp")) {
      fs.mkdirSync("tmp");
    }

    var selfie = this;

    return new Promise(function(resolve, reject){
      wrench.copyDirRecursive(selfie.rootDirectory, selfie.path, function (err) {
        if (err) {
          return reject(err);
        }

        selfie.manifest = require(join(process.cwd(), selfie.path, "manifest.json"));
        selfie.loaded = true;

        resolve(selfie);
      });
    });
  },

  writeFile: function (path, data, cb) {
    path = join(this.path, path);

    fs.writeFile(path, data, function (err, data) {
      if (err) return cb.call(this, err);

      cb.call(this)
    }.bind(this));
  },

  generatePublicKey: function (cb) {
    var rsa = spawn("openssl", ["rsa", "-pubout", "-outform", "DER"])

    rsa.stdout.on("data", function (data) {
      this.publicKey = data;
      cb && cb.call(this, null, this)
    }.bind(this));

    rsa.stdin.end(this.privateKey)
  },

  generateSignature: function () {
    return this.signature = new Buffer(
      crypto
        .createSign("sha1")
        .update(this.contents)
        .sign(this.privateKey),

      "binary"
    )
  },

  loadContents: function (cb) {
    var archive = archiver("zip");
    this.contents = "";

    var files = wrench.readdirSyncRecursive(this.path);

    files.forEach(function (current) {
      var stat = fs.statSync(join(this.path, current));

      if (stat.isFile() && current !== "key.pem") {
        archive.append(fs.createReadStream(join(this.path, current)), {name: current})
      }
    }, this);

    archive.finalize();

    // Relates to the issue: "Event 'finished' no longer valid #18"
    // https://github.com/jed/crx/issues/18
    // TODO: Buffer concat could be a problem when building a big extension.
    //       So ideally only the 'finish' callback must be used.
    archive.on('readable', function () {
      this.contents = !this.contents.length ? archive.read() : Buffer.concat([this.contents, archive.read()]);
    }.bind(this));

    archive.on('finish', function () {
      cb.call(this);
    }.bind(this));

    archive.on("error", function (err) {
      throw err;
    });
  },

  generatePackage: function () {
    var signature = this.signature;
    var publicKey = this.publicKey;
    var contents = this.contents;

    var keyLength = publicKey.length;
    var sigLength = signature.length;
    var zipLength = contents.length;
    var length = 16 + keyLength + sigLength + zipLength;

    var crx = new Buffer(length);

    crx.write("Cr24" + Array(13).join("\x00"), "binary");

    crx[4] = 2;
    crx.writeUInt32LE(keyLength, 8);
    crx.writeUInt32LE(sigLength, 12);

    publicKey.copy(crx, 16);
    signature.copy(crx, 16 + keyLength);
    contents.copy(crx, 16 + keyLength + sigLength);

    return this.package = crx
  },

  /**
   * Generates an appId from the publicKey.
   *
   * BC BREAK `this.appId` is not stored anymore (since 1.0.0)
   *
   * @returns {string}
   */
  generateAppId: function () {
    return crypto
      .createHash("sha256")
      .update(this.publicKey)
      .digest("hex")
      .slice(0, 32)
      .replace(/./g, function (x) {
        return (parseInt(x, 16) + 10).toString(26);
      });
  },

  /**
   * Generates an updateXML file from the extension content.
   *
   * BC BREAK `this.updateXML` is not stored anymore (since 1.0.0)
   *
   * @returns {Buffer}
   */
  generateUpdateXML: function () {
    if (!this.codebase) {
      throw new Error("No URL provided for update.xml.");
    }

    return Buffer(
      "<?xml version='1.0' encoding='UTF-8'?>\n" +
      "<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>\n" +
      "  <app appid='" + (this.appId || this.generateAppId()) + "'>\n" +
      "    <updatecheck codebase='" + this.codebase + "' version='" + this.manifest.version + "' />\n" +
      "  </app>\n" +
      "</gupdate>"
    );
  }
};

module.exports = ChromeExtension;
