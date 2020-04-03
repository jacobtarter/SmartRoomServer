const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseSwitch = require('./BaseSwitch');
const RGBService = require('../../../services/milight');
const config = require('../../../config/milightlevels');
var Random = require('random-js');
var random = new Random(Random.engines.mt19937().autoSeed());

var rgbSchema = new Schema({
	deviceId: {
		type: String,
		required: true
	},
	deviceGroup: {
		type: Number,
		default: 1,
		required: true
	},
	bulbStyle: {
		type: String,
		default: 'RGBW',
		required: true,
		enum: ['RGBW', 'CCT', 'RGB_CCT', 'RGB']
	},
	brightness: {
		type: Number,
		default: config.milightDefaultLevel,
		required: false
	},
	color: {
		type: Number,
		default: 127,
		required: false
	},
	colorTemp: {
		type: Number,
		default: 100,
		required: false
	},
	saturation: {
		type: Number,
		default: 100,
		required: false
	},
	isWhite: {
		type: Boolean,
		default: true,
		required: false
	},
	disco: {
		active: {
			type: Boolean,
			default: false,
			required: false
		},
		mode: {
			type: Number,
			default: 0,
			required: false
		},
		speed: {
			type: Number,
			default: 0,
			required: false
		}
	},
	hub: {
		isPaired: {
			type: Boolean,
			default: false,
			required: false
		},
		address: {
			type: String,
			default: 'http://192.168.4.1/gateways/',
			required: true
		}
	}
});

objParamMap = {
	status: 'state',
	hue: 'color',
	level: 'brightness',
	saturation: 'saturation',
	temperature: 'colorTemp'
};

// -- Methods --

// Pair
rgbSchema.method('pairDevice', function() {
	RGBService.milightPairDevice(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.hub.address
	);
	this.hub.isPaired = true;
	this.save();
	//console.log('paired as: ' + this.deviceId + ', group: ' + this.deviceGroup +
	//' on hub url: ' + this.hub.address)
});

// Unpair
rgbSchema.method('unpairDevice', function() {
	RGBService.milightUnpairDevice(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.hub.address
	);
	this.hub.isPaired = false;
	this.save();
	//console.log('device unpaired from the hub: ' + this.hub.address);
});

rgbSchema.method('sendMessage', function(msgObj) {
	console.log('msgObj: ' + JSON.stringify(msgObj));
	newVals = {};
	Object.keys(msgObj).forEach(function(cmd) {
		if (objParamMap[cmd]) {
			paramName = objParamMap[cmd];
			paramVal = msgObj[cmd];
			if (!isNaN(paramVal) && paramVal !== true && paramVal !== false) {
				newVals[paramName] = parseInt(paramVal);
			} else {
				this[paramName] = paramVal;
			}
		} else if (cmd === 'command' && msgObj[cmd] === 'set_white') {
			newVals.isWhite = true;
			console.log('cmd: ' + cmd + ' msgObj[cmd] = ' + msgObj[cmd]);
		}
	});
	if (newVals.brightness !== null) {
		this.brightness = newVals.brightness;
		this.state = true;
	}
	if (newVals.saturation !== null) this.saturation = newVals.saturation;
	if (newVals.color !== null) this.color = newVals.color;
	if (typeof newVals.state === 'boolean') this.state = newVals.state;
	if (newVals.isWhite !== null) this.isWhite = newVals.isWhite;
	if (newVals.colorTemp) this.colorTemp = newVals.colorTemp;
	console.log(JSON.stringify(newVals));
	this.save();
	if (msgObj.command === 'set_white') {
		console.log('test. colorTemp: ' + this.colorTemp);
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.state,
			this.brightness,
			this.colorTemp,
			false
		);
	} else {
		RGBService.milightSendMessage(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			msgObj,
			this.hub.address
		);
	}
});

// Power On
rgbSchema.method('powerOn', function() {
	this.state = true;
	this.save();
	if (this.isWhite) {
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.state,
			this.brightness,
			this.colorTemp,
			false
		);
	} else {
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.state,
			this.brightness,
			false,
			this.color
		);
	}
	//console.log('turnin dis lamp on');
});

