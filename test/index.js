var fs = require("fs")
  , assert = require("assert")
  , ChromeExtension = require("../")
  , join = require("path").join
  , crx = new ChromeExtension({
      privateKey: fs.readFileSync(join(__dirname, "key.pem")),
      codebase: "http://localhost:8000/myFirstExtension.crx",
      rootDirectory: join(__dirname, "myFirstExtension")
    })

crx.pack(function(err, data){
  if (err) throw err

  var updateXML = this.generateUpdateXML()

  fs.writeFile(join(__dirname, "update.xml"), updateXML)
  fs.writeFile(join(__dirname, "myFirstExtension.crx"), data)

  this.destroy()
})