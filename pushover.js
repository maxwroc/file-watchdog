
const request = require("request");

const notify = (config, msg, title) => {

    if (config.test) {
        console.log(title, msg);
        return true;
    }

    if (!config.pushover || !config.pushover.token || !config.pushover.user) {
        throw new Error("Missing pushover configuration");
    }

    request.post("https://api.pushover.net/1/messages.json", {
            json: {
                token: config.pushover.token,
                user: config.pushover.user,
                message: msg,
                title: title
            }
        },
        (error, res, body) => {
            if (error) {
                console.error("file-watcher", error);
                return;
            }
            console.log(`file-watcher: pushover response statusCode: ${res.statusCode}`);
        }
    );

    return true;
}

exports.notify = notify;