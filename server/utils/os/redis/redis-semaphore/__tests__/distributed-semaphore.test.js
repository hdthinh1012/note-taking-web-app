import { initializeRedisClient } from "../../redis";
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// console.log('Running Semaphore Cluster Tests import.meta.url', import.meta.url);
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

describe("Semaphore Cluster", () => {
    beforeAll(() => {
        initializeRedisClient();
        const filePath = path.join(__dirname, "semaphore-test-file.txt");
        fs.writeFileSync(filePath, 'ba');
    }, 3000);

    beforeEach(() => {
        const filePath = path.join(__dirname, "semaphore-test-file.txt");
        fs.writeFileSync(filePath, 'ba');
        const resetEVAL = `redis.call("SET", KEYS[1], "0")`;
        const redisClientPromise = initializeRedisClient();
        redisClientPromise.then(async (redisClient) => {
            await redisClient.eval(
                resetEVAL,
                1,
                'sem-test-1'
            );
            redisClient.disconnect();
        });
    });

    it("should allow multiple processes to safely write to a file using distributed semaphore", async () => {
        // semaphore-cluster.js is in the parent directory (redis-semaphore/), not in __tests__/
        const scriptPath = path.join(__dirname, '..', 'semaphore-cluster.js');
        const testFilePath = path.join(__dirname, 'semaphore-test-file.txt');
        const child = spawn('node', [scriptPath, testFilePath], {
            // execArgv: ['--inspect-brk=9230']
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Capture stdout and stderr for debugging
        child.stdout.on('data', (data) => {
            console.log(`[child stdout]: ${data}`);
        });
        child.stderr.on('data', (data) => {
            console.error(`[child stderr]: ${data}`);
        });

        await new Promise((resolve, reject) => {
            child.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Child process exited with code ${code}`));
                }
            });
        });
        const content = fs.readFileSync(testFilePath, 'utf-8');
        return expect(content.length).toBe(4);
    });

    it("multiple processes to write to a file without using distributed semaphore will face race condition", async () => {
        // semaphore-cluster.js is in the parent directory (redis-semaphore/), not in __tests__/
        const scriptPath = path.join(__dirname, '..', 'non-semaphore-cluster.js');
        const testFilePath = path.join(__dirname, 'semaphore-test-file.txt');
        const child = spawn('node', [scriptPath, testFilePath], {
            // execArgv: ['--inspect-brk=9230']
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Capture stdout and stderr for debugging
        child.stdout.on('data', (data) => {
            console.log(`[child stdout]: ${data}`);
        });
        child.stderr.on('data', (data) => {
            console.error(`[child stderr]: ${data}`);
        });

        await new Promise((resolve, reject) => {
            child.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Child process exited with code ${code}`));
                }
            });
        });
        const content = fs.readFileSync(testFilePath, 'utf-8');
        return expect(content.length).toBe(3);
    });

    afterAll(() => {
        const filePath = path.join(__dirname, "semaphore-test-file.txt");
        fs.unlinkSync(filePath);
    });
}, 2000000);