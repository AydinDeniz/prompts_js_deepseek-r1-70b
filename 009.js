            function createBarChart(data) {
            const container = d3.select('.chart-container')
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%');

            const margin = { top: 20, right: 30, bottom: 30, left: 40 };
            const width = container.node().width - margin.left - margin.right;
            const height = container.node().height - margin.top - margin.bottom;

            const x = d3.scaleBand()
                .domain(data.map(d => d.category))
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, Math.max(...data.map(d => d.value))])
                .range([height - margin.bottom, margin.top]);

            // Add x-axis
            container.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(${margin.left},${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickSize(5));

            // Add y-axis
            container.append('g')
                .attr('class', 'y-axis')
                .attr('transform', `translate(${margin.left},${margin.top})`)
                .call(d3.axisLeft(y).tickSize(5));

            // Create bars
            container.append('g')
                .selectAll('rect')
                .data(data)
                .enter()
                .append('g')
                .attr('class', 'bar')
                .attr('transform', d => `translate(${x(d.category)}, ${y(0)})`);

            // Create bars and text labels
            container.select('.bars')
                .selectAll('rect')
                .data(data)
                .enter()
                .append('rect')
                .attr('x', d => x(d.category) - width/2)
                .attr('width', width/2)
                .attr('height', d => y(d.value) - y(0))
                .attr('fill', d => d.color || '#4CAF50')
                .attr('opacity', 0)
                .transition()
                .duration(500)
                .attr('opacity', 1);

            // Add text labels
            container.append('g')
                .selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .attr('x', x(d.category) - width/2)
                .attr('y', y(d.value) + 10)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('fill', d => d.color || '#4CAF50');

            // Add tooltip
            const tooltip = d3.select('tooltip')
                .style('opacity', 0);

            // Add hover effect
            container.selectAll('rect')
                .on('mouseover', function(event, d) {
                    const current Tooltip position
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', '.9');
                    tooltip.html(`${d.value}`)
                        .style('left', `${event.pageX - 100}px`)
                        .style('top', `${event.pageY - 80}px`);
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0);
                });

            // Add animation for bars
            container.selectAll('rect')
                .transition()
                .duration(500)
                .attr('opacity', 1);
        }

        function updateBarChart(newData) {
            d3.d3.select('.chart-container')
                .data(newData)
                .call((data) => {
                    // Update bars
                    data.selectAll('rect')
                        .transition()
                        .duration(500)
                        .attr('x', d => x(d.category) - width/2)
                        .attr('width', width/2)
                        .attr('height', d => y(d.value) - y(0))
                        .attr('fill', d => d.color || '#4CAF50')
                        .attr('opacity', 0)
                        .transition()
                        .duration(500)
                        .attr('opacity', 1);

                    // Update text labels
                    data.append('text')
                        .selectAll('text')
                        .data(data)
                        .enter()
                        .append('text')
                        .attr('x', x(d.category) - width/2)
                        .attr('y', y(d.value) + 10)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .style('fill', d => d.color || '#4CAF50');
                });