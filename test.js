var mongodb = require("mongodb");

var server = new mongodb.Server('192.168.0.215',27017,{auto_reconnect:true});
var db = new mongodb.Db("microblog",server,{safe:false});
db.open(function(err,db){
  if(!err){
    console.log("We are connected");
  }else{
    console.log(err);
  }
});
