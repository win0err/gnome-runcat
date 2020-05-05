const {
    timeout_add: setTimeout,
    source_remove: clearTimeout,
    PRIORITY_DEFAULT,
} = imports.gi.GLib;

class Timer {
    constructor(fn, interval = 1000, autostart = true) {
        this.callback = fn;
        this.interval = interval;
        this.isStarted = false;
        this.timeout = null;

        if (autostart) {
            this.start();
        }
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
        this.callback();

        this._addTimeout();
    }

    _addTimeout() {
        if (this.isStarted) {
            this.timeout = setTimeout(PRIORITY_DEFAULT, this.interval, () => this._tick());
        }
    }

    _clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
};