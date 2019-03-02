'use strict';

var test = require("tape");
var fs = require("fs");
var join = require("path").join;

var crypto = require("../crypto");
var privateKey = fs.readFileSync(join(__dirname, "key.pem"));
var expectedPublicKeyPEM = fs.readFileSync(join(__dirname, "expectations", "public-key.pem"));
var expectedPublicKeyDER = fs.readFileSync(join(__dirname, "expectations", "public-key.der"));

test('#generateAppId', function(t) {
  t.plan(2);

  t.throws(
    function() { crypto.generateAppId(); },
    /Public key is neither set, nor given/
  );

  // from Public Key
  crypto.generatePublicKey(privateKey)
    .then(function(publicKey) {
      t.equals(
        crypto.generateAppId(publicKey),
        'eoilidhiokfphdhpmhoaengdkehanjif'
      );
    })
    .catch(t.error.bind(t));
});

test('#generateAppIdFromPath', function(t){
  t.plan(2);

  // from Linux Path
  t.equals(
    crypto.generateAppIdFromPath('/usr/local/extension'), 'ioglhmppkolgcgoonkfdbjkcedfjhbcd'
  );

  // from Windows Path
  t.equals(
    crypto.generateAppIdFromPath('c:\\a'),
    'igchicfaapedlfgmepccnpolhajaphik'
  );
});

test('#generatePublicKey', function(t){
  t.plan(3);

  // wrong format
  crypto.generatePublicKey(privateKey, 'INVALID FORMAT')
    .catch(t.ok.bind(t))

  // DER
  crypto.generatePublicKey(privateKey)
    .then(function(publicKey){
      t.ok(publicKey.equals(expectedPublicKeyDER), 'DER');
    });

  // PEM
  crypto.generatePublicKey(privateKey, 'pem')
    .then(function(publicKey){
      t.equals(publicKey, expectedPublicKeyPEM.toString(), 'PEM');
    });
});

test('#generatePrivateKey', function(t){
  t.plan(2);
  
  crypto.generatePrivateKey()
    .then(function(privateKey){
      t.ok(privateKey.match('-----BEGIN RSA PRIVATE KEY-----'));
      t.ok(privateKey.match('-----END RSA PRIVATE KEY-----'));
    });
});

test('#sign', function(t){
  t.end();
});
