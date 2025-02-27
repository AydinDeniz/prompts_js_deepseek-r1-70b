// Initialize D3.js
        let svg, chart;
        let width = 800, height = 300;
        let margin = { top: 20, right: 40, bottom: 20, left: 40 };

        // Configure D3.js charts
        function initCharts() {
            // Temperature Chart
            const tempChart = createLineChart("#temperature-chart", 
                "Temperature (°C)", 25);
            
            // Humidity Chart
            const humidChart = createLineChart("#humidity-chart", 
                "Humidity (%)", 65);
            
            // Energy Chart
            const energyChart = createLineChart("#energy-chart", 
                "Energy (kWh)", 2.5);
        }

        function createLineChart(containerId, title, value) {
            const svg = d3.select(containerId)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Add axes
            const x = d3.axisBottom().tickSize(5);
            const y = d3.axisLeft().tickSize(5);

            svg.append("g").attr("grid").append("g").attr("grid").append("g");
            
            // Add title
            svg.append("text")
                .attr("x", margin.left + width/2)
                .attr("y", margin.top)
                .attr("text-anchor", "middle")
                .style("text-anchor", "middle")
                .text(title);

            // Create chart
            const chart = svg.append("g")
                .attr("fill", "none")
                .attr("stroke", "#4CAF50")
                .attr("stroke-width", 2);

            return chart;
        }

        // Initialize charts
        initCharts();

        // WebSocket initialization
        const socket = io();

        // Update display values
        function updateDisplay(value, id) {
            const display = document.getElementById(id);
            display.textContent = value;
        }

        // Update chart data
        function updateChartData(chart, data) {
            chart.selectAll("line")
                .data(data)
                .enter().append("line")
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .attr("stroke", "#4CAF50")
                .attr("stroke-width", 2);
        }

        // Handle WebSocket events
        socket.on('update', (data) => {
            // Update display values
            updateDisplay(data.temperature, 'temperature-display');
            updateDisplay(data.humidity, 'humidity-display');
            updateDisplay(data.energy, 'energy-display');

            // Update chart data
            const tempChart = d3.select("#temperature-chart g");
            const tempData = data.temperatureHistory;
            updateChartData(tempChart, tempData);

            const humidChart = d3.select("#humidity-chart g");
            const humidData = data.humidityHistory;
            updateChartData(humidChart, humidData);

            const energyChart = d3.select("#energy-chart g");
            const energyData = data.energyHistory;
            updateChartData(energyChart, energyData);
        });

        // Handle button clicks
        document.getElementById('heatingOnBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'heating', state: true });
            document.getElementById('heatingOnBtn').classList.toggle('active');
        });

        document.getElementById('coolingOffBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'cooling', state: false });
            document.getElementById('coolingOffBtn').classList.toggle('active');
        });