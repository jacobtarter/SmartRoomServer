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
	minTime: 110,
	highWater: 2,
	strategy: Bottleneck.strategy.OVERFLOW
});

// Temporary Bulk Delete Route, For Dev
router.get('/delete/all', (req, res) => {
	//SwitchedDevice.remove({}).then(res.json({msg: "GOT EM ALL"}));
});

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
	var devices = deviceService.getCachedDevices();
	if (devices) {
		res.json(devices);
	} else {
		res.json({ message: 'no devices yet.' });
	}
});

router.delete('/:id', (req, res) => {
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
                            console.log("switch: " + JSON.stringify(sw));
                            sw.bulbStyle = "RGB_CCT";
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

function sendCommand(req, res) {
	console.log('**');
	console.log('**REQUEST: ' + new Date() + ' **');
	deviceService.sendCommand(req.body.id, req.body.command);
	res.status(200).send({ msg: 'success' });
}

var command = limiter.wrap(sendCommand);

// Send Command To Device
router.post('/command', (req, res) => {
	command(req, res);
});

module.exports = router;
