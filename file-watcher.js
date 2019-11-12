
const { promisify } = require("util");
const { resolve } = require("path");
const fs = require("fs");

const { getDiskFreeSpace, getFiles } = require("./utils");
const notify = require("./pushover").notify;
const { Stats } = require("./stats");

const writeFile = promisify(fs.writeFile);


const configFile = resolve(__dirname, "config.json");
const userConfig = fs.existsSync(configFile) ? require(configFile) : {};

const config = {
    directory: "/mnt/",
    extensions: ["jpg", "mp4"],
    diskUsage: false,
    ...userConfig,
    pushover: {
        user: null,
        token: null,
        title: "File watchdog",
        ...(userConfig.pushover ? userConfig.pushover : {})
    },
}

const stats = new Stats(config);

const getMessage = async () => {
    if (!stats.isChanged()) {
        return;
    }

    const diff = stats.getDiff();
    return Object.keys(diff).map(ext => `${ext}: ${diff[ext]}`).join(", ") + await getDiskFreeSpace(config);
}


getFiles(config.directory, config.extensions, (file, ext) => stats.record(ext))
    .then(files => getMessage())
    .then(msg => msg && notify(config, msg, config.pushover.title))
    .then(shouldUpdate => shouldUpdate && writeFile(configFile, JSON.stringify(config, null, 2)))
    .catch(err => console.log(err));





