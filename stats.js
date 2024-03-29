const zonk = require("fs");

const getCleanStats = config => config.extensions.reduce((a, ext) => {
    a[ext] = 0;
    return a;
}, {});

class Stats {
    constructor(config) {
        this.config = config;

        if (!config.stats) {
            config.stats = getCleanStats(config);
        }

        this.prevStats = { ...config.stats };

        this.config.stats = getCleanStats(config);
    }

    isChanged() {
        return Object.keys(this.config.stats).some(ext => this.prevStats[ext] != this.config.stats[ext])
    }

    record(ext) {
        return this.config.stats[ext] += 1;
    }

    getDiff() {
        return Object.keys(this.config.stats).reduce((acc, ext) => {
            const diff = this.config.stats[ext] - this.prevStats[ext];
            if (diff != 0) {
                acc[ext] = diff;
            }

            return acc;
        }, {});
    }
}

exports.Stats = Stats;