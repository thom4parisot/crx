"use strict";

var PBf = require("pbf");
var crypto = require("crypto");
var crx = require("./crx3.js.pb");

/**
 * Generates and returns a signed package from extension content.
 *
 * Based on `crx_creator` from Chromium project.
 *
 * @see {@link https://github.com/chromium/chromium/blob/master/components/crx_file/crx_creator.cc}
 * @param {Buffer} privateKey
 * @param {Buffer} publicKey
 * @param {Buffer} contents
 * @returns {Buffer}
 */
module.exports = function generatePackage (privateKey, publicKey, contents) {
  var pb;

  pb = new PBf();
  crx.SignedData.write({
    crx_id: getCrxId(publicKey)
  }, pb);
  var signedHeaderData = pb.finish();

  pb = new PBf();
  crx.CrxFileHeader.write({
    sha256_with_rsa: [{
      public_key: publicKey,
      signature : generateSignature(privateKey, signedHeaderData, contents)
    }],
    signed_header_data: signedHeaderData
  }, pb);
  var header = Buffer.from(pb.finish());

  var size =
    kSignature.length + // Magic constant
    kVersion.length + // Version number
    SIZE_BYTES + // Header size
    header.length +
    contents.length;

  var result = Buffer.allocUnsafe(size);

  var index = 0;
  kSignature.copy(result, index);
  kVersion.copy(result, index += kSignature.length);
  result.writeUInt32LE(header.length, index += kVersion.length);
  header.copy(result, index += SIZE_BYTES);
  contents.copy(result, index += header.length);

  return result;
};

/**
 * CRX IDs are 16 bytes long
 * @constant
 */
const CRX_ID_SIZE = 16;

/**
 * CRX3 uses 32bit numbers in various places,
 * so let's prepare size constant for that.
 * @constant
 */
const SIZE_BYTES = 4;

/**
 * Used for file format.
 * @see {@link https://github.com/chromium/chromium/blob/master/components/crx_file/crx3.proto}
 * @constant
 */
const kSignature = Buffer.from("Cr24", "utf8");

/**
 * Used for file format.
 * @see {@link https://github.com/chromium/chromium/blob/master/components/crx_file/crx3.proto}
 * @constant
 */
const kVersion = Buffer.from([3, 0, 0, 0]);

/**
 * Used for generating package signatures.
 * @see {@link https://github.com/chromium/chromium/blob/master/components/crx_file/crx3.proto}
 * @constant
 */
const kSignatureContext = Buffer.from("CRX3 SignedData\x00", "utf8");

/**
 * Given public key data, returns CRX ID.
 *
 * @param {Buffer} publicKey
 * @returns {Buffer}
 */
function getCrxId (publicKey) {
  var hash = crypto.createHash("sha256");
  hash.update(publicKey);
  return hash.digest().slice(0, CRX_ID_SIZE);
}

/**
* Generates and returns a signature.
*
* @param {Buffer} privateKey
* @param {Buffer} signedHeaderData
* @param {Buffer} contents
* @returns {Buffer}
*/
function generateSignature (privateKey, signedHeaderData, contents) {
  var hash = crypto.createSign("sha256");

  // Magic constant
  hash.update(kSignatureContext);

  // Size of signed_header_data
  var sizeOctets = Buffer.allocUnsafe(SIZE_BYTES);
  sizeOctets.writeUInt32LE(signedHeaderData.length, 0);
  hash.update(sizeOctets);

  // Content of signed_header_data
  hash.update(signedHeaderData);

  // ZIP content
  hash.update(contents);

  return Buffer.from(hash.sign(privateKey), "binary");
}
