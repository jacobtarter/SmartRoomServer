const axios = require('axios');
const config = require('../config/milightlevels');

//Function to send the signal to the MiLight API, Running On ESP Board
function milightSendMessage(deviceId, group, type, msg, url = null) {
	myMessage = JSON.stringify(msg);
	console.log(
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
	);

	var baseUrl = url ? url : 'http://192.168.1.92/gateways/';
	console.log('baseURL: ' + baseUrl);
	var path = baseUrl + deviceId + '/' + type + '/' + group;
	console.log('path: ' + path);

	axios
		.put(path, msg)
		.then(function(response) {
			if (response.status == 200) {
				return true;
			}
			return false;
		})
		.catch(function(error) {
			return error;
		});
}

module.exports.milightPairDevice = function(deviceId, group, type, url) {
	console.log('pairing a device...');
	var msg = { command: 'pair' };
	milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightUnpairDevice = function(deviceId, group, type, url) {
	console.log('unpairing a device...');
	var msg = { command: 'unpair' };
	milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightNextDisco = function(deviceId, group, type, url) {
	console.log('next DISCOOOO');
	console.log(deviceId + ' * ' + group + ' * ' + type + ' * ' + url);
	var msg = { command: 'next_mode' };
	milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightPrevDisco = function(deviceId, group, type, url) {
	var msg = { command: 'previous_mode' };
	milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightDiscoSpeedUp = function(deviceId, group, type, url) {
	var msg = { command: 'mode_speed_up' };
	milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightDiscoSpeedDown = function(deviceId, group, type, url) {
	var msg = { command: 'mode_speed_down' };
	milightSendMessage(deviceId, group, type, msg, url);
};

module.exports.milightSetBrightness = function(deviceId, group, type, val) {
	var msg = { level: val };
	console.log(msg);
	return milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightOn = function(deviceId, group, type, level, hue) {
	var msg = {
		status: true,
		level: level
	};
	if (hue) msg.hue = hue;
	milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightOff = function(deviceId, group, type) {
	var msg = { status: false };
	return milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightSetColor = function(deviceId, group, type, val, level) {
	var msg = { hue: val, level: level };
	milightSendMessage(deviceId, group, type, msg);
};

module.exports.milightSetState = function(
	deviceId,
	group,
	type,
	state,
	level,
	hue
) {
	if (state) {
		if (hue) {
			module.exports.milightOn(deviceId, group, type, level);
		} else {
			module.exports.milightOn(deviceId, group, type, level, hue);
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
