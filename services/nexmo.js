const Nexmo = require('nexmo')
module.exports.initializeNexmo = function() {

};

module.exports.textMyPhone = function() {
  const nexmo = new Nexmo({
    apiKey: 'dec32303',
    apiSecret: 'a7ed432bf8765c8e'
  }, {debug: true});

  var number = '16306057239';
  var message = 'FIND ME';
  nexmo.message.sendSms(
    '12013801429', number, message, { type: 'unicode'},
    (err, responseData) => {
      if(err){
        console.log(err);
      } else {
        console.dir(responseData);
      }
    }
  )
}
