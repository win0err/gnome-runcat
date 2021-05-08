const { Gio } = imports.gi;
const ByteArray = imports.byteArray;

// eslint-disable-next-line
var Cpu = class Cpu {
    constructor() {
        this.lastActive = 0;
        this.lastTotal = 0;

        this.utilization = 0;

        this.procStatFile = Gio.File.new_for_path('/proc/stat');

        this.refresh();
    }

    refresh() {
        let utilization = 0;

        try {
            const [success, contents] = this.procStatFile.load_contents(null);
            if (!success) {
                throw new Error('Can\'t load contents of stat file');
            }

            const cpuInfo = ByteArray.toString(contents)
                .split('\n')
                .shift()
                .trim()
                .split(/[\s]+/)
                .map(n => parseInt(n, 10));

            const [
                , // eslint-disable-line
                user,
                nice,
                system,
                idle,
                iowait,
                irq, // eslint-disable-line
                softirq,
                steal,
                guest, // eslint-disable-line
            ] = cpuInfo;

            const active = user + system + nice + softirq + steal;
            const total = user + system + nice + softirq + steal + idle + iowait;

            utilization = 100 * ((active - this.lastActive) / (total - this.lastTotal));

            this.lastActive = active;
            this.lastTotal = total;
        } catch (e) {
            logError(e, 'RuncatExtensionError'); // eslint-disable-line no-undef
        } finally {
            this.utilization = utilization;
        }

        return this.utilization;
    }
};