const waterrower = require("./Waterrower");
const http = require('http');
const url = require('url');
const fs = require('fs');
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
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
