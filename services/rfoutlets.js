var sendCode = false;
const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({
	maxConcurrent: 1,
	minTime: 80,
	highWater: 10,
	strategy: Bottleneck.strategy.OVERFLOW
});

var rpi433 = require('rpi-433'),
	//rfSniffer = rpi433.sniffer({
	//Sniff on GPIO 2 (or Physical PIN 13)
	//  pin: 2,
	//  debounceDelay: 250
	//}),
	rfEmitter = rpi433.emitter({
		// Send through GPIO 0 (or Physical PIN 11)
		pin: 0,
		// ZAP remote appears to send a 181/182 pulse
		pulseLength: 182
	});

// Enable / Disable Sending Codes to Client via Websocket
// Utilized for easy setup of RF devices
module.exports.sendRfCodes = function(boolVal) {
	sendCode = boolVal == true;
};

// Start up the sniffer process, pass in socket.io connection
module.exports.initializeRF = function(socketIo) {
	//rfSniffer.on('data', function(dataRead) {
	//  if (sendCode) {
	//    var data = JSON.parse(dataRead);
	//    console.log('sending code over websocket! ' + data.code);
	//   socketIo.emit('RF_CODE', data);
	//  }
	//});
};

function sendRF(code, index = 0) {
	if (index < 5) {
		rfEmitter.sendCode(code, function(error, stdout) {
			if (error) console.log(error);
		});
		index++;
		sendRFSignal(code, index);
	}
}
var sendRFSignal = limiter.wrap(sendRF);

// Send a signal to a registered RF device
module.exports.sendSignal = sendRF;
