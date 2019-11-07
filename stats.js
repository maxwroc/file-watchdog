
class Stats {
    constructor(config) {
        this.config = config;

        if (!config.stats) {
            config.stats = config.extensions.reduce((a, ext) => {
                a[ext] = 0;
                return a;
            }, {});
        }

        this.prevStats = { ...config.stats };
    }

    isChanged() {
        return Object.keys(this.config.stats).some(ext => this.prevStats[ext] != this.config.stats[ext])
    }

    record(ext) {
        return this.config.stats;
    }
}