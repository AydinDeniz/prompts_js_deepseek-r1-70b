// Client-side code
const socket = io();
const temperatureChart = document.getElementById('temperature-chart');
const humidityChart = document.getElementById('humidity-chart');
const energyChart = document.getElementById('energy-chart');
const deviceControls = document.getElementById('device-controls');

// D3.js setup
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = temperatureChart.clientWidth - margin.left - margin.right;
const height = temperatureChart.clientHeight - margin.top - margin.bottom;

// Temperature chart
const tempSvg = d3.select(temperatureChart)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Humidity chart
const humidSvg = d3.select(humidityChart)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Energy chart
const energySvg = d3.select(energyChart)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Real-time data update
socket.on('sensor-data', (data) => {
    updateCharts(data);
});

// Device control
deviceControls.addEventListener('click', (e) => {
    if (e.target.dataset.device) {
        const deviceId = e.target.dataset.device;
        const action = e.target.dataset.action;
        socket.emit('device-control', { deviceId, action });
    }
});

// Initial data fetch
socket.emit('get-sensor-data');

// Update charts
function updateCharts(data) {
    // Temperature line chart
    const tempLine = d3.line()
        .x(d => d.time)
        .y(d => d.temperature);

    const tempPath = tempSvg.append('path')
        .datum(data.temperatureData)
        .attr('class', 'line')
        .attr('d', tempLine)
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none');

    // Humidity line chart
    const humidLine = d3.line()
        .x(d => d.time)
        .y(d => d.humidity);

    const humidPath = humidSvg.append('path')
        .datum(data.humidityData)
        .attr('class', 'line')
        .attr('d', humidLine)
        .attr('stroke', 'blue')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none');

    // Energy bar chart
    const energyBars = energySvg.selectAll('rect')
        .data(data.energyData)
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (width / data.energyData.length))
        .attr('width', width / data.energyData.length)
        .attr('height', d => d.value)
        .attr('fill', 'green');

    // Add axes and labels
    tempSvg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([0, 24])));
    tempSvg.append('g')
        .call(d3.axisLeft(d3.scaleLinear().domain([0, 40])));
    tempSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .text('Temperature (°C)');

    humidSvg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([0, 24])));
    humidSvg.append('g')
        .call(d3.axisLeft(d3.scaleLinear().domain([0, 100])));
    humidSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .text('Humidity (%)');

    energySvg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(d3.scaleBand().domain(data.energyData.map(d => d.time))));
    energySvg.append('g')
        .call(d3.axisLeft(d3.scaleLinear().domain([0, 1000])));
    energySvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .text('Energy Consumption (kWh)');
}

// Initialize dashboard
socket.on('connect', () => {
    console.log('Connected to smart home server');
    socket.emit('get-sensor-data');
});

// Handle disconnection
socket.on('disconnect', () => {
    console.log('Disconnected from smart home server');
});