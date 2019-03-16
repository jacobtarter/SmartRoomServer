var SpotifyWebApi = require('spotify-web-api-node');
var axios = require('axios');
var request = require('request');
var websocketService = require('./websockets');


var scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'],
    redirectUri = 'http://192.168.1.243/spotify',
    clientId = 'f13322c1db48467e9805861a8ac3515e',
    state = 'myStateParam';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
  redirectUri : redirectUri,
  clientId : clientId
});

module.exports.getAuthURL = function(){


  // Create the authorization URL
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

  console.log(authorizeURL);
}

module.exports.getToken = function(code){
  var client_id="f13322c1db48467e9805861a8ac3515e";
  var client_secret="c73d9a07a26445a0b3fcf2f566251b82";
  var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: 'http://192.168.1.243/spotify',
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

  request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
            refresh_token = body.refresh_token,
            expires_in = body.expires_in;

        console.log('The token expires in ' + body.expires_in);

        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);

        setTimeout(refreshToken, 5000);
        //console.log("Access: " + access_token);
        //console.log("Refresh: " + refresh_token);
        websocketService.sendSpotifyCodes(access_token, refresh_token);
    } else {
      console.log(error);
    }

});
refreshToken = function(){
  spotifyApi.refreshAccessToken()
  .then(function(data) {
    console.log('The access token has been refreshed!');

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log(data.body['access_token']);
    console.log(data.body['refresh_token']);

    websocketService.sendSpotifyCodes()
  }, function(err) {
    console.log('Could not refresh access token', err);
  });
}
}
