var fs = require("fs");
var test = require("tape");
var ChromeExtension = require("../");
var join = require("path").join;
var crx = new ChromeExtension({
  privateKey: fs.readFileSync(join(__dirname, "key.pem")),
  codebase: "http://localhost:8000/myFirstExtension.crx",
  rootDirectory: join(__dirname, "myFirstExtension")
});

test('it should pack the test extension', function(t){
  t.plan(3);

  crx.pack(function(err, data){
    if (err) {
      throw err;
    }

    t.ok(data instanceof Buffer);

    var updateXML = this.generateUpdateXML();

    t.ok(updateXML instanceof Buffer);

    fs.writeFile(join(__dirname, "update.xml"), updateXML);
    fs.writeFile(join(__dirname, "myFirstExtension.crx"), data);

    this.destroy().then(function(err) {
      t.equal(err, undefined);
    });
  });
});
