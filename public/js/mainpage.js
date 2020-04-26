(function(){
document.getElementById("splitheading").style.fontSize = "600%";

var distances = [];
var strokes = [];
var split500s = [];
var speeds = [];
var timestamps = [];

function getData() {
  // Get data from the express server and append to the "global"
  // arrays distances, strokes, etc.
  fetch("/data").then(function(response) {
    return response.json();
  }).then(function(data) {
    distances.push(Number(data["distance"]));
    strokes.push(Number(data["stroke"]));
    split500s.push(Number(data["split500"]));
    speeds.push(Number(data["speed"]));
    var time = new Date();
    timestamps.push(time);
    var update = {
      x: [
        [time],
        [time],
        [time]
      ],
      y: [
        [data["distance"]],
        [data["stroke"]],
        [data["split500"]]
      ]
    }
    Plotly.extendTraces('graph', update, [0, 1, 2])
    // Also, update big number split time
    var splitseconds = Math.round(Number(data["split500"]), 0);
    document.getElementById("splitheading").innerHTML =
      Math.floor(splitseconds / 60).toString() + "m " +
      (splitseconds % 60).toString() + "s";
  });
};

// Set up indexedDB to store sessions
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB."+
    " You will not be able to save or load sessions.");
} else {
  var db;
  var reqdb = window.indexedDB.open("RowingStore", 1);
  reqdb.onerror = function(event) {
    console.log("Error opening IndexedDB.");
  };
  reqdb.onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore("rowsessions", { keyPath: "id",
    autoIncrement: true});
    // Name of the person doing the rowing
    objectStore.createIndex("person", "person", { unique: false });
    objectStore.createIndex("date", "date", { unique: false });
  };
};

// Save session button
const savebtn = document.getElementById('savebtn');
savebtn.onclick = saveCurrent;

function saveCurrent() {
  // var d = new Date().getTime(); // May use this later?
  var reqdb = window.indexedDB.open("RowingStore", 1);
  reqdb.onerror = function(event) {
    console.log("Error opening IndexedDB.");
  };
  reqdb.onsuccess = function(event) {
    db = event.target.result;
    var tx = db.transaction(["rowsessions"], "readwrite");
    tx.oncomplete = function(event) {
      console.log("Save transaction complete.");
    };
    tx.onerror = function(event) {
      console.err("Save transaction error: " + event.target.errorCode);
    };
    var objectStore = tx.objectStore("rowsessions");
    let totaldistance = (distances.length > 0 ? distances.slice(-1)[0] : 0);
    objectStore.add({person: "Bob",
                     date: new Date(),
                     totaldistance: totaldistance,
                     description: "Test session description",
                     time_arr: timestamps,
                     distance_arr: distances,
                     strokerate_arr: strokes,
                     split500_arr: split500s,
                     speed_arr: speeds
                   });
  };
};

// List previous sessions button
const listbtn = document.getElementById('listbtn');
listbtn.onclick = listCurrent;

function listCurrent() {
  var oldStore = localStorage.getItem('rowingStore');
  if (oldStore === null) {
    document.getElementById('listofsessions').innerHTML('No stored sessions.');
  } else {
    var oldStoreParsed = JSON.parse(oldStore);
    document.getElementById('listofsessions').innerHTML = '';

    function getids(item, index) {
      var date = new Date(Number(item.id));
      document.getElementById('listofsessions').innerHTML += item.id + ", ";
      document.getElementById('listofsessions').innerHTML += date.toString() + ", ";
      document.getElementById('listofsessions').innerHTML +=
        item.data.distance[item.data.distance.length - 1] + ' meters';
      document.getElementById('listofsessions').innerHTML += "<br/>";
    }
    oldStoreParsed.forEach(getids);
  }
};

// Load a previous session with the id given in the form input box
const sessionbtn = document.getElementById('sessionbtn');
sessionbtn.onclick = loadSession;

function loadSession() {
  var sessionid = document.getElementById('sessionid').value;
  console.log('Loading session: ', sessionid);
  var oldStore = localStorage.getItem('rowingStore');
  if (oldStore === null) {
    console.log('No stored sessions.');
  } else {
    var oldStoreParsed = JSON.parse(oldStore);
    var i;
    var found = false;
    for (i = 0; i < oldStoreParsed.length; i++) {
      if (oldStoreParsed[i].id.toString() == sessionid) {
        found = true;
        //set all the global arrays
        distances = oldStoreParsed[i].data.distance;
        strokes = oldStoreParsed[i].data.strokerate;
        split500s = oldStoreParsed[i].data.split500;
        speeds = oldStoreParsed[i].data.speed;
        timestamps = oldStoreParsed[i].data.time; //actually strings
        function stringtotime(item, index, arr) {
          arr[index] = new Date(Date.parse(item));
        }
        timestamps.forEach(stringtotime);
        //update subplots
        var update = {
          x: [
            timestamps,
            timestamps,
            timestamps
          ],
          y: [
            distances,
            strokes,
            split500s
          ]
        }
        Plotly.update('graph', update, {}, [0, 1, 2])
      };
    }
    if (!found) {
      console.log('Session id not found.');
    }
  }
};

// Start button that begins "tracking", i.e. append to global arrays and plots
const startbtn = document.getElementById('startbtn');
startbtn.onclick = tracking;
startbtn.style.backgroundColor = '#1ae028';

var tracked = false;

function tracking() {
  if (!tracked) {
    tracked = window.setInterval(getData, 300);
    startbtn.innerHTML = "STOP tracking";
    startbtn.style.backgroundColor = '#fc1134';
  } else {
    window.clearInterval(tracked);
    tracked = null;
    startbtn.innerHTML = "START tracking";
    startbtn.style.backgroundColor = '#1ae028';
  }
};

//https://plot.ly/javascript/streaming/#streaming-subplots
var trace_distance = {
  name: 'Distance (m)',
  x: [],
  y: [],
  mode: 'lines',
  line: {
    color: '#80CAF6',
    shape: 'lines'
  }
};

var trace_strokerate = {
  name: 'Stroke Rate (spm)',
  x: [],
  y: [],
  xaxis: 'x3',
  yaxis: 'y2',
  mode: 'lines',
  line: {
    color: '#DF56F1'
  }
};

var trace_500msplit = {
  name: '500m Split (s)',
  x: [],
  y: [],
  xaxis: 'x3',
  yaxis: 'y3',
  mode: 'lines',
  line: {
    color: '#E5A51B'
  }
};

var layout = {
  autosize: false,
  width: 1000,
  height: 800,
  xaxis: {
    type: 'date',
    domain: [0, 1],
    showticklabels: false
  },
  yaxis: {
    domain: [0.8, 1]
  },
  xaxis2: {
    type: 'date',
    anchor: 'y2',
    domain: [0, 1],
    title: {
      text: 'Time'
    },
  },
  yaxis2: {
    anchor: 'x2',
    domain: [0.4, 0.75]
  },
  xaxis3: {
    type: 'date',
    anchor: 'y3',
    domain: [0, 1],
    title: {
      text: 'Time'
    },
  },
  yaxis3: {
    anchor: 'x3',
    domain: [0, 0.35]
  },
};

var data = [trace_distance, trace_strokerate, trace_500msplit];

Plotly.plot('graph', data, layout);
})();
