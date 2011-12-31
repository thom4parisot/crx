var fs = require("fs")
  , assert = require("assert")
  , ChromeExtension = require("../")
  , crx = new ChromeExtension({
      privateKey: fs.readFileSync(__dirname + "/key.pem"),
      codebase: "http://localhost:8000/myFirstExtension.crx"
    })

crx.load(__dirname + "/myFirstExtension", function(err) {
  if (err) throw err

  this.pack(function(err, data){
    if (err) throw err

    var updateXML = this.generateUpdateXML()

    fs.writeFile(__dirname + "/update.xml", updateXML)
    fs.writeFile(__dirname + "/myFirstExtension.crx", data)
  
    this.destroy()
  })
})