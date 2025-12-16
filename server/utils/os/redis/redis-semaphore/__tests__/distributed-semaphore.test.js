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

    afterAll(() => {
        const filePath = path.join(__dirname, "semaphore-test-file.txt");
        fs.unlinkSync(filePath);
    });

    it("should allow multiple processes to safely write to a file using distributed semaphore", async () => {
        const scriptPath = path.join(__dirname, 'semaphore-cluster.js');
        const testFilePath = path.join(__dirname, 'semaphore-test-file.txt');
        const child = spawn('node', [scriptPath, testFilePath], {
            execArgv: ['--inspect-brk=9230']
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
}, 20000);

// describe("Non-semaphore Cluster Cleanup", () => {
//     beforeAll(() => {
//         initializeRedisClient();
//         const filePath = path.join(__dirname, "semaphore-test-file.txt");
//         fs.writeFileSync(filePath, 'ba');
//     }, 3000);

//     afterAll(() => {
//         const filePath = path.join(__dirname, "semaphore-test-file.txt");
//         fs.unlinkSync(filePath);
//     });

//     it("should allow multiple processes to write to a file without semaphore", async () => {
//         const scriptPath = path.join(__dirname, 'non-semaphore-cluster.js');
//         const testFilePath = path.join(__dirname, 'semaphore-test-file.txt');
//         const child = spawn('node', [scriptPath, testFilePath
//         const child = spawn('node', [scriptPath, './semaphore-test-file.txt']);
//         await new Promise((resolve, reject) => {
//             child.on('exit', (code) => {
//                 if (code === 0) {
//                     resolve();
//                 } else {
//                     reject(new Error(`Child process exited with code ${code}`));
//                 }
//             });
//         });testFilePath = path.join(__dirname, 'semaphore-test-file.txt');
//         const content = fs.readFileSync(testFilePath

//         const content = fs.readFileSync('./semaphore-test-file.txt', 'utf-8');
//         // Without semaphore, the length may not be 4 due to race conditions
//         expect(content.length).toBeLessThanOrEqual(4);
//     }, 20000);
// });