// Power Off
rgbSchema.method('powerOff', function() {
	RGBService.milightOff(this.deviceId, this.deviceGroup, this.bulbStyle);
	//console.log('turnin dis lamp off');
	this.state = false;
	this.save();
});

// Toggle Power
rgbSchema.method('togglePower', function() {
	if (this.isWhite) {
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			!this.state,
			this.brightness,
			this.colorTemp,
			false
		);
	} else {
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			!this.state,
			this.brightness,
			false,
			this.color
		);
	}
	this.state = !this.state;
	this.save();
	//console.log('togglePower: this.colorState-> ' + this.colorTemp);
	var action = this.state ? 'on' : 'off';
	//console.log('turnin dis lamp ' + action);
});

rgbSchema.method('onWhiteBright', function(brightness) {
	this.state = true;
	this.isWhite = true;
	this.brightness = parseInt(brightness);
	this.save();
	RGBService.milightSetState(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.state,
		this.brightness,
		this.colorTemp,
		false
	);
});

// Set Brightness
rgbSchema.method('setBrightness', function(val) {
	if (this.brightness !== parseInt(val)) {
		this.brightness = val;
		this.save();
		RGBService.milightSetBrightness(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.brightness
		);
		//console.log('setting brightness to: ' + val)
	}
});

// Increment / Decrement Brightness
rgbSchema.method('incrementBrightness', function() {
	console.log('current: ' + this.brightness);
	if (this.brightness === 0) {
		this.brightness = 10;
		this.state = true;
		this.save();
		RGBService.milightOn(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.brightness,
			this.hue
		);
		console.log('bumping up the brightness to minimum');
		return;
	}
	this.brightness < 100 ? (this.brightness += 10) : (this.brightness = 100);
	this.brightness > 100 ? (this.brightness = 100) : null;
	this.save();
	RGBService.milightSetBrightness(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.brightness
	);
	//console.log('setting brightness to: ' + this.brightness)
});

rgbSchema.method('decrementBrightness', function() {
	if (this.brightness > 0) {
		this.brightness -= 10;
		this.brightness < 0 ? (this.brightness = 0) : null;
		this.save();
		RGBService.milightSetBrightness(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.brightness
		);
		//console.log('setting brightness to: ' + this.brightness);
	} else {
		this.brightness = 0;
		this.state = false;
		this.save();
		RGBService.milightOff(this.deviceId, this.deviceGroup, this.bulbStyle);
		//console.log('turnin milight all the way down to off.');
	}
});

rgbSchema.method('whiteLight', function() {
	//console.log('setting mode to white');
	if (!this.isWhite || !this.state) {
		this.isWhite = true;
		this.state = true;
		this.save();
		var msgObj = {
			temperature: this.colorTemp,
			brightness: this.level
		};
		RGBService.milightSendMessage(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			msgObj,
			this.hub.address
		);
	}
});

// Set Color Val
rgbSchema.method('setColorVal', function(val) {
	this.color = val;
	this.isWhite = false;
	this.save();
	RGBService.milightSetColor(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		val
	);
	//console.log('setting milight color hue to ' + val);
});

rgbSchema.method('setColorTemp', function(val) {
	val = parseInt(val);
	//console.log('setting color temp to: ' + val);
	this.colorTemp = val;
	this.save();
	//console.log('this.colorState after setColorTemp: ' + this.colorTemp);
	if (this.state && this.isWhite) {
		var msgObj = {
			kelvin: val,
			transition: 1
		};
		RGBService.milightSendMessage(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			msgObj,
			this.hub.address
		);
	}
});

// Increment / Decrement Color Val
rgbSchema.method('incrementColorVal', function() {
	if (this.isWhite) {
		this.isWhite = false;
		this.save();
		RGBService.milightSetColor(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.color,
			this.brightness
		);
		return;
	}
	this.color += 16;
	this.color > 359 ? (this.color = 0) : null;
	this.save();
	RGBService.milightSetColor(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.color,
		this.brightness
	);
	console.log('increasing milight color hue to: ' + this.color);
});

