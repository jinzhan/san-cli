const {cwd} = require('../data/runtime');
const views = require('../connectors/views');
const plugins = require('../connectors/plugins');

module.exports = {
    getViews(context) {
        return views.getViews(context);
    },

    open(id, context) {
        const view = views.open(id);
        plugins.callHook({
            id: 'viewOpen',
            args: [{
                view,
                cwd: cwd.get()
            }],
            file: cwd.get()
        }, context);
        return true;
    }
};
