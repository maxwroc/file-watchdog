const { promisify } = require("util");
const { resolve } = require("path");
const checkDiskSpace = require('check-disk-space');
const fs = require("fs");
const notify = require("./pushover").notify;

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const configFile = "./config.json";

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
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res, extensions, cb) : [res];
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

const stats = config.extensions.reduce((a, ext) => {
    a[ext] = 0;
    return a;
}, {});

async function getDiskFreeSpace(config) {
    if (!config.diskUsage) {
        return "";
    }

    const diskStats = await checkDiskSpace('C:/blabla/bla'); /* { free: 12345678, size: 98756432 } */

    return ` ${Math.round(diskStats.free)} MB`
}

const statCollector = (file, ext) => stats[ext] += 1;

const getMessage = () => Object.keys(stats).map(ext => `${ext}: ${stats[ext]}`).join(", ") + getDiskFreeSpace(config);

getFiles(config.directory, config.extensions, statCollector)
    .then(() => notify(config, getMessage(), config.pushover.title))
    .catch(err => console.log(err));




