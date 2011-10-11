#!/usr/bin/env node

var path = require("path")
  , fs = require("fs")
  , child = require("child_process")

  , program = require("commander")
  , ChromeExtension = require("..")

  , resolve = path.resolve
  , join = path.join
  , spawn = child.spawn
  , exec = child.exec

  , cwd = process.cwd()

program
  .version("0.2.0")
  .option("-f, --file [file]", "input/output <file> instead of stdin/stdout")
  .option("-p, --private-key <file>", "relative path to private key [key.pem]")
  // coming soon
  // .option("-x, --xml", "output autoupdate xml instead of extension ")

program
  .command("keygen [directory]")
  .description("generate a private key in [directory]/key.pem")
  .action(keygen)

program
  .command("pack [directory]")
  .description("pack [directory] into a .crx extension")
  .action(pack)

// program
//   .command("unpack [directory]")
//   .description("unpack a .crx extension into a directory")
//   .action(unpack)

program.parse(process.argv)

function keygen(dir, cb) {
  dir = resolve(cwd, dir)

  var key = join(dir, "key.pem")

  path.exists(key, function(exists) {
    if (exists) return cb && cb()

    var pubPath = key + ".pub"
      , command = "ssh-keygen -N '' -b 1024 -t rsa -f key.pem"

    exec(command, {cwd: dir}, function(err) {
      if (err) throw err

      // TODO: find a way to prevent .pub output
      fs.unlink(pubPath)
      cb && cb()
    })
  })
}

function pack(dir) {
  var input = resolve(cwd, dir)
    , output = 
      program.file === true ? input + ".crx" :
      program.file ? resolve(cwd, program.file) : false

    , stream = output ? fs.createWriteStream(output) : process.stdout
    , key = program.privateKey 
        ? resolve(cwd, program.privateKey)
        : join(input, "key.pem")

    , crx = new ChromeExtension

  fs.readFile(key, function(err, data) {
    if (err) keygen(dir, pack.bind(null, dir))

    crx.privateKey = data

    crx.load(input, function(err) {
      if (err) throw err

      this.pack(function(err, data){
        if (err) throw err

        stream.end(data)
        this.destroy()
      })
    })
  })
}