rgbSchema.method('decrementColorVal', function() {
	if (this.isWhite) {
		this.isWhite = false;
		this.save();
		RGBService.milightSetColor(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.color,
			this.brightness
		);
		return;
	}
	this.color -= 16;
	this.color < 0 ? (this.color = 359) : null;
	this.save();
	RGBService.milightSetColor(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.color,
		this.brightness
	);
	console.log(
		'decreasing milight color hue to: ' + this.color,
		this.brightness
	);
});

rgbSchema.method('nextDiscoMode', function() {
	//console.log('switching to next disco mode...');
	if (this.isWhite) {
		this.isWhite = false;
		this.disco.active = true;
		this.save();
		return;
	} else if (!this.disco.active) {
		this.disco.active = true;
		this.save();
		return;
	}
	RGBService.milightNextDisco(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.hub.address
	);
});

rgbSchema.method('prevDiscoMode', function() {
	if (this.isWhite) {
		this.isWhite = false;
		this.disco.active = true;
		this.save();
		return;
	} else if (!this.disco.active) {
		this.disco.active = true;
		this.save();
		return;
	}
	RGBService.milightPrevDisco(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.hub.address
	);
	//console.log('switching to previous disco mode...');
});

rgbSchema.method('increaseDiscoSpeed', function() {
	if (this.isWhite) {
		this.isWhite = false;
		this.disco.active = true;
		this.save();
		return;
	} else if (!this.disco.active) {
		this.disco.active = true;
		this.save();
		return;
	}
	this.disco.speed++;
	this.save();
	RGBService.milightDiscoSpeedUp(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.hub.address
	);
	//console.log('pick it UP...');
});

rgbSchema.method('decreaseDiscoSpeed', function() {
	if (this.isWhite) {
		this.isWhite = false;
		this.disco.active = true;
		this.save();
		return;
	} else if (!this.disco.active) {
		this.disco.active = true;
		this.save();
		return;
	}
	this.disco.speed--;
	this.save();
	RGBService.milightDiscoSpeedDown(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.hub.address
	);
	//console.log('sloww it dooown...');
});

// -- End Methods --

rgbSchema.pre('validate', function(next) {
	if (!this.deviceId) {
		var id = random.integer('0x0000', '0xFFFF');
		console.log('THE ID: ' + id);
		this.deviceId = id;
	}
	next();
});

// Fill in all the action information when a new RGB bulb is saved
rgbSchema.pre('save', function(next) {
	this.actions = [
		{
			name: 'Power On',
			function: 'powerOn'
		},
		{
			name: 'Power Off',
			function: 'powerOff'
		},
		{
			name: 'Toggle Power',
			function: 'togglePower'
		},
		{
			name: 'Increase Brightness',
			function: 'incrementBrightness'
		},
		{
			name: 'Decrease Brightness',
			function: 'decrementBrightness'
		},
		{
			name: 'Set Brightness',
			function: 'setBrightness'
		},
		{
			name: 'Increase Color Value',
			function: 'incrementColorVal'
		},
		{
			name: 'Decrease Color Value',
			function: 'decrementColorVal'
		},
		{
			name: 'Set Color Value',
			function: 'setColorVal'
		},
		{
			name: 'Power On + White Light',
			function: 'whiteLight'
		},
		{
			name: 'Pair Device',
			function: 'pairDevice'
		},
		{
			name: 'Unpair Device',
			function: 'unpairDevice'
		},
		{
			name: 'Next Disco Mode',
			function: 'nextDiscoMode'
		},
		{
			name: 'Previous Disco Mode',
			function: 'prevDiscoMode'
		},
		{
			name: 'Increase Disco Speed',
			function: 'increaseDiscoSpeed'
		},
		{
			name: 'Decrease Disco Speed',
			function: 'decreaseDiscoSpeed'
		}
	];

	next();
});

const BulbRGB = BaseSwitch.discriminator('BulbRGB', rgbSchema);
module.exports = mongoose.model('BulbRGB');
