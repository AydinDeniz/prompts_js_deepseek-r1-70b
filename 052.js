// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^0.21.1",
    "moment": "^2.29.1",
    "chart.js": "^3.7.1",
    "geolib": "^3.3.1"
  }
}

// Weather API setup (api.js)
const axios = require('axios');

const weatherApi = 'https://api.openweathermap.org/data/2.5/';
const apiKey = 'YOUR_API_KEY';

async function getWeather(location) {
  try {
    const response = await axios.get(`${weatherApi}weather?q=${location}&units=metric&appid=${apiKey}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

async function getForecast(location) {
  try {
    const response = await axios.get(`${weatherApi}forecast?q=${location}&units=metric&appid=${apiKey}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    return null;
  }
}

async function getHistoricalData(location, date) {
  try {
    const response = await axios.get(`${weatherApi}onecall/timemachine?lat=${location.lat}&lon=${location.lon}&dt=${date}&units=metric&appid=${apiKey}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

// Geolocation (geolocation.js)
const geolib = require('geolib');

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(geolib.getCoordinatesFromLatLng(position.coords.latitude, position.coords.longitude)),
      error => reject(error)
    );
  });
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

function WeatherDashboard() {
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState({});
  const [forecast, setForecast] = useState([]);
  const [historicalData, setHistoricalData] = useState({});

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const currentWeather = await getWeather(location);
        const currentForecast = await getForecast(location);
        setWeather(currentWeather);
        setForecast(currentForecast.list);
        
        // Get historical data for the past week
        const dates = Array.from({ length: 7 }, (_, i) => moment().subtract(i, 'days').unix());
        const historical = await Promise.all(dates.map(date => getHistoricalData(currentWeather.coord, date)));
        setHistoricalData(historical.reduce((acc, data, index) => ({ ...acc, [dates[index]]: data }), {}));
      } catch (error) {
        console.error('Error loading weather data:', error);
      }
    };

    if (location) {
      loadWeather();
    }
  }, [location]);

  const handleLocationChange = async (e) => {
    setLocation(e.target.value);
  };

  const chartData = {
    labels: Object.keys(historicalData).map(date => moment.unix(date).format('MMM D')),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: Object.values(historicalData).map(data => data.current.temp),
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }
    ]
  };

  return (
    <div>
      <h1>Weather Forecast Dashboard</h1>
      <div className="location-search">
        <input
          type="text"
          value={location}
          onChange={handleLocationChange}
          placeholder="Enter location..."
        />
      </div>
      <div className="current-weather">
        <h2>Current Weather</h2>
        <p>Temperature: {weather.main?.temp}°C</p>
        <p>Condition: {weather.weather?.[0].description}</p>
      </div>
      <div className="forecast">
        <h2>Hourly Forecast</h2>
        <div className="forecast-list">
          {forecast.map((data, index) => (
            <div key={index} className="forecast-item">
              <p>{moment(data.dt * 1000).format('HH:mm')}</p>
              <p>{data.main.temp}°C</p>
              <p>{data.weather[0].description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="historical-data">
        <h2>Historical Temperature Data</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default WeatherDashboard;