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
			default: 'http://192.168.1.92/gateways/',
			required: true
		}
	}
});

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
			this.color
		);
	} else {
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.state,
			this.brightness,
			false
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
			this.color
		);
	} else {
		RGBService.milightSetState(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			!this.state,
			this.brightness,
			false
		);
	}
	this.state = !this.state;
	this.save();
	var action = this.state ? 'on' : 'off';
	//console.log('turnin dis lamp ' + action);
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
		RGBService.milightWhiteLight(
			this.deviceId,
			this.deviceGroup,
			this.bulbStyle,
			this.brightness
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
	this.color += 8;
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
	this.color -= 8;
	this.color < 0 ? (this.color = 359) : null;
	this.save();
	RGBService.milightSetColor(
		this.deviceId,
		this.deviceGroup,
		this.bulbStyle,
		this.color,
		this.brightness
	);
	console.log('decreasing milight color hue to: ' + this.color, this.brightness);
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
