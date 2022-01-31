const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const MAX_INTERVAL = 0xFFFFFFFF;

// eslint-disable-next-line
var Timer = class Timer {
    constructor(fn, interval = 1000, autostart = true) {
        this.callback = fn;
        this._interval = interval;
        this.isStarted = false;
        this.timeout = null;

        if (autostart) {
            this.start();
        }
    }

    get interval() {
        return this._interval;
    }

    set interval(newInterval) {
        if (newInterval <= 0 || newInterval >= MAX_INTERVAL) {
            throw new RangeError(
                `Interval ${newInterval} is out of range. Interval must be > 0 and < ${MAX_INTERVAL}`,
            );
        }

        this._interval = newInterval;

        return true;
    }

    start() {
        this.isStarted = true;
        this._tick();
    }

    stop() {
        this._clearTimeout();
        this.isStarted = false;
    }

    _tick() {
        this._clearTimeout();

        const shouldTick = !Main.sessionMode.isLocked && !Main.sessionMode.isGreeter;
        if (shouldTick) {
            this.callback();
        }

        this._addTimeout();
    }

    _addTimeout() {
        if (this.isStarted) {
            try {
                this.timeout = Mainloop.timeout_add(this.interval, () => this._tick());
            } catch (e) {
                // eslint-disable-next-line no-undef
                logError(e);
                log(this.interval);
                log(`Should tick: ${!Main.sessionMode.isLocked && !Main.sessionMode.isGreeter}`);
            }
        }
    }

    _clearTimeout() {
        if (this.timeout) {
            Mainloop.source_remove(this.timeout);
            this.timeout = null;
        }
    }
};