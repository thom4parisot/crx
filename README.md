crxmake
=======

crxmake is a [node.js](http://nodejs.org/) module for packing and serving Google Chrome extensions.

## Requirements

* [node.js](http://nodejs.org/), tested with 0.4.12
* openssl
* zip

## Install

    $ npm install crxmake

## API

### Constructor
    
#### crx = new ChromeExtension(options, [callback])

Returns a `ChromeExtension` instance. If an optional callback is provided, the `load` method is called.

### Methods

#### crx.load([callback])

Loads data for the instance. If the instance has a `package` key, the `loadFromPackage` method is called. If the instance has a `sourcePath` key, `loadFromSourcePath` is called.

#### crx.loadFromPackage([callback])

Populates the instance based on the contents of the `package` buffer.

#### crx.loadFromSourcePath([callback])

Populates the instance based on the directory at `sourcePath` and the `privateKey` buffer.

#### crx.generateAppId()

Uses a hash of the public key to generate the app ID used to uniquely identify the extension, and caches it in the `appID` property.

#### crx.generateUpdateXml()

Calculates the app ID and pulls the version and update URL from the manifest, and returns an XML file that can be served to enable autoupdates, as described [here](http://code.google.com/chrome/extensions/autoupdate.html#H2-2).

### Properties

#### crx.package

A buffer containing the source of the extension, which can be served as the `.crx` file.

#### crx.publicKey

The public key for the extension, which is generated from `privateKey` when the extension is built.

#### crx.privateKey

The private key for the extension. This is used to generate the public key and sign the package.

#### crx.version

The version of the extension. This is currently fixed at `2`.

#### crx.signature

A cryptographic signature used to verify that the private key was used to sign the package.

#### crx.contents

A zip file representing the extension's source tree.

#### crx.manifest

An object parsed from the extensions `manifest.json` file.

## Example

```javascript
// from ./test/test.js

var fs = require("fs")
  , assert = require("assert")
  , join = require("path").join
  , http = require("http")

  , ChromeExtension = require("../")

  , extPath = join(__dirname, "myFirstExtension")
  , crxPath = extPath + ".crx"
  , key = fs.readFileSync(extPath + ".pem")

// create an extension with the existing key
new ChromeExtension({sourcePath: extPath, privateKey: key}, function(err, fromPath){
  // make sure no error occurred and that something was returned
  assert.ok(!err)
  assert.ok(!!fromPath)

  // make sure that the sizes and names are the same
  assert.equal(fromPath.publicKey.length, 162)
  assert.equal(fromPath.signature.length, 128)
  assert.equal(fromPath.manifest.name, "My First Extension")

  // use the created extension to create a new instance
  new ChromeExtension({package: fromPath.package}, function(err, fromPackage) {
    // make sure no error occurred and that something was returned
    assert.ok(!err)
    assert.ok(!!fromPackage)

    // make sure that the public keys are the same
    assert.equal(
      fromPath.publicKey.toString(),
      fromPackage.publicKey.toString()
    )

    // make sure that the signatures are the same
    assert.equal(
      fromPath.signature.toString(),
      fromPackage.signature.toString()
    )

    // make sure that the contents are the same
    assert.equal(
      fromPath.contents.length,
      fromPackage.contents.length
    )

    // write the extension to disk for further testing
    fs.writeFile(crxPath, fromPath.package, function() {
      console.log("Open the following extension for further testing:\n%s", crxPath)
    })
  })
})
```

## TODO

* Find out how to generate packages without keys and obtain a `.pem` file

Copyright
---------

Copyright (c) 2011 Jed Schmidt. See LICENSE.txt for details.

Send any questions or comments [here](http://twitter.com/jedschmidt).