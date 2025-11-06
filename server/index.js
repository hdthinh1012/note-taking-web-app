const cluster = require('node:cluster');
// const numCPUs = require('node:os').availableParallelism();
const numCPUs = 4;
const process = require('node:process');
const runServer = require('./server');

const { Semaphore } = require('./utils/os/semaphore');

const verifySsoSem = new Semaphore('verify-sso-sem', 1);

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
    }
    cluster.on('message', (worker, message) => {
        if (message === 'acquire-lock') {
            console.log(`Process ${worker.process.pid} requesting lock`);
            verifySsoSem.acquire(() => {
                console.log(`Process ${worker.process.pid} acquired lock`);
                worker.send('lock-acquired');
            });
        } else if (message === 'release-lock') {
            console.log(`Process ${worker.process.pid} releasing lock`);
            verifySsoSem.release();
        }
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    runServer();
    console.log(`Worker ${process.pid} started`);
}