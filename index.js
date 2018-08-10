
var express = require('express');
var app = express();

// first parameter is the mount point, second is the location in the file system
app.use("/public", express.static(__dirname + "/public"));

app.get('/', function(req, res) {
    res.redirect('./public/gmail_firebase.html');
});

app.listen(process.env.PORT || 3000);
