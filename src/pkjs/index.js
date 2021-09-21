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
    var APIKey = localStorage.getItem("openWeatherMapApiKey") || "";
    var url = 'http://api.openweathermap.org/data/2.5/weather?lat=' +
        pos.coords.latitude + '&lon=' + pos.coords.longitude + '&appid=' + APIKey;
    console.log("(JS) API KEY", APIKey);

    // Send request to OpenWeatherMap
    xhrRequest(url, 'GET',
        function(responseText) {
            try {
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
                    { WeatherTemperature: temperature + '°C' },
                    function() {
                        console.log('(JS) Weather info sent to Pebble successfully!');
                    },
                    function() {
                        console.log('(JS) Error sending weather info to Pebble!');
                    }
                ) ;
            } catch (err) {
                console.log("(JS) Error during parsing data from server");
                Pebble.sendAppMessage({ WeatherTemperature: '' }) ;
            }
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

        // Get location and temperature
        getLocationAndWeather();

    setInterval(getLocationAndWeather, 10 * 60 * 1000);
    }
);

Pebble.addEventListener('showConfiguration', function() {
    // Show config page
    var openWeatherMapApiKey = localStorage.getItem("openWeatherMapApiKey") || "";
    console.log('(JS) Show configuration page', 'localStorageOpenWeatherMapApiKey=' + openWeatherMapApiKey);
    Pebble.openURL('https://kvark85.github.io/Kate3_pebble_watchface/configuration-page/configurations.html?' +
        'version=0.1' +
        '&openWeatherMapApiKey=' + encodeURIComponent(openWeatherMapApiKey));
});

Pebble.addEventListener('webviewclosed', function(e) {
    if (e.response) {
        var configurations = JSON.parse(decodeURIComponent(e.response));
        console.log('(JS) Save configuration', 'openWeatherMapApiKey=' +  configurations.openWeatherMapApiKey);
        localStorage.setItem("openWeatherMapApiKey", configurations.openWeatherMapApiKey);
        getLocationAndWeather();
    }
    else {
        console.log('(JS) Configuration canceled');
    }
});
