const { Shell } = imports.gi;

var Cpu = class Cpu {
    constructor() {
        this.lastActive = 0;
        this.lastTotal = 0;

        this.utilization = 0;

        this.refresh();
    }

    refresh() {
        const prosStat = Shell.get_file_contents_utf8_sync('/proc/stat');
        const cpuInfo = prosStat
            .split('\n')
            .shift()
            .trim()
            .split(/[\s]+/)
            .map(
                n => parseInt(n)
            );

        const [
            ,
            user,
            nice,
            system,
            idle,
            iowait,
            irq,
            softirq,
            steal,
            guest,
        ] = cpuInfo;

        const active = user + system + nice + softirq + steal;
        const total = user + system + nice + softirq + steal + idle + iowait;

        this.utilization = 100 * (active - this.lastActive) / (total - this.lastTotal);

        this.lastActive = active;
        this.lastTotal = total;

        return this.utilization;
    }
}