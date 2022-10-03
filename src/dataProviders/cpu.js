const { Gio } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const { readFile } = Extension.imports.utils;

// eslint-disable-next-line func-names, no-unused-vars, no-var
var createGenerator = async function* () {
    const procStatFile = Gio.File.new_for_path('/proc/stat');

    let prevActive = 0;
    let prevTotal = 0;

    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const procStatContents = await readFile(procStatFile);

        const cpuInfo = procStatContents
            .split('\n')[0].trim()
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

        // eslint-disable-next-line object-curly-newline
        const data = JSON.stringify({ total, active, prevTotal, prevActive });

        let utilization = 100 * ((active - prevActive) / (total - prevTotal));
        if (Number.isNaN(utilization) || !Number.isFinite(utilization)) {
            log(`cpu utilization is ${utilization}, data: ${data}`);

            utilization = 0;
        }

        if (utilization > 100) {
            log(`cpu utilization is ${utilization}, data: ${data}`);

            utilization = 100;
        }

        prevActive = active;
        prevTotal = total;

        yield utilization;
    }
};