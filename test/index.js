var fs = require("fs")
  , assert = require("assert")
  , ChromeExtension = require("../")
  , crx = new ChromeExtension
  , updateUrl = "http://localhost/update.xml"

crx.privateKey = fs.readFileSync(__dirname + "/key.pem")

crx.load(__dirname + "/myFirstExtension", function(err) {
  if (err) throw err

  this.pack(function(err, data){
    if (err) throw err

    var updateXML = this.generateUpdateXML(updateUrl)

    fs.writeFile(__dirname + "/update.xml", updateXML)
    fs.writeFile(__dirname + "/myFirstExtension.crx", data)
  
    this.destroy()
  })
})