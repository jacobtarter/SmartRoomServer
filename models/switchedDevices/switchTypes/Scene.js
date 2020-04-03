const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSwitch = require('./BaseSwitch');
const deviceService = require('../../../services/switchedDeviceService');

var commandDef = new Schema();

var deviceCommandArray = new Schema({
	deviceId: {
		type: String,
		required: true
	},
	commands: [
		{
			function: {
				type: String,
				required: true
			},
			param: {
				type: Object,
				required: false
			}
		}
	]
});

var SceneSchema = new Schema({
	children: [deviceCommandArray],
	child: deviceCommandArray
});

SceneSchema.pre('validate', function(next) {
	this.state = true;
	next();
});

SceneSchema.method('togglePower', function() {
	console.log('power off called');
	this.state = true;

	this.children.forEach(device => {
		device.commands.forEach(command => {
			console.log(
				device.deviceId +
					' * ' +
					command.function +
					' * ' +
					command.param
			);
			deviceService.sendCommand(
				device.deviceId,
				command.function,
				command.param
			);
		});
	});
});

SceneSchema.method('powerOn', function() {
	console.log('power off called');
	this.state = true;

	this.children.forEach(device => {
		device.commands.forEach(command => {
			if (device.deviceId === 'all') {
				console.log('calling for each');
				deviceService.forEachDevice(command.function, command.param);
				return;
			} else {
				deviceService.sendCommand(
					device.deviceId,
					command.function,
					command.param
				);
			}
		});
	});
});

SceneSchema.method('powerOff', function() {
	console.log('power off called');
	this.state = true;

	this.children.forEach(device => {
		device.commands.forEach(command => {
			if (device.deviceId === 'all') {
				console.log('calling for each');
				deviceService.forEachDevice(command.function, command.param);
			} else {
				deviceService.sendCommand(
					device.deviceId,
					command.function,
					command.param
				);
			}
		});
	});
});

//Schema
const Scene = BaseSwitch.discriminator('Scene', SceneSchema);

module.exports = mongoose.model('Scene');
