import cluster from 'cluster';
import process from 'process';
import fs from 'fs';
import DistributedSemaphore from './distributed-semaphore.js';

const numCPUs = 2;

const filePath = process.argv[2];

console.log("File path for writing:", filePath);

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    // if all child exit, parent exit
    if (Object.keys(cluster.workers).length === 0) {
        console.log(`Primary ${process.pid} exiting as all workers have exited`);
        process.exit(0);
    }
  });
} else {
    console.log(`Worker ${process.pid} started`);
    const semaphore = await DistributedSemaphore.create({
        key: 'sem-test-1'
    });
    acquire_write(semaphore, filePath, getRandChar()).then(() => {
        console.log(`Worker ${process.pid} died`);
        process.exit(0);
    });
}

async function acquire_write(semaphore, filePath, char) {
    await semaphore.acquire();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const content = fs.readFileSync(filePath);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    fs.writeFileSync(filePath, content + char);
    await semaphore.release();
}

function getRandChar() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters.charAt(randomIndex);
}