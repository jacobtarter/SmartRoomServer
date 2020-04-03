const rfOutletService = require('./rfoutlets');
var _ = require('lodash');

var io;
var count = 0;
var clients = {};
var weatherData = [];

module.exports.initializeWebsocket = function(server) {
	console.log('Initializing Websocket Server...');
	io = require('socket.io')(server);
	//rfOutletService.initializeRF(io);

	// Code to run on WebSocket connection
	io.on('connection', client => {
		//console.log('* Websocket Client Connected: ' + client.id + '*');

		io.emit('MESSAGE', 'hello there, little client.');
		module.exports.sendWeatherData();

		client.on('GET_RF_CODE', function(msg) {
			if (msg.message) {
				console.log('activating code reader...');
			} else {
				console.log('de-activating code reader...');
			}
			rfOutletService.sendRfCodes(msg.message);
		});

		client.on('SEND_MESSAGE', function(data) {
			io.emit('MESSAGE', data);
		});
	});
};

module.exports.updateWeatherData = function(newData) {
	//console.log('*');
	//console.log('*** New Data From Darksky API. ***');
	//console.log('*');
	//console.log(newData);
	if (!_.isEqual(this.weatherData, newData)) {
		this.weatherData = newData;
		module.exports.sendWeatherData();
	} else {
		console.log('*** No Changes in Darksky Data. ***');
		console.log('*');
	}
};

module.exports.sendWeatherData = function() {
	//console.log('*');
	//console.log('*** Sending WS With Newest Weather Data... ***');
	//console.log('*');
	//console.log(this.weatherData);
	io.emit('DATA_WEATHER', this.weatherData);
};

module.exports.sendLightStates = function(devices, type) {
	if (type) {
		prefix = 'DEVICE_STATES_' + type;
	} else {
		prefix = 'DEVICE_STATES';
	}
	io.emit(prefix, devices);
};
