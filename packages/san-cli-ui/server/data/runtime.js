/**
 * @file runtime存储的临时数据
 * @author jinzhan
 */

const fs = require('fs');
const {error} = require('san-cli-utils/ttyLogger');
const {CWD_CHANGED} = require('../utils/channels');
const {normalizeDir} = require('../utils/fileHelper');

let currentCwd = process.cwd();

// process.cwd()的getter和setter
const cwd = {
    get() {
        return currentCwd;
    },

    set(value, context) {
        value = normalizeDir(value);
        if (!fs.existsSync(value)) {
            return;
        }
        currentCwd = value;
        let isWritable;
        try {
            fs.accessSync(value, fs.constants.W_OK);
            isWritable = true;
        }
        catch (err) {
            isWritable = false;
        }
        context.pubsub.publish(CWD_CHANGED, {
            cwdChanged: {
                path: value,
                isWritable
            }
        });
        try {
            process.chdir(value);
        }
        catch (err) {
            error(`chdir: ${err}`);
        }
    }
};


module.exports = {
    cwd
};
