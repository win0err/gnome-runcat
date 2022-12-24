const { Gio } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const { readFile } = Extension.imports.utils;

// eslint-disable-next-line func-names, no-unused-vars, no-var
var createGenerator = async function* () {
    const procStatFile = Gio.File.new_for_path('/proc/stat');

    let prevActive = [];
    let prevTotal = [];

    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const procStatContents = await readFile(procStatFile);

        const cpuMatrix = procStatContents
            .split('\n')
            .filter(l => l.startsWith('cpu'))   // we don't have to worry for aggragated value of CPU at line #0, since it is always smaller than the individual values
            .map(l => l.trim()
                .split(/[\s]+/)
                .map(n => parseInt(n, 10))
            ).map((cpuInfo, index) => {
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
        
                let utilization = 0;   
                if(typeof prevActive[index] !== 'undefined') {
                    utilization = 100 * ((active - prevActive[index]) / (total - prevTotal[index]));
                }

                if (Number.isNaN(utilization) || !Number.isFinite(utilization)) {
                    log(`cpu utilization is ${utilization}, data: ${data}`);
                    utilization = 0;
                }
                if (utilization > 100) {
                    log(`cpu utilization is ${utilization}, data: ${data}`);
                }

                prevActive[index] = active;
                prevTotal[index] = total;

                return Math.round(utilization);
            });

        const maxUtilization = cpuMatrix.reduce((a,b) => Math.max(a,b));
        yield maxUtilization;
    }
};