/* global require, __dirname, Buffer */
'use strict';

var fs = require("fs");
var test = require("tape");
var Zip = require("adm-zip");
var ChromeExtension = require("../");
var join = require("path").join;
var privateKey = fs.readFileSync(join(__dirname, "key.pem"));
var updateXml = fs.readFileSync(join(__dirname, "expectations", "update.xml"));

function newCrx(opts){
  return new ChromeExtension(Object.assign({
    privateKey: privateKey,
    path: '/tmp',
    codebase: "http://localhost:8000/myFirstExtension.crx",
    rootDirectory: join(__dirname, "myFirstExtension")
  }, opts));
}

const TESTS = {};

TESTS.ChromeExtension = function(t, opts){
  t.plan(2);

  t.throws(() => ChromeExtension({}));
  t.ok(newCrx(opts));
};


TESTS.load = function(t, opts){
  t.plan(4);

  newCrx(opts).load().then(t.pass);

  var fileList = [
    'test/myFirstExtension/manifest.json',
    'test/myFirstExtension/icon.png',
  ];

  newCrx(opts).load(fileList).then(function(crx){
    t.ok(crx);
  });

  var fileList = [
    'test/myFirstExtension/icon.png'
  ];

  newCrx(opts).load(fileList).catch(function(err){
    t.ok(err);
  });

  newCrx(opts).load(Buffer.from('')).catch(function(err){
    t.ok(err);
  })
};

TESTS.pack = function(t, opts){
  t.plan(1);

  var crx = newCrx(opts);
  crx.pack().then(function(packageData){
    t.ok(packageData instanceof Buffer);
  })
  .catch(t.error.bind(t));
};

TESTS.writeFile = function(t, opts){
  t.plan(1);

  var crx = newCrx(opts);

  t.throws(() => crx.writeFile('/tmp/crx'));
};

TESTS.loadContents = function(t, opts){
  t.plan(3);

  newCrx(opts).loadContents().catch(function(err){
    t.ok(err instanceof Error);
  });

  var crx = newCrx(opts);

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
};


TESTS.generateUpdateXML = function(t, opts){
  t.plan(2);

  t.throws(() => new ChromeExtension({}).generateUpdateXML(), 'No URL provided for update.xml');

  var crx = newCrx(opts);

  crx.pack().then(function(){
    var xmlBuffer = crx.generateUpdateXML();

    t.equals(xmlBuffer.toString(), updateXml.toString());
  })
  .catch(t.error.bind(t));
};

TESTS.generatePublicKey = function(t, opts) {
  t.plan(2);

  var crx = newCrx(opts);
  crx.privateKey = null;

  crx.generatePublicKey().catch(function(err){
    t.ok(err);
  });

  newCrx(opts).generatePublicKey().then(function(publicKey){
    t.equals(publicKey.length, 162);
  });
};

TESTS.generateAppId = function(t, opts) {
  t.plan(4);

  t.throws(function() { newCrx(opts).generateAppId(); }, /Public key is neither set, nor given/);

  var crx = newCrx(opts)

  // from Public Key
  crx.generatePublicKey().then(function(publicKey){
    t.equals(crx.generateAppId(publicKey), 'eoilidhiokfphdhpmhoaengdkehanjif');
  })
  .catch(t.error.bind(t));

  // from Linux Path
  t.equals(crx.generateAppId('/usr/local/extension'), 'ioglhmppkolgcgoonkfdbjkcedfjhbcd');

  // from Windows Path
  t.equals(crx.generateAppId('c:\\a'), 'igchicfaapedlfgmepccnpolhajaphik');
};

TESTS["end to end"] = function (t, opts) {
  var crx = newCrx(opts);

  crx.load()
    .then(function(crx) {
      return crx.pack();
    })
    .then(function(crxBuffer) {
      fs.writeFile('build.crx', crxBuffer, t.error);
      fs.writeFile('update.xml', crx.generateUpdateXML(), t.error);
    })
    .then(t.end);
};

// Setup list of different configurations to test
// Each key is the test name prefix.
// Each value is an options obect to be passed to test implementation.
const TEST_OPTIONS = {
  "": undefined, // use defaults
  v2: {version: 2},
  v3: {version: 3}
};

// Run whole list of tests for each of the configurations
Reflect.ownKeys(TEST_OPTIONS).forEach(key => {
  for (const name in TESTS) {
    test(`${key}: ${name}`, t => TESTS[name](t, TEST_OPTIONS[key]));
  }
});
