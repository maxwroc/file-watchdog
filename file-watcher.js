const { promisify } = require("util");
const { resolve } = require("path");
const checkDiskSpace = require('check-disk-space');
const fs = require("fs");
const notify = require("./pushover").notify;

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
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

async function getFiles(dir, extensions, cb = null) {
    const items = await readdir(dir);
    const files = await Promise.all(items.map(async (item) => {
        const itemPath = resolve(dir, item);
        return (await stat(itemPath)).isDirectory() ? getFiles(itemPath, extensions, cb) : [itemPath];
    }));

    return files.reduce(
        (a, files) => a.concat(
            files.filter(f => extensions.some(ext => {
                const matched = f.endsWith("." + ext);
                matched && cb && cb(f, ext);
                return matched;
            }))
        ),
        []
    );
}



const numberWithCommas = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

async function getDiskFreeSpace(config) {
    if (!config.diskUsage) {
        return "";
    }

    const diskStats = await checkDiskSpace(config.directory); /* { free: 12345678, size: 98756432 } */

    return ` [${numberWithCommas(Math.round(diskStats.free / (1024 * 1024)))} MB free]`
}

const statCollector = (file, ext) => config.stats[ext] += 1;

const getMessage = async () => {
    if (this) {

    }
    return Object.keys(config.stats).map(ext => `${ext}: ${config.stats[ext]}`).join(", ") + await getDiskFreeSpace(config);
}


getFiles(config.directory, config.extensions, statCollector)
    .then(files => getMessage())
    .then(msg => msg && notify(config, msg, config.pushover.title))
    .then(shouldUpdate => shouldUpdate && writeFile(configFile, JSON.stringify(config, null, 2)))
    .catch(err => console.log(err));





