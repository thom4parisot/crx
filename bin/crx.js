#!/usr/bin/env node

var path = require("path");
var fs = require("fs");
var rsa = require('node-rsa');

var program = require("commander");
var ChromeExtension = require("..");
var pkg = require('../package.json');

var resolve = path.resolve;
var join = path.join;

var cwd = process.cwd();

program.version(pkg.version)
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

function keygen (dir, program) {
  dir = resolve(cwd, dir);

  var keyPath = join(dir, "key.pem");

  fs.exists(keyPath, function (exists) {
    if (exists && !program.force) {
      throw new Error('key.pem already exists in the given location.');
    }

    var key = new rsa({b: 1024});

    fs.writeFile(keyPath, key.exportKey('pkcs1-private-pem'), function(err){
      if (err){
        throw err;
      }

      console.log('%s has been generated in %s', 'key.pem', dir);
    })
  })
}

function pack (dir, program) {
  var input = resolve(cwd, dir);
  var key = program.privateKey ? resolve(cwd, program.privateKey) : join(input, "key.pem");

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

  fs.readFile(key, function (err, data) {
    if (err) {
      throw err;
    }

    crx.privateKey = data;

    crx.load().then(function () {
      return crx.loadContents();
    })
      .then(function (zipBuffer) {
	if (program.zipOutput) {
	  var outFile = resolve(cwd, program.zipOutput);

	  fs.createWriteStream(outFile).end(zipBuffer);
	}

	return crx.pack(zipBuffer);
      })
      .then(function (crxBuffer) {
	var outFile = resolve(cwd, program.output);
	(outFile ? fs.createWriteStream(outFile) : process.stdout).end(crxBuffer);
      });
  });
}
