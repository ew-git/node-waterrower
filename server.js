var waterrower = require("./Waterrower");
var http = require('http');
var url = require('url');
var fs = require('fs');
var express = require('express');
var path = require('path');
var app = express();

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/data', function (req, res) {
  var results = {"distance": Number(waterrower.readTotalDistance()),
		 "stroke": Number(waterrower.readStrokeRate()),
     "speed": Number(waterrower.readAverageSpeed())/100};//convert to m/s
  if (results.speed < 1){//slower than 1 m/s, or roughly 8 minute 500m split
    results.split500 = 0;
  } else {
    results.split500 = 500/results.speed;//split in seconds
  }
  res.send(results);
})
app.listen(3000, () => console.log('Express app listening on port 3000!'))
console.log('Server running at http://127.0.0.1:3000/');
