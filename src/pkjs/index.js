var myAPIKey = '3322945916784e78cda9a5cb8f3ee542';
var previousTemperature;

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
            console.log('(JS) Temperature is ' + temperature);

            // Conditions
            var conditions = json.weather[0].main;
            console.log('(JS) Conditions are ' + conditions);

            if (temperature === previousTemperature) {
                console.log('(JS) Temperature is not changed.');
                return;
            }

            previousTemperature = temperature;

            // Send to Pebble
            Pebble.sendAppMessage(
                { WeatherTemperature: temperature },
                function() {
                    console.log('(JS) Weather info sent to Pebble successfully!');
                },
                function() {
                    console.log('(JS) Error sending weather info to Pebble!');
                }
            )  ;
        }
    );
}

function locationError() {
    console.log('(JS) Error requesting location!');
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
        console.log('(JS) PebbleKit JS ready!');

        // Get location and temperatude
        getLocationAndWeather();

    setInterval(getLocationAndWeather, 10 * 60 * 1000);
    }
);
