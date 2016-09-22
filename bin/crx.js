#!/usr/bin/env node

var path = require("path");
var fs = require("fs");
var rsa = require('node-rsa');
var Promise = require('es6-promise').Promise;

var program = require("commander");
var ChromeExtension = require("..");
var pkg = require('../package.json');

var resolve = path.resolve;
var join = path.join;

var cwd = process.cwd();

program.version(pkg.version);
// coming soon
// .option("-x, --xml", "output autoupdate xml instead of extension ")

program
  .command("keygen [directory]")
  .option("--force", "overwrite the private key if it exists")
  .description("generate a private key in [directory]/key.pem")
  .action(keygen);

program
  .command("pack [directory]")
  .description("pack [directory] into a .crx extension")
  .option("-o, --output <file>", "write the crx content to <file> instead of stdout")
  .option("--zip-output <file>", "write the zip content to <file>")
  .option("-p, --private-key <file>", "relative path to private key [key.pem]")
  .option("-b, --max-buffer <total>", "max amount of memory allowed to generate the crx, in byte")
  .action(pack);

program.parse(process.argv);

/**
 * Read a specified key file from disk
 * @param {String} keyPath path to the key to read
 * @returns {Promise}
 */
function readKeyFile(keyPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(keyPath, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Generate a new key file
 * @param {String} keyPath path of the key file to create
 * @returns {Promise}
 */
function generateKeyFile(keyPath) {
  return new Promise(function(resolve, reject) {
    var key = new rsa({b: 2048}),
        keyVal = key.exportKey('pkcs1-private-pem');

    fs.writeFile(keyPath, keyVal, function(err){
      if (err) {
        throw err;
      }

      console.log('Key file has been generated at %s', keyPath);

      resolve(keyVal);
    });
  });
}

function keygen (dir, program) {
  dir = dir ? resolve(cwd, dir) : cwd;

  var keyPath = join(dir, "key.pem");

  fs.exists(keyPath, function (exists) {
    if (exists && !program.force) {
      throw new Error('key.pem already exists in the given location.');
    }

    generateKeyFile(keyPath);
  });
}

function pack (dir, program) {
  var input = dir ? resolve(cwd, dir) : cwd;
  var keyPath = program.privateKey ? resolve(cwd, program.privateKey) : join(input, "key.pem");
  var output;

  if (program.output) {
    if (path.extname(program.output) !== '.crx') {
      throw new Error('-o file is expected to have a `.crx` suffix: [' + program.output + '] was given.');
    }
  }

  if (program.zipOutput) {
    if (path.extname(program.zipOutput) !== '.zip') {
      throw new Error('--zip-output file is expected to have a `.zip` suffix: [' + program.zipOutput + '] was given.');
    }
  }

  var crx = new ChromeExtension({
    rootDirectory: input,
    maxBuffer:     program.maxBuffer
  });

  readKeyFile(keyPath).then(null, function (err) {
    // If the key file doesn't exist, create one
    if (err.code === 'ENOENT') {
      return generateKeyFile(keyPath);
    } else {
      throw err;
    }
  }).then(function (key) {
    crx.privateKey = key;
  }).then(function () {
    crx.load().then(function () {
      return crx.loadContents();
    }).then(function (zipBuffer) {

      if (program.zipOutput) {
        var outFile = resolve(cwd, program.zipOutput);

        fs.createWriteStream(outFile).end(zipBuffer);
      }

      return crx.pack(zipBuffer);
    }).then(function (crxBuffer) {

      if (program.output) {
        output = program.output;
      } else {
        output = path.basename(cwd) + '.crx';
      }

      var outFile = resolve(cwd, output);
      (outFile ? fs.createWriteStream(outFile) : process.stdout).end(crxBuffer);
    }).then(function () {
      console.log('%s has been generated in %s', output, cwd);
    });
  });
}

module.exports = program;
