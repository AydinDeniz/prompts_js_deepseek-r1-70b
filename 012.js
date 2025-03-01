// Function to get weather data
async function getWeather(city) {
    const API_KEY = 'YOUR_API_KEY';
    const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

    try {
        const response = await fetch(`${BASE_URL}weather?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Function to save recent searches
function saveRecentSearches(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    recentSearches.unshift(city);
    if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(0, 5);
    }
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

// Function to display recent searches
function displayRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    const searchHistory = document.getElementById('searchHistory');
    searchHistory.innerHTML = recentSearches.map(city => 
        `<div class="search-item">${city}</div>`
    ).join('');
}

// Function to create weather chart
function createWeatherChart(data) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Temperature', 'Feels Like', 'Humidity', 'Wind Speed'],
            datasets: [{
                label: 'Weather Data',
                data: [data.main.temp, data.main.feels_like, data.main.humidity, data.wind.speed],
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Main function to handle user input
async function handleWeatherSearch() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    const weatherData = await getWeather(city);
    
    if (!weatherData) {
        alert('Failed to retrieve weather data');
        return;
    }

    // Display weather data
    const weatherDisplay = document.getElementById('weatherDisplay');
    weatherDisplay.innerHTML = `
        <h2>Weather in ${weatherData.name}</h2>
        <p>Temperature: ${weatherData.main.temp}°C</p>
        <p>Feels Like: ${weatherData.main.feels_like}°C</p>
        <p>Humidity: ${weatherData.main.humidity}%</p>
        <p>Wind Speed: ${weatherData.wind.speed} m/s</p>
    `;

    // Create weather chart
    createWeatherChart(weatherData);

    // Save to recent searches
    saveRecentSearches(city);
    displayRecentSearches();
}

// Event listener for Enter key
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleWeatherSearch();
    }
});

// Initial display of recent searches
displayRecentSearches();