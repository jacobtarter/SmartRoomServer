const SwitchedDevice = require('../models/switchedDevices/SwitchedDevice');
const BaseSwitch = require('../models/switchedDevices/switchTypes/BaseSwitch');
const BulbRGB = require('../models/switchedDevices/switchTypes/BulbRGB');
const RFOutlet = require('../models/switchedDevices/switchTypes/RFOutlet');
const Room = require('../models/switchedDevices/rooms/Room');
const Category = require('../models/switchedDevices/deviceCategories/DeviceCategory');
const WebsocketService = require('./websockets');

const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({
	maxConcurrent: 1,
	minTime: 100,
	highWater: 15,
	strategy: Bottleneck.strategy.OVERFLOW
});

var deviceCache = [];

module.exports.getCachedDevices = function() {
	return deviceCache;
};

module.exports.buildDeviceCache = function() {
	SwitchedDevice.find({})
		.populate({ path: 'category', select: 'name' })
		.populate({ path: 'room', select: 'name' })
		.populate({ path: 'switch' })
		.then(devices => {
			deviceCache = devices;
			console.log('Device cache has been built.');
		});
};

function command(id, command, param) {
	if (!deviceCache) {
		module.exports.buildDeviceCache();
	}
	deviceCache.forEach(device => {
		if (String(device._id) == String(id)) {
			if (param) {
				device.switch[command](param);
			} else {
				device.switch[command]();
			}
			WebsocketService.sendLightStates(deviceCache);
			return;
		}
	});
}

var send = limiter.wrap(command);

module.exports.sendCommand = function(id, command, param) {
	send(id, command, param);
};
