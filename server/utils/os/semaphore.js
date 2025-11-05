var sems = {}

class Semaphore {
    constructor(key, max) {
        if (sems[key]) {
            return sems[key];
        }
        this.max = max;
        this.buffer = new SharedArrayBuffer(4);
        this.view = new Int32Array(this.buffer);
        Atomics.store(this.view, 0, max);
        sems[key] = this;
    }

    acquire(handler) {
        while (true) {
            const value = Atomics.load(this.view, 0);
            if (value === 0) {
                console.log('Semaphore is full, waiting...');
                Atomics.wait(this.view, 0, 0);
                continue;
            }
            if (Atomics.compareExchange(this.view, 0, value, value - 1) === value) {
                handler();
                break;
            }
        }
    }

    release() {
        Atomics.add(this.view, 0, 1);
        Atomics.notify(this.view, 0);
    }
}

module.exports = { Semaphore };