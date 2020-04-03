const axios = require('axios');
const config = require('../config/milightlevels');
const transitionTime = 0.2;

//Function to send the signal to the MiLight API, Running On ESP Board
module.exports.milightSendMessage = function(
	deviceId,
	group,
	type,
	msg,
	url = null
) {
	//myMessage = JSON.stringify(msg);
	/* console.log(
		'MSG: ' +
			JSON.stringify(msg) +
			' * ' +
			deviceId +
			' * ' +
			group +
			' * ' +
			type +
			' * ' +
			url
	); */

	// var baseUrl = url ? url : 'http://192.168.1.92/gateways/';
	var baseUrl = 'http://192.168.1.93/gateways/';
	//console.log('baseURL: ' + baseUrl);
	var path = baseUrl + deviceId + '/' + type + '/' + group;
	//console.log('path: ' + path);
	if (!msg.transition) msg.transition = transitionTime;
	//console.log('sending msg obj: ' + JSON.stringify(msg));

	axios
		.put(path, msg)
		.then(function(response) {
			//console.log(
			//	'Status: ' +
			//		response.status +
			//		' ** StatusText: ' +
			//		response.statusText
			//);
			setTimeout(function() {
				//console.log('transition done');
			}, 2000);
			if (response.status == 200) {
				return true;
			}
			return false;
		})
		.catch(function(error) {
			return error;
		});
};

module.exports.milightPairDevice = function(deviceId, group, type, url) {
	console.log('pairing a device...');
	var msg = { command: 'pair' };
	var res = module.exports.milightSendMessage(
		deviceId,
		group,
		type,
		msg,
		url
	);
	return res;
};

module.exports.milightUnpairDevice = function(deviceId, group, type, url) {
	console.log('unpairing a device...');
	var msg = { command: 'unpair' };
	module.exports.milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightNextDisco = function(deviceId, group, type, url) {
	console.log('next DISCOOOO');
	console.log(deviceId + ' * ' + group + ' * ' + type + ' * ' + url);
	var msg = { command: 'next_mode' };
	module.exports.milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightPrevDisco = function(deviceId, group, type, url) {
	var msg = { command: 'previous_mode' };
	module.exports.milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightDiscoSpeedUp = function(deviceId, group, type, url) {
	var msg = { command: 'mode_speed_up' };
	module.exports.milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightDiscoSpeedDown = function(deviceId, group, type, url) {
	var msg = { command: 'mode_speed_down' };
	module.exports.milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightSetBrightness = function(deviceId, group, type, val) {
	var msg = { level: val };
	console.log(msg);
	module.exports.milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightOn = function(deviceId, group, type, level, kelvin, hue) {
	var msg = {
		status: true,
		level: level
	};
	if (kelvin !== false) {
		msg.kelvin = kelvin;
		msg.command = 'set_white';
	} else if (hue !== false) msg.hue = hue;
	//console.log('milightOn: msg -> ' + msg);
	module.exports.milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightOff = function(deviceId, group, type) {
	var msg = { status: false };
	module.exports.milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightSetColor = function(deviceId, group, type, val, level) {
	var msg = { hue: val, level: level };
	module.exports.milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightSetState = function(
	deviceId,
	group,
	type,
	state,
	level,
	kelvin,
	hue
) {
	//console.log(
	//	'deviceId: ' +
	//		deviceId +
	//		' group: ' +
	//		group +
	//		' type: ' +
	//		type +
	//		' state: ' +
	//		state +
	//		' level: ' +
	//		level +
	//		' kelvin: ' +
	//		kelvin +
	//		' hue: ' +
	//		hue
	//);
	if (state) {
		if (kelvin !== false) {
			module.exports.milightOn(
				deviceId,
				group,
				type,
				level,
				kelvin,
				false
			);
		} else {
			module.exports.milightOn(deviceId, group, type, level, false, hue);
		}
	} else {
		module.exports.milightOff(deviceId, group, type);
	}
};

module.exports.milightWhiteLight = function(deviceId, group, type, level) {
	var msg = {
		command: 'set_white',
		level: level
	};
	milightSendMessage(deviceId, group, type, msg);
};

//Convenience Functions For Controlling MiLight
module.exports.milightOnWhiteBright = function(deviceId, group, type) {
	return module.exports.milightSetBrightness(
		deviceId,
		group,
		type,
		config.milightDefaultLevel
	);
};
module.exports.milightChillLevel = function(deviceId, group, type) {
	return module.exports.milightSetBrightness(
		deviceId,
		group,
		type,
		config.milightChillLevel
	);
};
module.exports.milightNightLight = function(deviceId, group, type) {
	return module.exports.milightSetBrightness(
		deviceId,
		group,
		type,
		config.milightNightLight
	);
};
