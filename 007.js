class TaskQueue {
    constructor() {
        this.queue = [];
        this.running = 0;
        this.promises = [];
    }

    async addTask(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(task);

            // Cancel any pending tasks if we're adding a new one
            while (this.running > 2 && this.promises.length > 0) {
                this.promises.shift().reject();
            }

            if (this.running < 3) {
                this.running++;
                this.promises.push(resolve);

                // Start the task after a short delay to allow for cancellation
                setTimeout(() => {
                    try {
                        task();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }, 50); // Short delay to allow for task cancellation
            }
        });
    }
}

// Example usage:
const queue = new TaskQueue();

// Add tasks to the queue
queue.addTask(() => {
    console.log('Task 1 started');
    setTimeout(() => {
        console.log('Task 1 completed');
    }, 1000);
});

queue.addTask(() => {
    console.log('Task 2 started');
    setTimeout(() => {
        console.log('Task 2 completed');
    }, 2000);
});

queue.addTask(() => {
    console.log('Task 3 started');
    setTimeout(() => {
        console.log('Task 3 completed');
    }, 3000);
});

// After a short delay, add more tasks
setTimeout(() => {
    console.log('\nAdding more tasks...');

    queue.addTask(() => {
        console.log('Task 4 started');
        setTimeout(() => {
            console.log('Task 4 completed');
        }, 4000);
    });

    // Cancel pending tasks if necessary
    while (queue.promises.length > 3) {
        queue.promises.shift();
    }
}, 1000);