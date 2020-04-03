const express = require('express');
const router = express.Router();

const SwitchedDevice = require('../../models/switchedDevices/SwitchedDevice');
const BaseSwitch = require('../../models/switchedDevices/switchTypes/BaseSwitch');
const Room = require('../../models/switchedDevices/rooms/Room');
const Category = require('../../models/switchedDevices/deviceCategories/DeviceCategory');

const deviceService = require('../../services/switchedDeviceService');
const alexaService = require('../../services/alexa');

const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({
	maxConcurrent: 1,
	minTime: 75,
	highWater: 5,
	strategy: Bottleneck.strategy.OVERFLOW
});

const ipMap = {
	'192.168.1.71': 'Macbook',
	'192.168.1.245': 'Phone',
	'192.168.1.243': 'Pi Server',
	'192.168.1.244': 'Pi Control Panel'
};

function logClientData(req) {
	ipAddress = req.connection.remoteAddress.slice(7);
	console.log('***');
	console.log('Request: ');
	console.log(new Date().toTimeString());
	console.log('IP ADDRESS: ' + ipAddress);
	console.log('REQUEST FROM: ' + ipMap[ipAddress]);
	console.log('***');
}

// Temporary Testing Route, For Dev
router.get('/test', (req, res) => {
	SwitchedDevice.find({})
		.populate({ path: 'category', select: 'name' })
		.populate({ path: 'room', select: 'name' })
		.populate({ path: 'switch' })
		.then(devices => {
			devices.forEach(function(device) {
				if (device.switch.type == 'BulbRGB') {
					device.switch.deviceId = '0xCD88';
					device.switch.save();
					device.save();
				}
			});
			res.json({ message: 'TEST PATH' });
		});
});

// Get All Switched Devices
router.get('/', (req, res) => {
	//logClientData(req);
	var devices = deviceService.getCachedDevices(req.query.type);
	if (devices) {
		res.json(devices);
	} else {
		res.json({ message: 'no devices yet.' });
	}
});

router.delete('/:id', (req, res) => {
	//logClientData(req);
	SwitchedDevice.findByIdAndRemove(req.params.id, (err, device) => {
		if (err) {
			console.log('ERROR DELETING ' + err);
			return res.status(500).send(err);
		}
		deviceService.buildDeviceCache();
		alexaService.initializeAlexa();
		return res.json({ message: 'Device successfully deleted' });
	});
});

// Create Device
router.post('/', (req, res) => {
	//logClientData(req);
	try {
		newDevice = new SwitchedDevice();
		if (req.body.name) {
			newDevice.name = req.body.name;
		} else {
			res.status(400).json({ error: 'Needs Name' });
		}
		if (req.body.description) {
			newDevice.description = req.body.description;
		}
		if (req.body.category) {
			Category.findById(req.body.category).then(category => {
				newDevice.category = category;

				if (req.body.room) {
					Room.findById(req.body.room).then(room => {
						newDevice.room = room;

						if (req.body.switch) {
							var sw = req.body.switch;
							sw.bulbStyle = 'RGB_CCT';
							BaseSwitch.create(sw, function(err, sw) {
								if (err) res.json(err);
								newDevice.switch = sw;
								SwitchedDevice.create(newDevice, function(
									err,
									newDevice
								) {
									if (err) {
										console.log(
											'Error Creating Device: ' + err
										);
										res.status(400).json(err);
									}
									console.log(
										'New Device Created: "' +
											newDevice +
											'"'
									);
									deviceService.buildDeviceCache();
									alexaService.initializeAlexa();
									res.status(200).send(newDevice);
								});
							});
						} else {
							// No Switch
							res.status(400).json({ error: 'No Switch' });
						}
					});
				} else {
					// No Room
					res.status(400).json({ error: 'No Room' });
				}
			});
		} else {
			// No Category
			res.status(400).json({ error: 'No Category' });
		}
	} catch (err) {
		res.status(400).json(err);
	}
});

router.post('/command', (req, res) => {
	//logClientData(req);
	command(req, res);
});
var command = limiter.wrap(sendCommand);
function sendCommand(req, res) {
	param = req.body.param ? req.body.param : null;
	deviceService.sendCommand(req.body.id, req.body.command, param);
	res.status(200).send({ msg: 'success' });
}

router.post('/command/foreach', (req, res) => {
	//logClientData(req);
	forEachDevice(req, res);
	res.status(200).send({ msg: 'success' });
});
var forEachDevice = limiter.wrap(sendForEachCommand);
function sendForEachCommand(req, res) {
	deviceService.forEachDevice(
		req.body.deviceType,
		req.body.command,
		req.body.param
	);
}

module.exports = router;
