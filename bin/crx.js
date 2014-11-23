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

program
  .version(pkg.version)
  .option("-f, --file [file]", "input/output <file> instead of stdin/stdout")
  .option("-p, --private-key <file>", "relative path to private key [key.pem]")
  .option("-b, --max-buffer <total>", "max amount of memory allowed to generate the crx, in byte")
  // coming soon
  // .option("-x, --xml", "output autoupdate xml instead of extension ")

program
  .command("keygen [directory]")
  .description("generate a private key in [directory]/key.pem")
  .action(keygen);

program
  .command("pack [directory]")
  .description("pack [directory] into a .crx extension")
  .action(pack);

// program
//   .command("unpack [directory]")
//   .description("unpack a .crx extension into a directory")
//   .action(unpack);

program.parse(process.argv);

function keygen(dir, cb) {
  dir = resolve(cwd, dir);

  var keyPath = join(dir, "key.pem");

  fs.exists(keyPath, function(exists) {
    if (exists) {
      return cb && typeof(cb) == "function" && cb();
    }

    var key = new rsa({ b: 1024 });

    fs.writeFile(keyPath, key.getPrivatePEM(), function(err){
      if (err){
        throw err;
      }

      cb && typeof(cb) == "function" && cb();
    })
  })
}

function pack(dir) {
  var input = resolve(cwd, dir);
  var output = program.file === true ? input + ".crx" : (program.file ? resolve(cwd, program.file) : false);

  var stream = output ? fs.createWriteStream(output) : process.stdout;
  var key = program.privateKey ? resolve(cwd, program.privateKey) : join(input, "key.pem");

  var crx = new ChromeExtension({
    rootDirectory: input,
    maxBuffer: program.maxBuffer
  });

  fs.readFile(key, function(err, data) {
    if (err) {
      throw err;
    }

    crx.privateKey = data;

    crx.pack().then(function(crxBuffer) {
      stream.end(crxBuffer);

      return crx.destroy();
    });
  });
}