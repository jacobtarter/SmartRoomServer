const express = require('express');
const router = express.Router();

const Scene = require('../../models/switchedDevices/switchTypes/Scene');
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

// Create Scene
router.post('/', (req, res) => {
	try {
		newDevice = new SwitchedDevice();
		if (req.body.name) {
			newDevice.name = req.body.name;
		} else {
			res.status(400).json({ error: 'Needs Name' });
		}
		if (req.body.category) {
			console.log(req.body.category);
			Category.findById(req.body.category).then(category => {
				console.log('Category: ' + category);
				newDevice.category = category;
				if (req.body.room) {
					Room.findById(req.body.room).then(room => {
						newDevice.room = room;
						if (req.body.commands) {
							newScene = new Scene();
							newScene.children = req.body.commands;
							Scene.create(newScene, function(err, newScene) {
								if (err) {
									console.log('Error Creating Scene: ' + err);
									res.status(400).json(err);
								}
								console.log(
									'New Scene Created: "' + newScene + '"'
								);

								newDevice.switch = newScene;
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
							// No Commands Given
							res.status(400).json({
								error: 'No Scene DeviceCommands'
							});
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
		res.status(500).json({ error: 'Unknown Error: ' + err });
	}
});

module.exports = router;
