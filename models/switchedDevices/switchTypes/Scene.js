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
				type: String,
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
	this.state = true;
	this.children.forEach(device => {
		device.commands.forEach(command => {
			deviceService.sendCommand(
				device.deviceId,
				command.function,
				command.param
			);
		});
	});
});

SceneSchema.method('powerOn', function() {
	this.state = true;
	this.children.forEach(device => {
		device.commands.forEach(command => {
			deviceService.sendCommand(
				device.deviceId,
				command.function,
				command.param
			);
		});
	});
});

SceneSchema.method('powerOff', function() {
	this.state = true;
	this.children.forEach(device => {
		device.commands.forEach(command => {
			deviceService.sendCommand(
				device.deviceId,
				command.function,
				command.param
			);
		});
	});
});

//Schema
const Scene = BaseSwitch.discriminator('Scene', SceneSchema);

module.exports = mongoose.model('Scene');
