var fs = require("fs")
  , assert = require("assert")
  , ChromeExtension = require("../")
  , crx = new ChromeExtension({
      privateKey: fs.readFileSync(__dirname + "/key.pem"),
      codebase: "http://localhost:8000/myFirstExtension.crx",
      rootDirectory: __dirname + "/myFirstExtension"
    })

crx.pack(function(err, data){
  if (err) throw err

  var updateXML = this.generateUpdateXML()

  fs.writeFile(__dirname + "/update.xml", updateXML)
  fs.writeFile(__dirname + "/myFirstExtension.crx", data)

  this.destroy()
})