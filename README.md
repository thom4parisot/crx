crx
===

crx is a [node.js](http://nodejs.org/) command line app for packing Google Chrome extensions.

## Requirements

* [node.js](http://nodejs.org/), tested with 0.4.12
* openssl
* ssh-keygen
* zip

## Install

    $ npm install crx

## API

### crx pack [directory] [-f file] [-p private-key]

Pack the specified directory into a .crx package, and output it to stdout. If no directory is specified, the current working directory is used.

Use the `-f` option to output to a file instead of stdout; if no file is specified, the package is given the same name as the directory basename.

Use the `-p` option to specify an external private key. If this is not used, `key.pem` is used from within the directory. If this option is not used and no `key.pem` file exists, one will be generated automatically.

### crx keygen [directory]

Generate a 1,024-bit RSA private key within the directory. This is called automatically if a key is not specified, and `key.pem` does not exist.

## Examples

Given the following directory structure:

    └─┬ myFirstExtension
      ├── manifest.json
      └── icon.png

run this:

    cd myFirstExtension
    crx pack -f

to generate this:

    ├─┬ myFirstExtension
    │ ├── manifest.json
    │ ├── icon.png
    │ └── key.pem
    └── myFirstExtension.crx

You can also name the output file like this:

    cd myFirstExtension
    crx pack -f myFirstExtension.crx

to get the same results, or also pipe to the file manually like this.

    cd myFirstExtension
    crx pack > ../myFirstExtension.crx

As you can see a key is generated for you at `key.pem` if none exists. You can also specify an external key. So if you have this:

    ├─┬ myFirstExtension
    │ ├── manifest.json
    │ └── icon.png
    └── myPrivateKey.pem

you can run this:

    crx pack myFirstExtension -p myPrivateKey.pem -f

to sign your package without keeping the key in the directory.

Copyright
---------

Copyright (c) 2011 Jed Schmidt. See LICENSE.txt for details.

Send any questions or comments [here](http://twitter.com/jedschmidt).