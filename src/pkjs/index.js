var myAPIKey = '3322945916784e78cda9a5cb8f3ee542';

var xhrRequest = function (url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.send();
};

function locationSuccess(pos) {
  // Construct URL
  var url = 'http://api.openweathermap.org/data/2.5/weather?lat=' +
      pos.coords.latitude + '&lon=' + pos.coords.longitude + '&appid=' + myAPIKey;

  // Send request to OpenWeatherMap
  xhrRequest(url, 'GET',
    function(responseText) {
      // responseText contains a JSON object with weather info
      var json = JSON.parse(responseText);

      // Temperature in Kelvin requires adjustment
      var temperature = Math.round(json.main.temp - 273.15);
      console.log('Temperature is ' + temperature);

      // Conditions
      var conditions = json.weather[0].main;
      console.log('Conditions are ' + conditions);

      // Send to Pebble
      Pebble.sendAppMessage(
        { WeatherTemperature: temperature },
        function() {
          console.log('Weather info sent to Pebble successfully!');
        },
        function() {
          console.log('Error sending weather info to Pebble!');
        }
      )  ;
    }
  );
}

function locationError() {
  console.log('Error requesting location!');
}

function getLocationAndWeather() {
  navigator.geolocation.getCurrentPosition(
    locationSuccess,
    locationError,
    {timeout: 15000, maximumAge: 60000}
  );
}

// Listen for when the watchface is opened
Pebble.addEventListener('ready',
  function() {
    console.log('PebbleKit JS ready!');

    // Get location and temperatude
    getLocationAndWeather();

    setInterval(getLocationAndWeather, 10 * 60 * 1000);
  }
);
