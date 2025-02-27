// IndexedDB database setup
const db = indexedDB.open('fitnessTrackerDB', 2);

// Define interfaces for database storage
interface Activity {
    id: number;
    type: 'steps' | 'workout' | 'meal';
    data: Record<string, any>;
    timestamp: string;
}

interface StepData {
    steps: number;
    distance: number;
}

interface WorkoutData {
    type: string;
    duration: number;
    caloriesBurned: number;
}

interface MealData {
    food: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

class FitnessTracker {
    static instance: FitnessTracker;

    constructor() {
        this.initializeDB();
        this.loadActivities();
    }

    static getInstance(): FitnessTracker {
        if (!FitnessTracker.instance) {
            FitnessTracker.instance = new FitnessTracker();
        }
        return FitnessTracker.instance;
    }

    initializeDB() {
        const db = indexedDB.open('fitnessTrackerDB', 2);

        db.on('success', function(event) {
            if (event.target.result) {
                FitnessTracker.getInstance().loadActivities();
            }
        });

        db.on('error', function(event) {
            console.error('Database error:', event);
        });
    }

    async loadActivities() {
        try {
            // Load activities from IndexedDB
            const activities = [];
            const tx = db.transaction('read', ['activities'], function(store, idx) {
                const result = store.getAll();
                activities.push(...result);
            });

            this.activities = activities;
            this.updateCharts();
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    async saveActivity(activity: Activity) {
        try {
            const tx = db.transaction('write', ['activities'], function(store, idx) {
                const newActivity: Activity = {
                    ...activity,
                    id: Date.now()
                };
                store.put([newActivity]);
            });

            this.activities.push(activity);
            this.updateCharts();
            return { success: true };
        } catch (error) {
            console.error('Error saving activity:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteActivity(id: number) {
        try {
            const tx = db.transaction('write', ['activities'], function(store, idx) {
                store.delete(id);
            });

            const index = this.activities.findIndex(activity => activity.id === id);
            if (index !== -1) {
                this.activities.splice(index, 1);
            }
            this.updateCharts();
            return { success: true };
        } catch (error) {
            console.error('Error deleting activity:', error);
            return { success: false, error: error.message };
        }
    }

    async syncWithRemoteDB() {
        try {
            const response = await fetch('https://your-remote-database-endpoint/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lastSync: new Date().toISOString()
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.importRemoteData(data);
            } else {
                throw new Error('Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    async importRemoteData(remoteData: any) {
        try {
            const tx = db.transaction('write', ['activities'], function(store, idx) {
                for (const activity of remoteData) {
                    store.put([activity]);
                }
            });

            console.log('Imported remote data:', remoteData.length);
        } catch (error) {
            console.error('Import error:', error);
        }
    }

    updateCharts() {
        const container = document.getElementById('charts-container');
        container.innerHTML = '';

        // Steps chart
        this.createChart('steps', document.getElementById('stepsChart') as HTMLCanvasElement, {
            type: 'line',
            data: {
                labels: this.activities
                    .filter(activity => activity.type === 'steps')
                    .map(activity => activity.timestamp),
                datasets: [{
                    label: 'Steps',
                    data: this.activities
                        .filter(activity => activity.type === 'steps')
                        .map(activity => activity.data.steps),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            }
        });

        // Workout chart
        this.createChart('workouts', document.getElementById('workoutsChart') as HTMLCanvasElement, {
            type: 'bar',
            data: {
                labels: this.activities
                    .filter(activity => activity.type === 'workout')
                    .map(activity => activity.timestamp),
                datasets: [{
                    label: 'Workouts',
                    data: this.activities
                        .filter(activity => activity.type === 'workout')
                        .map(activity => activity.data.duration),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            }
        });

        // Meal chart
        this.createChart('meals', document.getElementById('mealsChart') as HTMLCanvasElement, {
            type: 'pie',
            data: {
                labels: this.activities
                    .filter(activity => activity.type === 'meal')
                    .map(activity => activity.data.food),
                datasets: [{
                    label: 'Calories',
                    data: this.activities
                        .filter(activity => activity.type === 'meal')
                        .map(activity => activity.data.calories),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }]
            }
        });
    }

    createChart(type: string, canvas: HTMLCanvasElement, chartOptions: any) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        switch (type) {
            case 'steps':
                this.drawStepsChart(ctx);
                break;
            case 'workouts':
                this.drawWorkoutsChart(ctx);
                break;
            case 'meals':
                this.drawMealsChart(ctx);
                break;
        }

        ctx.commit();
        chartOptions.plugins?.legend?.render();
        chartOptions.plugins?.title?.render();
    }

    drawStepsChart(ctx: CanvasRenderingContext2D) {
        const chart = new Chart(ctx, thisActivitiesChartOptionsForSteps());
    }

    drawWorkoutsChart(ctx: CanvasRenderingContext2D) {
        const chart = new Chart(ctx, thisActivitiesChartOptionsForWorkouts());
    }

    drawMealsChart(ctx: CanvasRenderingContext2D) {
        const chart = new Chart(ctx, thisActivitiesChartOptionsForMeals());
    }

    thisActivitiesChartOptionsForSteps() {
        return {
            type: 'line',
            data: {
                labels: this.activities
                    .filter(activity => activity.type === 'steps')
                    .map(activity => activity.timestamp),
                datasets: [{
                    label: 'Steps',
                    data: this.activities
                        .filter(activity => activity.type === 'steps')
                        .map(activity => activity.data.steps),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            }
        };
    }

    thisActivitiesChartOptionsForWorkouts() {
        return {
            type: 'bar',
            data: {
                labels: this.activities
                    .filter(activity => activity.type === 'workout')
                    .map(activity => activity.timestamp),
                datasets: [{
                    label: 'Workouts',
                    data: this.activities
                        .filter(activity => activity.type === 'workout')
                        .map(activity => activity.data.duration),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            }
        };
    }

    thisActivitiesChartOptionsForMeals() {
        return {
            type: 'pie',
            data: {
                labels: this.activities
                    .filter(activity => activity.type === 'meal')
                    .map(activity => activity.data.food),
                datasets: [{
                    label: 'Calories',
                    data: this.activities
                        .filter(activity => activity.type === 'meal')
                        .map(activity => activity.data.calories),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }]
            }
        };
    }
}

// Initialize the fitness tracker
const fitnessTracker = FitnessTracker.getInstance();
fitnessTracker.loadActivities();

// Event listeners
document.getElementById('saveSteps').addEventListener('click', async function() {
    const steps = document.getElementById('steps').value;
    const distance = document.getElementById('distance').value;

    const activity = {
        type: 'steps',
        data: {
            steps: parseInt(steps),
            distance: parseFloat(distance)
        },
        timestamp: new Date().toISOString()
    };

    const result = await fitnessTracker.saveActivity(activity);
    if (result.success) {
        alert('Steps saved successfully!');
    } else {
        alert(result.error);
    }
});

document.getElementById('saveWorkout').addEventListener('click', async function() {
    const type = document.getElementById('workoutType').value;
    const duration = document.getElementById('duration').value;
    const calories = document.getElementById('calories').value;

    const activity = {
        type: 'workout',
        data: {
            type: type,
            duration: parseFloat(duration),
            caloriesBurned: parseFloat(calories)
        },
        timestamp: new Date().toISOString()
    };

    const result = await fitnessTracker.saveActivity(activity);
    if (result.success) {
        alert('Workout saved successfully!');
    } else {
        alert(result.error);
    }
});

document.getElementById('saveMeal').addEventListener('click', async function() {
    const food = document.getElementById('food').value;
    const calories = document.getElementById('calories').value;
    const protein = document.getElementById('protein').value;
    const carbs = document.getElementById('carbs').value;
    const fat = document.getElementById('fat').value;

    const activity = {
        type: 'meal',
        data: {
            food: food,
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbs: parseFloat(carbs),
            fat: parseFloat(fat)
        },
        timestamp: new Date().toISOString()
    };

    const result = await fitnessTracker.saveActivity(activity);
    if (result.success) {
        alert('Meal saved successfully!');
    } else {
        alert(result.error);
    }
});

document.getElementById('sync').addEventListener('click', async function() {
    await fitnessTracker.syncWithRemoteDB();
    alert('Data synced successfully!');
});

document.getElementById('deleteActivity').addEventListener('click', async function() {
    const activityId = document.getElementById('activityId').value;
    const result = await fitnessTracker.deleteActivity(activityId);
    if (result.success) {
        alert('Activity deleted successfully!');
    } else {
        alert(result.error);
    }
});