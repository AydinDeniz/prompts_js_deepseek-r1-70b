function dijkstra(graph, startNode, endNode) {
    const distances = {};
    const predecessors = {};
    let priorityQueue = [];

    // Initialize distances and priority queue
    for (const node in graph) {
        distances[node] = Infinity;
        predecessors[node] = null;
    }
    distances[startNode] = 0;
    priorityQueue.push([0, startNode]);

    while (priorityQueue.length > 0) {
        priorityQueue.sort((a, b) => a[0] - b[0]);
        const [currentDistance, currentNode] = priorityQueue.shift();

        if (currentNode === endNode) break;

        if (currentDistance > distances[currentNode]) continue;

        for (const neighbor in graph[currentNode]) {
            const weight = graph[currentNode][neighbor];
            const distance = currentDistance + weight;

            if (distance < distances[neighbor]) {
                distances[neighbor] = distance;
                predecessors[neighbor] = currentNode;
                priorityQueue.push([distance, neighbor]);
            }
        }
    }

    function getPath() {
        const path = [];
        let node = endNode;
        while (node !== null) {
            path.unshift(node);
            node = predecessors[node];
        }
        return path;
    }

    return {
        distance: distances[endNode],
        path: getPath()
    };
}