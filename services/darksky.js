const axios = require('axios');
const websocketService = require('./websockets');
const serviceTag = '[DarkSky Service]';
var moment = require('moment');

var weatherData = {};

module.exports.updateDarkSky = function() {
	setTimeout(function() {
		module.exports.getNewData();
	}, 5000); // Wait 5 seconds for first run

	setInterval(function() {
		module.exports.getNewData();
	}, 60 * 18 * 1000); // 60 seconds * 18 minutes * 1000 milliseconds
};

module.exports.getNewData = function() {
	serviceLog('*** Syncing up with DarkSky API... ***');
	axios
		.get(
			'https://api.darksky.net/forecast/c7d0393df00656e1da760a074600c358/41.80626,-88.27588'
		)
		.then(res => {
			var weather = {
				current: {},
				daily: {},
				minutely: {}
			};
			var data = res.data;

			var dateTime = new moment();
			var weatherTime = new moment.unix(data.currently.time);
			serviceLog(
				'Time from new weather: ' +
					weatherTime.format('dddd, MMMM Do YYYY, h:mm:ss a') +
					', Actual time: ' +
					dateTime.format('dddd, MMMM Do YYYY, h:mm:ss a')
			);
			if (dateTime.diff(weatherTime, 'minutes') > 1) {
				serviceLog('ERROR: Weather data out of sync!', true);
			}

			weather.temp = data.currently.apparentTemperature;
			weather.nearestStorm = data.currently.nearestStormDistance;
			weather.precipProbability = data.currently.precipProbability;
			weather.windSpeed = data.currently.windSpeed;
			weather.current.summary = data.currently.summary;
			weather.current.icon = data.currently.icon;
			weather.daily.summary = data.hourly.summary;
			weather.daily.icon = data.hourly.icon;
			weather.minutely.summary = data.minutely.summary;
			weather.daily.sunrise = data.daily.data[0].sunriseTime;
			weather.daily.sunset = data.daily.data[0].sunsetTime;

			//console.log(
			//	serviceTag + 'New weather data: ' + JSON.stringify(weather)
			//);
			this.weatherData = weather;
			websocketService.updateWeatherData(weather);
		})
		.catch(function(error) {
			serviceLog(error, true);
		});
};

module.exports.getCurrentData = function() {
	if (!this.weatherData) {
		serviceLog('Err: No weather data currently stored', true);
	}
	return this.weatherData;
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
