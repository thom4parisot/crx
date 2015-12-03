/* global require, __dirname, Buffer */
'use strict';

var fs = require("fs");
var test = require("tape");
var ChromeExtension = require("../");
var join = require("path").join;
var privateKey = fs.readFileSync(join(__dirname, "key.pem"));
var sinon = require('sinon');
var sandbox = sinon.sandbox.create();
var AdmZip = require('adm-zip');

function newCrx(){
  return new ChromeExtension({
    privateKey: privateKey,
    codebase: "http://localhost:8000/myFirstExtension.crx",
    rootDirectory: join(__dirname, "myFirstExtension")
  });
}

test('it should pack the test extension', function(t){
  t.plan(3);

  var crx = newCrx();

  crx.pack().then(function(packageData){
    t.ok(packageData instanceof Buffer);

    var updateXML = crx.generateUpdateXML();

    t.ok(updateXML instanceof Buffer);

    fs.writeFile(join(__dirname, "update.xml"), updateXML);
    fs.writeFile(join(__dirname, "myFirstExtension.crx"), packageData);
  })
  .then(t.pass.bind(t))
  .catch(t.error.bind(t));
});

test('it should pack from preloaded contents', function(t){
  t.plan(3);

  var crx = newCrx();
  var loadContentsSpy = sandbox.spy(crx, 'loadContents');

  crx.load().then(function(){
      return crx.loadContents();
    })
    .then(function(contentsBuffer){
      t.ok(contentsBuffer instanceof Buffer);

      return crx.pack(contentsBuffer);
    })
    .then(function(packageData){
      t.ok(loadContentsSpy.callCount === 1);
      t.ok(packageData instanceof Buffer);
    })
    .then(sandbox.restore.bind(sandbox))
    .catch(t.error.bind(t));
});

test('it should fail if the extension content is loaded without having preliminary called the `load` method', function(t){
  t.plan(1);

  newCrx().loadContents().catch(function(err){
    t.ok(err instanceof Error);
  });
});

test('it should fail if the public key was not set prior to trying to generate the app ID', function(t) {
  t.plan(1);
  var crx = newCrx();
  t.throws(function() { crx.generateAppId(); }, /Public key is neither set, nor given/);
});

test('it should not archive paths listed in .crxignore', function(t) {
  var crx = newCrx();
  var testIgnore = ["ignore.js", "ignore-dir/file.js"];

  t.plan(testIgnore.length);

  crx.load().then(function(){
    return crx.loadContents();
  })
  .then(function(zipBuffer){
    var zipOutputPath = join(__dirname, "output.zip");

    fs.writeFile(zipOutputPath, zipBuffer, function(){
      var zip = new AdmZip(zipOutputPath);
      testIgnore.forEach(function(file){ t.ok(zip.getEntry(file) === null); });
    });
  });
});
