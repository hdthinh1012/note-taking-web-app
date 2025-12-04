const cluster = require('node:cluster');
// const numCPUs = require('node:os').availableParallelism();
const numCPUs = 2;
const process = require('node:process');
const runServer = require('./server');
const dotenv = require('dotenv');
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