#!/usr/bin/env node

var path = require("path");
var fs = require("fs");
var {promisify} = require("util");
var writeFile = promisify(fs.writeFile);
var readFile = promisify(fs.readFile);
var {generatePrivateKey} = require("../crypto");

var program = require("commander");
var ChromeExtension = require("..");
var pkg = require("../package.json");

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
  .option(
    "-o, --output <file>",
    "write the crx content to <file> instead of stdout"
  )
  .option("--zip-output <file>", "write the zip content to <file>")
  .option("-p, --private-key <file>", "relative path to private key [key.pem]")
  .option(
    "-b, --max-buffer <total>",
    "max amount of memory allowed to generate the crx, in byte"
  )
  .action(pack);

program.parse(process.argv);



function keygen(dir, program) {
  dir = dir ? resolve(cwd, dir) : cwd;

  var keyPath = join(dir, "key.pem");

  fs.exists(keyPath, function(exists) {
    if (exists && !program.force) {
      throw new Error("key.pem already exists in the given location.");
    }

    generatePrivateKey().then(privateKey => writeFile(keyPath, privateKey));
  });
}

function pack(dir, program) {
  var input = dir ? resolve(cwd, dir) : cwd;
  var keyPath = program.privateKey
    ? resolve(cwd, program.privateKey)
    : join(input, "key.pem");
  var output;

  if (program.output) {
    if (path.extname(program.output) !== ".crx") {
      throw new Error(
        "-o file is expected to have a `.crx` suffix: [" +
          program.output +
          "] was given."
      );
    }
  }

  if (program.zipOutput) {
    if (path.extname(program.zipOutput) !== ".zip") {
      throw new Error(
        "--zip-output file is expected to have a `.zip` suffix: [" +
          program.zipOutput +
          "] was given."
      );
    }
  }

  readFile(keyPath)
    .then(function(privateKey) {
      return new ChromeExtension({
        rootDirectory: input,
        maxBuffer: program.maxBuffer,
        privateKey
      });
    })
    .then(function(crx) {
      crx.load()
        .then(() => crx.loadContents())
        .then(function(fileBuffer) {
          if (program.zipOutput) {
            var outFile = resolve(cwd, program.zipOutput);

            fs.createWriteStream(outFile).end(fileBuffer);
          }
          else {
            return crx.pack(fileBuffer);
          }
        })
        .then(function(crxBuffer) {
          if (program.zipOutput) {
            return;
          }
          else if (program.output) {
            output = program.output;
          }
          else {
            output = path.basename(cwd) + ".crx";
          }

          var outFile = resolve(cwd, output);
          if (outFile) {
            fs.createWriteStream(outFile).end(crxBuffer);
          }
          else {
            process.stdout.end(crxBuffer);
          }
        });
    });
}

module.exports = program;
