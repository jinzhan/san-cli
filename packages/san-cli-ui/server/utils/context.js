/**
 * @file resolvers的第3个参数
 */
const db = require('../data/db');
const {cwd} = require('../data/runtime');
const pubsub = require('../main/pubsub');

module.exports = () => ({
    db,
    pubsub,
    cwd: cwd.get()
});
