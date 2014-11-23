var fs = require("fs");
var assert = require("assert");
var ChromeExtension = require("../");
var join = require("path").join;
var crx = new ChromeExtension({
  privateKey: fs.readFileSync(join(__dirname, "key.pem")),
  codebase: "http://localhost:8000/myFirstExtension.crx",
  rootDirectory: join(__dirname, "myFirstExtension")
});

crx.pack(function(err, data){
  if (err) {
    throw err;
  }

  var updateXML = this.generateUpdateXML();

  fs.writeFile(join(__dirname, "update.xml"), updateXML);
  fs.writeFile(join(__dirname, "myFirstExtension.crx"), data);

  this.destroy();
});