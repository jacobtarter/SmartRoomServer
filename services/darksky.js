const axios = require('axios');
const websocketService = require('./websockets');

module.exports.updateDarkSky = function(){
  console.log('*');
  console.log("*** Syncing up with DarkSky API... ***");
  console.log('*');
  axios.get("https://api.darksky.net/forecast/c7d0393df00656e1da760a074600c358/41.80626,-88.27588")
  .then(res => {
    var weather = {
      current: {

      },
      daily: {

      },
      minutely: {

      }
    };
    var data = res.data;
    var temp=data.currently.apparentTemperature;
    var currentSummary=data.currently.summary;
    var dailySummary=data.hourly.summary;
    var nearestStorm=data.currently.nearestStormDistance;
    var precipProbability=data.currently.precipProbability;
    var windSpeed=data.currently.windSpeed;
    var currentIcon=data.currently.icon;
    var dailyIcon=data.hourly.icon;
    var minutelySummary=data.minutely.summary;
    weather.temp=temp;
    weather.nearestStorm=nearestStorm;
    weather.precipProbability=precipProbability;
    weather.windSpeed=windSpeed;
    weather.current.summary=currentSummary;
    weather.current.icon=currentIcon;
    weather.daily.summary=dailySummary;
    weather.daily.icon=dailyIcon;
    weather.minutely.summary=minutelySummary;

    websocketService.updateWeatherData(weather);

    //Run every 2.5 minutes
    //150000->2.5 minutes
    //3000000>5.0 minutes
    setTimeout(function() {module.exports.updateDarkSky()}, 300000);
  })
  .catch(function (error) {
    console.log(error);
  });
};
