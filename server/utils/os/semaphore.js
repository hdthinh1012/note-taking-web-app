var sems = {}

class Semaphore {
    constructor(key, max) {
        if (sems[key]) {
            return sems[key];
        }
        this.max = max;
        this.buffer = new SharedArrayBuffer(4);
        this.view = new Uint8Array(this.buffer);
        Atomics.store(this.view, 0, max);
        sems[key] = this;
    }

    async acquire(handler) {
        console.log('4');
        while (true) {
            const value = Atomics.load(this.view, 0);
            if (value === 0) {
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