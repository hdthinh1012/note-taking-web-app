import cluster from 'node:cluster';
// import { availableParallelism } from 'node:os';
// const numCPUs = availableParallelism();
const numCPUs = 2;
import process from 'node:process';
import runServer from './server.js';
import dotenv from 'dotenv';
dotenv.config();

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    runServer();
    console.log(`Worker ${process.pid} started`);
}