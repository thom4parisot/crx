/* global require, __dirname, Buffer */
'use strict';

var fs = require("fs");
var test = require("tape");
var Zip = require("adm-zip");
var ChromeExtension = require("../");
var join = require("path").join;
var privateKey = fs.readFileSync(join(__dirname, "key.pem"));
var updateXml = fs.readFileSync(join(__dirname, "expectations", "update.xml"));

function newCrx(){
  return new ChromeExtension({
    privateKey: privateKey,
    codebase: "http://localhost:8000/myFirstExtension.crx",
    rootDirectory: join(__dirname, "myFirstExtension")
  });
}

test('#ChromeExtension', function(t){
  t.plan(2);

  t.ok(ChromeExtension({}) instanceof ChromeExtension);
  t.ok(newCrx());
});


test('#load', function(t){
  t.plan(1);

  newCrx().loadContents().catch(function(err){
    t.ok(err instanceof Error);
  });
});

test('#pack', function(t){
  t.plan(1);

  var crx = newCrx();

  crx.pack().then(function(packageData){
    t.ok(packageData instanceof Buffer);
  })
  .catch(t.error.bind(t));
});

test('#loadContents', function(t){
  t.plan(2);

  var crx = newCrx();

  crx.load().then(function(){
    return crx.loadContents();
  })
  .then(function(contentsBuffer){
    t.ok(contentsBuffer instanceof Buffer);

    return contentsBuffer;
  })
  .then(function(packageData){
    var entries = new Zip(packageData)
      .getEntries()
      .map(function(entry){
        return entry.entryName;
      })
      .sort(function(a, b){
        return a.localeCompare(b);
      });

    t.deepEqual(entries, ['icon.png', 'manifest.json']);

    return packageData;
  })
  .catch(t.error.bind(t));
});


test('#generateUpdateXML', function(t){
  t.plan(2);

  t.throws(function(){ ChromeExtension({}).generateUpdateXML() }, 'No URL provided for update.xml');

  var crx = newCrx();

  crx.pack().then(function(){
    var xmlBuffer = crx.generateUpdateXML();

    t.equals(xmlBuffer.toString(), updateXml.toString());
  })
  .catch(t.error.bind(t));
});

test('#generateAppId', function(t) {
  t.plan(2);

  t.throws(function() { newCrx().generateAppId(); }, /Public key is neither set, nor given/);

  var crx = newCrx()

  crx.generatePublicKey().then(function(publicKey){
    t.equals(crx.generateAppId(publicKey), 'eoilidhiokfphdhpmhoaengdkehanjif');
  })
  .catch(t.error.bind(t));
});
