/**
 * @file clientAddons connectors
 * @author zttonly
 */
const channels = require('../utils/channels');

class ClientAddons {
    constructor() {
        this.addons = [];
        this.context = null;
    }
    add(options, context) {
        if (this.findOne(options.id)) {
            this.remove(options.id);
        }

        this.addons.push(options);
        context.pubsub.publish(channels.CLIENT_ADDON_ADDED, {
            clientAddonAdded: options
        });
    }
    remove(id) {
        const index = this.addons.findIndex(addon => addon.id === id);
        if (index !== -1) {
            this.addons.splice(index, 1);
        }
    }
    findOne(id) {
        return this.addons.find(addon => addon.id === id);
    }
    list(context) {
        this.context = context;
        return this.addons;
    }
    clear() {
        for (const addon of this.addons) {
            this.remove(addon.id);
        }
    }
    getUrl(addon) {
        // eslint-disable-next-line no-undef
        const endpoint = process.env.SAN_VAR_APP_GRAPHQL_ENDPOINT;
        const baseUrl = endpoint ? endpoint.replace(/ws:\/\/([a-z0-9_-]+:\d+).*/i, 'http://$1') : '';
        return addon.url || `${baseUrl}/_addon/${addon.id}/index.js`;
    }
}

module.exports = new ClientAddons();
