var darksky = require('./darksky');
var moment = require('moment');
var deviceService = require('./switchedDeviceService');
const serviceTag = '[Scheduler Service]';

module.exports.startSchedule = function() {
	setTimeout(function() {
		var temp = module.exports.getColorTemp();
		serviceLog(
			'Adjusting color temp according to natural light condtitions, color temp: [' +
				temp +
				']'
		);
		deviceService.forEachDevice('BulbRGB', 'setColorTemp', temp);
	}, 10000);

	setInterval(function() {
		var temp = module.exports.getColorTemp();
		serviceLog(
			'Adjusting color temp according to natural light condtitions, color temp: [' +
				temp +
				']'
		);
		deviceService.forEachDevice('BulbRGB', 'setColorTemp', temp);
	}, 60 * 5 * 1000); // 60 seconds * 5 minutes * 1000 milliseconds
};

module.exports.getColorTemp = function() {
	var currentWeather = darksky.getCurrentData();
	var sunrise = moment.unix(currentWeather.daily.sunrise);
	var sunset = moment.unix(currentWeather.daily.sunset);
	var currentTime = new moment();
	serviceLog(
		'Sunrise: ' +
			sunrise.format('LLLL') +
			', Sunset: ' +
			sunset.format('LLLL')
	);
	var tillSunrise = sunrise.diff(currentTime, 'minutes');
	var tillSunset = sunset.diff(currentTime, 'minutes');

	serviceLog(
		'Time: ' +
			currentTime.format('LLLL') +
			'. Minutes to sunrise: ' +
			tillSunrise +
			', Minutes to sunset: ' +
			tillSunset
	);

	if (tillSunrise < 0 && tillSunset > 100) {
		serviceLog('Sun is high: 100+ minutes to sunset.');
		return 0;
	}

	if (
		(tillSunset > 100 && tillSunrise > 100) ||
		(tillSunset < 0 && tillSunrise < 0)
	) {
		serviceLog('Sun is down: 100+ minutes to sunrise.');
		return 100;
	}

	if (tillSunrise >= 0 && tillSunrise <= 100) {
		serviceLog('Sun is rising. Sunrise is in ' + tillSunrise + ' minutes.');
		return tillSunrise;
	}

	if (tillSunset >= 0 && tillSunset <= 100) {
		serviceLog('Sun is setting. Sunset is in ' + tillSunset + ' minutes.');
		return 100 - tillSunset;
	}
	serviceLog("ERROR: CAN'T DETERMINE SUNSET / SUNRISE", true);
	return null;
};

function serviceLog(msg, isError) {
	var dateTime = new moment();
	var errMsg =
		'[' + dateTime.format('LTS dd, MMM Do') + '] ' + serviceTag + ' ' + msg;
	if (isError === true) {
		console.error(errMsg);
	} else {
		console.log(errMsg);
	}
}
