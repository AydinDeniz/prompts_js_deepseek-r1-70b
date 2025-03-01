// Initialize IndexedDB
const db = await idb.open('fitnessDB', 1, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains('activities')) {
        upgradeDb.createObjectStore('activities', { keyPath: 'id', autoIncrement: true });
    }
});

// Function to add activity
async function addActivity(activity) {
    try {
        const tx = db.transaction('activities', 'readwrite');
        const store = tx.objectStore('activities');
        await store.add(activity);
        await tx.done;
        console.log('Activity added successfully');
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

// Function to retrieve all activities
async function getAllActivities() {
    try {
        const tx = db.transaction('activities', 'readonly');
        const store = tx.objectStore('activities');
        const request = store.getAll();
        const activities = await request.onsuccess();
        return activities.target.result;
    } catch (error) {
        console.error('Error retrieving activities:', error);
        return [];
    }
}

// Function to visualize data with Canvas
function visualizeData(activities) {
    const ctx = document.getElementById('fitnessChart').getContext('2d');
    const labels = activities.map(activity => activity.date);
    const stepsData = activities.map(activity => activity.steps || 0);
    const caloriesData = activities.map(activity => activity.calories || 0);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Steps',
                data: stepsData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Calories',
                data: caloriesData,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Fitness Activity'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to sync data with remote database
async function syncData() {
    try {
        const activities = await getAllActivities();
        const response = await fetch('/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activities),
        });

        if (!response.ok) {
            throw new Error('Sync failed');
        }

        console.log('Data synced successfully');
    } catch (error) {
        console.error('Error syncing data:', error);
    }
}

// Event listener for online status
window.addEventListener('online', syncData);

// Initialize the app
window.onload = async () => {
    const activities = await getAllActivities();
    visualizeData(activities);
};

// Example usage
document.getElementById('addActivity').addEventListener('click', async () => {
    const activity = {
        date: new Date().toISOString(),
        steps: 10000,
        calories: 500,
        meals: ['Breakfast', 'Lunch', 'Dinner']
    };
    await addActivity(activity);
    const updatedActivities = await getAllActivities();
    visualizeData(updatedActivities);
});