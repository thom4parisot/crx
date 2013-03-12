var fs = require("fs")
  , join = require("path").join
  , crypto = require("crypto")
  , child = require("child_process")
  , spawn = child.spawn
  , exec = child.exec

module.exports = new function() {
  function ChromeExtension(attrs) {
    if (this instanceof ChromeExtension) {
      for (var name in attrs) this[name] = attrs[name]

      this.path = join("/tmp", "crx-" + (Math.random() * 1e17).toString(36))
    }

    else return new ChromeExtension(attrs)
  }

  ChromeExtension.prototype = this

  this.destroy = function() {
    spawn("rm", ["-rf", this.path])
  }

  this.pack = function(cb) {
    if (!this.loaded) return this.load(function(err) {
      return err ? cb(err) : this.pack(cb)
    })

    this.generatePublicKey(function(err) {
      if (err) return cb(err)

      var manifest = JSON.stringify(this.manifest)

      this.writeFile("manifest.json", manifest, function(err) {
        if (err) return cb(err)
        
        this.loadContents(function(err) {
          if (err) return cb(err)

          this.generateSignature()
          this.generatePackage()

          cb.call(this, null, this.package)
        })
      })
    })
  }

  this.load = function(cb) {
    var child = spawn("cp", ["-R", this.rootDirectory, this.path])

    child.on("exit", function() {
      this.manifest = require(join(this.path, "manifest.json"))
      this.loaded = true

      cb.call(this)
    }.bind(this))
  }

  this.readFile = function(name, cb) {
    var path = join(this.path, name)

    fs.readFile(path, "binary", function(err, data) {
      if (err) return cb.call(this, err)

      cb.call(this, null, this[name] = data)
    }.bind(this))
  }

  this.writeFile = function(path, data, cb) {
    path = join(this.path, path)

    fs.writeFile(path, data, function(err, data) {
      if (err) return cb.call(this, err)

      cb.call(this)
    }.bind(this))
  }

  this.generatePublicKey = function(cb) {
    var rsa = spawn("openssl", ["rsa", "-pubout", "-outform", "DER"])

    rsa.stdout.on("data", function(data) {
      if(this.publicKey)
        return
      this.publicKey = data
      cb && cb.call(this, null, this)
    }.bind(this))
    rsa.stderr.on("data", function(err) {
      this.publicKey === undefined && cb && cb.call(this, "Failed to generate private key", null)
      this.publicKey = new Error("Failed to generate private key")
    }.bind(this))

    rsa.stdin.end(this.privateKey)
  }

  this.generateSignature = function() {
    return this.signature = new Buffer(
      crypto
        .createSign("sha1")
        .update(this.contents)
        .sign(this.privateKey),

      "binary"
    )
  }

  this.loadContents = function(cb) {
    var command = "zip -qr -9 -X - . -x key.pem"
      , options = {cwd: this.path, encoding: "binary", maxBuffer: this.maxBuffer}

    exec(command, options, function(err, data) {
      if (err) return cb.call(this, err)

      this.contents = new Buffer(data, "binary")

      cb.call(this)
    }.bind(this))
  }
  
  this.generatePackage = function() {
    var signature = this.signature
      , publicKey = this.publicKey
      , contents  = this.contents

      , keyLength = publicKey.length
      , sigLength = signature.length
      , zipLength = contents.length
      , length = 16 + keyLength + sigLength + zipLength

      , crx = new Buffer(length)

    crx.write("Cr24" + Array(13).join("\x00"), "binary")

    crx[4] = 2
    crx[8] = keyLength
    crx[12] = sigLength

    publicKey.copy(crx, 16)
    signature.copy(crx, 16 + keyLength)
    contents.copy(crx, 16 + keyLength + sigLength)

    return this.package = crx
  }

  this.generateAppId = function() {
    return this.appId = crypto
      .createHash("sha256")
      .update(this.publicKey)
      .digest("hex")
      .slice(0, 32)
      .replace(/./g, function(x) {
        return (parseInt(x, 16) + 10).toString(26)
      })
  }

  this.generateUpdateXML = function() {
    if (!this.codebase) throw new Error("No URL provided for update.xml.")

    return this.updateXML =
      Buffer(
        "<?xml version='1.0' encoding='UTF-8'?>\n" +
        "<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>\n" +
        "  <app appid='" + this.generateAppId() + "'>\n" +
        "    <updatecheck codebase='" + this.codebase + "' version='" + this.manifest.version + "' />\n" +
        "  </app>\n" +
        "</gupdate>"
      )
  }

  return ChromeExtension
}