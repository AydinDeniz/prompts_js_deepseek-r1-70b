function dijkstra(graph, start, end) {
    const distances = {};
    const predecessors = {};

    // Initialize distances to infinity
    for (let node in graph) {
        distances[node] = Infinity;
    }
    distances[start] = 0;

    // Initialize predecessors
    for (let node in graph) {
        predecessors[node] = null;
    }

    // Priority queue: [distance, node]
    const priorityQueue = [];
    priorityQueue.push([0, start]);

    while (priorityQueue.length > 0) {
        let [currentDistance, currentNode] = priorityQueue.shift();

        // If we've already found a better path, skip this node
        if (currentDistance > distances[currentNode]) {
            continue;
        }

        // If we've reached the end node, reconstruct the path
        if (currentNode === end) {
            let path = [];
            let current = end;
            while (current !== null) {
                path.push(current);
                current = predecessors[current];
            }
            path.reverse();
            return { distance: distances[end], path: path };
        }

        // Explore neighbors
        for (let neighbor in graph[currentNode]) {
            const weight = graph[currentNode][neighbor];
            const tentativeDistance = currentDistance + weight;

            if (tentativeDistance < distances[neighbor]) {
                distances[neighbor] = tentativeDistance;
                predecessors[neighbor] = currentNode;
                priorityQueue.push([tentativeDistance, neighbor]);
            }
        }
    }

    // If end node is unreachable
    return { distance: null, path: null };
}