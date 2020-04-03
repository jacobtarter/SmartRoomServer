const SwitchedDevice = require('../models/switchedDevices/SwitchedDevice');
const WebsocketService = require('./websockets');

const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({
	maxConcurrent: 1,
	minTime: 85,
	highWater: 5,
	strategy: Bottleneck.strategy.OVERFLOW
});

var deviceCache = [];

module.exports.getCachedDevices = function(deviceType) {
	if (!deviceType) {
		return deviceCache;
	}
	matched = [];
	deviceCache.forEach(device => {
		if (device.switch.type === deviceType) {
			matched.push(device);
		}
	});
	return matched;
};

module.exports.getCachedDeviceById = function(id) {
	deviceCache.forEach(device => {
		if (device.switch._id === id) {
			return device;
		}
	});
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

var send = limiter.wrap(command);
module.exports.sendCommand = function(id, command, param) {
	send(id, command, param);
};

function command(id, command, param) {
	if (!deviceCache) {
		module.exports.buildDeviceCache();
	}
	//console.log(
	//	'ID: ' +
	//		id +
	//		' ** cmd: ' +
	//		command +
	//		' ** param: ' +
	//		JSON.stringify(param)
	//);
	deviceCache.forEach(device => {
		if (String(device._id) == String(id)) {
			if (param) {
				console.log('calling command!');
				device.switch[command](param);
			} else {
				device.switch[command]();
			}
			deviceType = device.switch.type.toUpperCase();
			WebsocketService.sendLightStates(
				module.exports.getCachedDevices(device.switch.type),
				deviceType
			);
		}
	});
}

module.exports.forEachDevice = function(deviceType, command, param) {
	//console.log('initial device type: ' + deviceType);
	//console.log('param: ' + param);
	if (!deviceCache) {
		module.exports.buildDeviceCache();
	}
	deviceCache.forEach(device => {
		if (device.switch.type === deviceType) {
			if (command === 'setBrightness') {
				device.switch['sendMessage']({
					status: true,
					level: param,
					command: 'set_white'
				});
			} else {
				if (param !== null) {
					device.switch[command](param);
				} else {
					device.switch[command]();
				}
			}
		}
	});
	typeUc = deviceType.toUpperCase();
	devices = module.exports.getCachedDevices(deviceType);
	WebsocketService.sendLightStates(devices, typeUc);
};
