//--Setup of Our Fake Wemo Switches--//
//-----------**************----------//
//-----This is what the Echo Uses----//

const FauxMo = require('fauxmojs');
const SwitchedDevice = require('../models/switchedDevices/SwitchedDevice');
const switchedDeviceService = require('./switchedDeviceService');

module.exports.initializeAlexa = function() {
  console.log('Starting up Alexa Integration Process...');

  var devicesQuery = SwitchedDevice.find({})
    .populate({ path: 'category', select: 'name' })
    .populate({ path: 'room', select: 'name' })
    .populate({ path: 'switch' });

  var deviceArray = [];
  var port = 11000;
  var deviceCount = 0;

  // Dynamically generate an array of all the created devices, utilizing their names for the voice commands.
  // This wil get passed into the constructor, meaning all devices should automatically be controllable by
  // Alexa.

  devicesQuery.exec(function(err, devices) {
    if (err) return console.log(err);
    devices.forEach(function(device) {
      var alexaDevice = {
        name: device.name,
        port: port,
        handler: action => {
          if (action == 'on') {
            try {
              console.log(
                'alexa turning on device: ' +
                  device.name +
                  ', ID: ' +
                  device._id
              );
              switchedDeviceService.sendCommand(device._id, 'powerOn');
              return true;
            } catch (err) {
              console.log('Error communicating with device!');
              return false;
            }
          } else {
            try {
              console.log('alexa turning off device: ' + device.name);
              switchedDeviceService.sendCommand(device._id, 'powerOff');
              return true;
            } catch (err) {
              console.log('Error communicating with device!');
              return false;
            }
          }
        }
      };
      deviceArray.push(alexaDevice);
      port++;
      deviceCount++;
    });

    let fauxMo = new FauxMo({
      ipAddress: '192.168.1.243',
      devices: deviceArray
    });

    console.log('*');
    console.log(
      '*** Alexa Voice Control For Your (' +
        deviceCount +
        ') Devices is Ready. ***'
    );
    console.log('*');

  });
};
