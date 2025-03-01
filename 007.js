class TaskQueue {
    constructor(maxConcurrent = 3) {
        this.maxConcurrent = maxConcurrent;
        this.pendingTasks = [];
        this.activeTasks = 0;
    }

    enqueueTask(task) {
        return new Promise((resolve, reject) => {
            this.pendingTasks.push({ task, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        while (this.pendingTasks.length > 0 && this.activeTasks < this.maxConcurrent) {
            const { task, resolve, reject } = this.pendingTasks.shift();
            this.activeTasks++;
            try {
                await task();
                resolve();
            } catch (error) {
                reject(error);
            } finally {
                this.activeTasks--;
                this.processQueue();
            }
        }
    }
}

// Example usage:
const taskQueue = new TaskQueue(3);

// Example tasks
async function task1() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Task 1 completed');
}

async function task2() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Task 2 completed');
}

async function task3() {
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Task 3 completed');
}

async function task4() {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Task 4 completed');
}

// Enqueue tasks
taskQueue.enqueueTask(task1).then(() => console.log('Task 1 done'));
taskQueue.enqueueTask(task2).then(() => console.log('Task 2 done'));
taskQueue.enqueueTask(task3).then(() => console.log('Task 3 done'));
taskQueue.enqueueTask(task4).then(() => console.log('Task 4 done'));