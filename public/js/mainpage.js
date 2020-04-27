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

var db2;
function openDb() {
  console.log("openDb ...");
  var req = indexedDB.open("RowingStore", 1);
  req.onsuccess = function (evt) {
    // Equal to: db = req.result;
    db2 = this.result;
    console.log("openDb DONE");
  };
  req.onerror = function (evt) {
    console.error("openDb:", evt.target.errorCode);
  };

  // req.onupgradeneeded = function (evt) {
  //   console.log("openDb.onupgradeneeded");
  //   var store = evt.currentTarget.result.createObjectStore(
  //     DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
  //
  //   store.createIndex('biblioid', 'biblioid', { unique: true });
  //   store.createIndex('title', 'title', { unique: false });
  //   store.createIndex('year', 'year', { unique: false });
  // };
}

openDb();

function getObjectStore(store_name, mode) {
  var tx = db2.transaction(store_name, mode);
  return tx.objectStore(store_name);
}


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
  var person = document.getElementById('person').value;
  var descr = document.getElementById('description').value;
  // var d = new Date().getTime(); // May use this later?
  // TODO: refactor this to use the already-loaded db2
  // TODO: draw another row of the table if it's already loaded
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
    objectStore.add({person: person,
                     date: new Date(),
                     totaldistance: totaldistance,
                     description: descr,
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
  var store = getObjectStore("rowsessions", 'readonly');

  var session_msg = document.getElementById('session-msg');
  session_msg.innerHTML = "";
  var session_list = document.getElementById('session-list');
  session_list.innerHTML = "";
  var session_table = document.getElementById('session-table');
  session_table.innerHTML = "";
  var heading_row = session_table.insertRow();
  heading_row.insertCell().outerHTML = "<th>Key</th>";
  heading_row.insertCell().outerHTML = "<th>Person</th>";
  heading_row.insertCell().outerHTML = "<th>Distance (m)</th>";
  heading_row.insertCell().outerHTML = "<th>Date/Time</th>";
  heading_row.insertCell().outerHTML = "<th>Description</th>";

  var req;
  req = store.count();
  req.onsuccess = function(evt) {
    session_msg.innerHTML = '<p>There are <strong>' + evt.target.result +
      '</strong> saved sessions. Press the button in the Key column to load.</p>';
  };
  req.onerror = function(evt) {
    console.error("add error", this.error);
  };

  var i = 0;
  req = store.openCursor();
  req.onsuccess = function(evt) {
    var cursor = evt.target.result;

    // If the cursor is pointing at something, ask for the data
    if (cursor) {
      req = store.get(cursor.key);
      req.onsuccess = function(evt) {
        var value = evt.target.result;
        var row = session_table.insertRow();
        var keybtn = document.createElement("BUTTON");
        keybtn.innerHTML = cursor.key.toString();
        keybtn.onclick = function(){loadSessionFromKey()};
        var key = row.insertCell().appendChild(keybtn);
        row.insertCell().appendChild(document.createTextNode(value.person));
        row.insertCell().appendChild(document.createTextNode(value.totaldistance));
        row.insertCell().appendChild(document.createTextNode(value.date.toLocaleString()));
        row.insertCell().appendChild(document.createTextNode(value.description));
      };
      cursor.continue();
      // This counter serves only to create distinct ids
      i++;
    }
  };
};
// Load a previous session with the id given in the form input box
// const sessionbtn = document.getElementById('sessionbtn');
// sessionbtn.onclick = function(){loadSession(parseInt(document.getElementById('sessionid').value))};

function loadSessionFromKey(){
  let key = parseInt(window.event.target.innerHTML);
  loadSession(key);
}

function loadSession(id) {
  var sessionid = id;
  console.log('Loading session:', sessionid);

  var reqdb = window.indexedDB.open("RowingStore", 1);
  reqdb.onerror = function(event) {
    console.log("Error opening IndexedDB.");
  };
  reqdb.onsuccess = function(event) {
    var db = event.target.result;
    var tx = db.transaction(["rowsessions"], "readonly").objectStore("rowsessions").get(sessionid);
    tx.onerror = function(event) {
      console.err("Save transaction error: " + event.target.errorCode);
    };
    tx.onsuccess = function(event) {
      // set all the global arrays
      distances = event.target.result.distance_arr;
      strokes = event.target.result.strokerate_arr;
      split500s = event.target.result.split500_arr;
      speeds = event.target.result.speed_arr;
      timestamps = event.target.result.time_arr;
      // update subplots
      var update = {
        x: [timestamps, timestamps, timestamps],
        y: [distances, strokes, split500s]
      }
      Plotly.update('graph', update, {}, [0, 1, 2])
    };
  };
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
  plot_bgcolor: "#c5d4e2",
  paper_bgcolor: "#c5d4e2",
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
