"use strict";

var RSA = require("node-rsa");
var crypto = require("crypto");

/**
 * Generate an AppId from a public key
 *
 * @param  {String|Buffer} content Public Key content
 * @return {String}        AppId
 */
function generateAppId (content) {
  if (typeof content !== 'string' && !(content instanceof Buffer)) {
    throw new Error('Public key is neither set, nor given');
  }

  return crypto
    .createHash("sha256")
    .update(content)
    .digest()
    .toString("hex")
    .split("")
    .map(x => (parseInt(x, 16) + 0x0a).toString(26))
    .join("")
    .slice(0, 32);
}

/**
 * Generate an AppId from a filesystem path
 *
 * @param  {String} path Unix or Windows path to the folder containing the manifest.json
 * @return {String}      AppId
 */
function generateAppIdFromPath (path) {
  var charCode = path.charCodeAt(0);

  // Handling Windows Path
  // 65 (A) < charCode < 122 (z)
  if (charCode >= 65 && charCode <= 122 && path[1] === ':') {
    path = Buffer.from(
      path[0].toUpperCase() + path.slice(1),
      "utf-16le"
    );
  }

  return generateAppId(path);
}

/**
 * [generatePrivateKey description]
 * @return {Promise} [description]
 */
function generatePrivateKey () {
  return Promise.resolve(new RSA({ b: 2048 }))
    .then(key => key.exportKey("pkcs1-private-pem"));
}

/**
 * [generatePublicKey description]
 * @param  {Buffer} privateKey [description]
 * @param  {String} format     [description]
 * @return {String|Buffer}            [description]
 */
function generatePublicKey (privateKey, format) {
  var ALLOWED_FORMATS = ['der', 'pem'];

  return new Promise(function(resolve, reject){
    if (!privateKey) {
      return reject('Impossible to generate a public key: privateKey option has not been defined or is empty.');
    }

    if (format && ALLOWED_FORMATS.indexOf(format) === -1) {
      return reject('Allowed public key formats are "der" (default) or "pem".');
    }

    var key = new RSA(privateKey);

    resolve(key.exportKey('pkcs8-public-' + (format || 'der')));
  });
};

/**
 * [sign description]
 * @param  {Any} content    [description]
 * @param  {Buffer|String} privateKey [description]
 * @return {Buffer}            [description]
 */
function sign (content, privateKey) {
  return crypto.createSign("sha1").update(content).sign(privateKey);
}

module.exports = {
  generateAppId: generateAppId,
  generateAppIdFromPath: generateAppIdFromPath,
  generatePublicKey: generatePublicKey,
  generatePrivateKey: generatePrivateKey,
  sign: sign,
}
