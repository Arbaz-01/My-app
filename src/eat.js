import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


function MapUpdater({ coords }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 12, { duration: 3.0 }); 
  }, [coords, map]);
  return null;
}

function SmoothMarker({ position }) {
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosition((prevPosition) => {
        const newLat = (prevPosition[0] + position[0]) / 2;
        const newLng = (prevPosition[1] + position[1]) / 2;
        if (Math.abs(newLat - position[0]) < 0.001 && Math.abs(newLng - position[1]) < 0.001) {
          clearInterval(interval);
        }
        return [newLat, newLng];
      });
    }, 50);
    return () => clearInterval(interval);
  }, [position]);

  return <Marker position={currentPosition}></Marker>;
}

export default function Weather() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [position, setPosition] = useState([51.505, -0.09]); 
  const [loading, setLoading] = useState(false); 
  const [cityName, setCityName] = useState(''); 

  const handleCityChange = (event) => {
    setCity(event.target.value);
  };

  const fetchWeather = async () => {
    try {
      setLoading(true); 
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.REACT_APP_TMDB_API_KEY}&units=metric`
      );
      setWeather(response.data);

      const { coord, name } = response.data;
      setCityName(name); 
      setPosition([coord.lat, coord.lon]);
      setLoading(false); 
    } catch (error) {
      console.error('Failed to fetch weather data', error.response ? error.response.data : error.message);
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (city.trim()) {
      setCityName(city); 
      fetchWeather();
    }
  };

  return (
    <div className="app-container">
      <MapContainer center={position} zoom={12} className="map-container">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater coords={position} />
        <SmoothMarker position={position} />
      </MapContainer>

      <div className="info-container">
        <div className="search-box">
          <input
            type="text"
            className="city-input"
            placeholder="Enter city name"
            onChange={handleCityChange}
          />
          <button className="search-button" onClick={handleClick}>
            Get Weather
          </button>
        </div>

        {cityName && !weather && (
          <p className="city-placeholder">Searching for {cityName}...</p>
        )}

        {loading && <p>Loading...</p>} 

        {weather && !loading && (
  <div className="weather-info">
    <h2>
      City: <span className="city-name">{weather.name}</span>
    </h2>
    <h2>Temperature: {weather.main.temp}°C</h2>
    <h2>Humidity: {weather.main.humidity}%</h2>
    <h2>Weather: {weather.weather[0].description}</h2>
  </div>
)}

      </div>
    </div>
  );
}
