const { resolve } = require("path");
const fs = require("fs");
const { promisify } = require("util");
const checkDiskSpace = require('check-disk-space');


const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);


const numberWithCommas = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const getDiskFreeSpace = async (config) => {
    if (!config.diskUsage) {
        return "";
    }

    const diskStats = await checkDiskSpace(config.directory); /* { free: 12345678, size: 98756432 } */

    return ` [${numberWithCommas(Math.round(diskStats.free / (1024 * 1024)))} MB free]`
}

const getFiles = async (dir, extensions, cb = null) => {
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

exports.getDiskFreeSpace = getDiskFreeSpace;
exports.getFiles = getFiles;