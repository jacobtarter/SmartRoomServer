const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
//const passport = require('passport');
const mongoose = require('mongoose');

// Require models.js file, where we will require all defined models
const myModels = require('./models/models');
const config = require('./config/database');

//const darkskyService = require('./services/darksky');
const alexaService = require('./services/alexa');
const websocketService = require('./services/websockets');
const darkskyService = require('./services/darksky');
var schedule = require('node-schedule');
var deviceService = require('./services/switchedDeviceService');

// Connect to database
// Database currently unused
mongoose.connect(config.database);
mongoose.connection.on('connected', () => {
	console.log('mongodb connected ' + config.database);
});
mongoose.connection.on('error', err => {
	console.log('mongodb error: ' + err);
});

// Initialize app with express
const app = express();
// Declare external route files
const devices = require('./routes/api/switchedDevice');
const rooms = require('./routes/api/room');
const categories = require('./routes/api/category');
const scenes = require('./routes/api/scene');
// Declare port number
const port = 80;
// Instantiate Server
const server = require('http').Server(app);

//allows requests from other domains
app.use(cors());

//Set up static routing
app.use(express.static(path.join(__dirname, 'public')));

//parses incoming requests
app.use(bodyParser.json());

//Utilize route files
app.use('/api/devices/scenes', scenes);
app.use('/api/devices/rooms', rooms);
app.use('/api/devices/categories', categories);
app.use('/api/devices', devices);

//Make sure all "GET" requests go to the client folder, so React can handle the routing
app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

//Start server
server.listen(port, () => {
	console.log('server started on port ' + port);
});

// Initialize Websocket Server
websocketService.initializeWebsocket(server);

// Send Out Initial Darksky Data Set
darkskyService.updateDarkSky();

// Build Device Cache
deviceService.buildDeviceCache();

// Initialize Alexa
alexaService.initializeAlexa();

//var sceneQuery = Scene.find({});
//sceneQuery.exec(function (err, scenes) {
//    if (err) return console.log(err);
//    scenes.forEach(function (scene) {
//        scene.activate();
//    });
//});
