function createBarChart(selector, data) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = document.querySelector(selector).clientWidth;
    const height = 500;
    const chart = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, width - margin.left - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height - margin.top - margin.bottom, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    chart.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '-.2em')
        .style('transform', 'rotate(-90deg)');

    chart.append('g')
        .call(yAxis);

    chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .text('Value');

    chart.append('text')
        .attr('x', width/2)
        .attr('y', height - margin.bottom + 20)
        .style('text-anchor', 'middle')
        .text('Category');

    const bars = chart.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.category))
        .attr('width', xScale.bandwidth())
        .attr('y', height - margin.bottom)
        .attr('height', 0)
        .transition()
        .duration(1000)
        .attr('y', d => height - margin.bottom - yScale(d.value))
        .attr('height', d => yScale(d.value));

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', '#f0f0f0')
        .style('padding', '5px')
        .style('border-radius', '5px');

    bars.on('mouseover', function(d) {
        d3.select(this).style('opacity', 0.8);
        tooltip.style('visibility', 'visible')
            .style('top', (d3.event.pageY + 10) + 'px')
            .style('left', (d3.event.pageX + 10) + 'px')
            .html(`Category: ${d.category}<br>Value: ${d.value}`);
    })
    .on('mouseout', function(d) {
        d3.select(this).style('opacity', 1);
        tooltip.style('visibility', 'hidden');
    });

    return chart;
}

// Example usage:
const data = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 15 },
    { category: 'D', value: 25 }
];

const chart = createBarChart('#chart', data);

// Update chart with new data
function updateChart(newData) {
    chart.selectAll('rect')
        .data(newData)
        .transition()
        .duration(1000)
        .attr('x', d => xScale(d.category))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.value))
        .attr('height', d => height - yScale(d.value));
}