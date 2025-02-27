
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Local storage key for saved cities
        const localStorageKey = 'weatherSearchHistory';

        // Initial weather data structure
        const weatherData = {
            city: '',
            temperature: 0,
            condition: '',
            humidity: 0,
            windSpeed: 0,
            chartData: []
        };

        // Get saved cities from localStorage
        let savedCities = JSON.parse(localStorage.getItem(localStorageKey)) || [];

        // Function to update weather data and chart
        function updateWeatherDisplay(weather) {
            const container = document.getElementById('weather-container');
            container.innerHTML = '';

            const city = document.createElement('h1');
            city.textContent = `${weather.city}, ${getUnitSymbol()}`;
            city.style.color = '#333';
            container.appendChild(city);

            const temperature = document.createElement('p');
            temperature.textContent = `${weather.temperature}${getUnitSymbol()}`;
            temperature.style.color = '#666';
            container.appendChild(temperature);

            const condition = document.createElement('p');
            condition.textContent = weather.condition;
            condition.style.color = '#888';
            container.appendChild(condition);

            const humidity = document.createElement('p');
            humidity.textContent = `Humidity: ${weather.humidity}%`;
            humidity.style.color = '#888';
            container.appendChild(humidity);

            const windSpeed = document.createElement('p');
            windSpeed.textContent = `Wind Speed: ${weather.windSpeed} ${getUnitSymbol()}`;
            windSpeed.style.color = '#888';
            container.appendChild(windSpeed);

            // Create chart
            const chartContainer = document.getElementById('weather-chart');
            chartContainer.innerHTML = '<canvas id="weatherChart"></canvas>';

            const ctx = chartContainer.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
                    datasets: [{
                        label: 'Temperature',
                        data: weather.chartData,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });

            // Clear previous search
            const searchInput = document.getElementById('searchInput');
            searchInput.value = '';
        }

        // Function to get unit symbol based on current display
        function getUnitSymbol() {
            return weatherData.temperature >= 32 ? '°F' : '°C';
        }

        // Function to handle search form submission
        document.getElementById('searchForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const cityInput = document.getElementById('searchInput');
            const city = cityInput.value.trim();

            if (city) {
                // Add city to search history
                savedCities = addCityToHistory(savedCities, city);

                // Fetch weather data
                fetchWeatherData(city);
            }
        });

        // Function to fetch weather data from API
        async function fetchWeatherData(city) {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=YOUR_API_KEY`
                );

                const data = await response.json();

                // Update weather data structure
                weatherData.city = data.name;
                weatherData.temperature = data.main.temp;
                weatherData.condition = data.weather[0].description;
                weatherData.humidity = data.main.humidity;
                weatherData.windSpeed = data.wind.speed * 3.6; // Convert km/h to mph
                weatherData.chartData = [12, 15, 18, 21, 24, 27, 30, 33, 36]; // Sample data
                updateWeatherDisplay(weatherData);
            } catch (error) {
                showError(error.message);
            }
        }

        // Function to add city to history
        function addCityToHistory(history, city) {
            // Remove cities beyond the last 5
            const lastFive = history.slice(-5);

            // Add new city
            const updatedHistory = [...lastFive, city];

            // Save to localStorage
            localStorage.setItem(localStorageKey, JSON.stringify(updatedHistory));

            return updatedHistory;
        }

        // Function to show error messages
        function showError(message) {
            alert(message);
        }

        // Function to format the date
        function formatDate(date) {
            return date.toLocaleString();
        }

        // Function to get current display unit
        function getCurrentUnit() {
            return weatherData.temperature >= 32 ? 'F' : 'C';
        }

        // Function to switch between units
        document.getElementById('unitToggle').addEventListener('click', function() {
            const currentUnit = getCurrentUnit();
            const newUnit = currentUnit === 'F' ? 'C' : 'F';

            // Update temperature and chart
            weatherData.temperature = weatherData.temperature * (newUnit === 'F' ? 9/5 : 5/9) + newUnit === 'F' ? 32 : 0;
            weatherData.chartData = weatherData.chartData.map(value => value * (newUnit === 'F' ? 9/5 : 5/9) + newUnit === 'F' ? 32 : 0);

            // Update display
            const temperatureElement = document.querySelector('p:nth-child(2)');
            temperatureElement.textContent = `${weatherData.temperature}${newUnit}`;

            // Update chart
            Chart.updateOrCreateChart('weatherChart', document.getElementById('weatherChart'));
        });

        // Initialize chart
        Chart.updateOrCreateChart('weatherChart', document.getElementById('weatherChart'));


    <div class="container">
        <h1>Weather Dashboard</h1>

        <form id="searchForm">
            <input type="text" id="searchInput" placeholder="Enter city...">
            <button type="submit">Search</button>
        </form>

        <div class="search-history">
            <h3>Recent Searches</h3>
            <div id="searchHistory">
                <!-- Search history will be dynamically populated -->
            </div>
        </div>

        <div class="weather-container" id="weather-container">
            <!-- Weather data will be dynamically populated -->
        </div>

        <div class="unit-toggle">
            <button id="unitToggle">Switch Units</button>
        </div>
    </div>

    <script>
        // Initialize chart
        const chartContainer = document.getElementById('weather-chart');
        const ctx = chartContainer.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
                datasets: [{
                    label: 'Temperature',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    </script>