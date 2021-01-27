/**
 * @file plugins
 * @author jinzhan, zttonly
 */

const {cwd} = require('../data/runtime');
const {readPackage} = require('../utils/fileHelper');
const {reloadModule} = require('../utils/module');
const {isPlugin, getPluginLink} = require('../utils/plugin');
const {getDebugLogger} = require('san-cli-utils/ttyLogger');
const debug = getDebugLogger('ui:plugins');
const SAN_CLI = 'san-cli';

class Plugins {
    constructor() {
        this.packageStore = new Map();
        this.pluginsStore = new Map();
    }

    getPlugins(file) {
        const plugins = this.pluginsStore.get(file);
        if (!plugins) {
            return [];
        }
        return plugins;
    }

    runPluginApi(id, pluginApi, context, filename = 'ui') {
        const name = filename !== 'ui' ? `${id}/${filename}` : id;
        let module;
        try {
            let p = id.indexOf('/') === 0 ? `${id}/${filename}` : `${pluginApi.cwd}/node_modules/${id}/${filename}`;
            module = reloadModule(p);
        }
        catch (e) {
            // debug(e);
        }

        if (module) {
            if (typeof module !== 'function') {
                debug('ERROR while loading plugin API: no function exported, for', name, pluginApi.cwd);
            }
            else {
                pluginApi.pluginId = id;
                try {
                    const viewNum = pluginApi.viewPlugin ? pluginApi.viewPlugin.views.length : 0;
                    const widgetNum = pluginApi.widgetPlugin ? pluginApi.widgetPlugin.widgets.length : 0;
                    module(pluginApi);
                    // 如果新增了视图
                    if (pluginApi.viewPlugin && pluginApi.viewPlugin.views.length > viewNum) {
                        for (let i = viewNum; i < pluginApi.viewPlugin.views.length; i++) {
                            pluginApi.viewPlugin.views[i].pkgName = id;
                        }
                    }
                    // 如果新增了部件，且不是内置部件
                    if (widgetNum !== 0 && pluginApi.widgetPlugin.widgets.length > widgetNum) {
                        for (let i = widgetNum; i < pluginApi.widgetPlugin.widgets.length; i++) {
                            pluginApi.widgetPlugin.widgets[i].pkgName = id;
                        }
                    }

                    debug('Plugin API loaded for', name, pluginApi.cwd);
                }
                catch (e) {
                    debug(`ERROR while loading plugin API for ${name}:`, e);
                }
                pluginApi.pluginId = null;
            }
        }
    }

    findPlugins(deps, file) {
        return Object.keys(deps).filter(
            id => isPlugin(id)
        ).map(
            id => ({
                id,
                versionRange: deps[id],
                official: isPlugin(id),
                website: getPluginLink(id),
                baseDir: file
            })
        );
    }

    /**
     * 查找devDependencies和dependencies中包含的插件
     *
     * @parama {string} file package.json的文件路径
    */
    async list(file, context) {
        const pkg = readPackage(file, context);
        let pkgContext = cwd.get();
        this.packageStore.set(file, {pkgContext, pkg});
        let plugins = [];
        plugins = plugins.concat(this.findPlugins(pkg.devDependencies || {}, file));
        plugins = plugins.concat(this.findPlugins(pkg.dependencies || {}, file));

        // cli放在最上面
        const index = plugins.findIndex(p => p.id === SAN_CLI);

        if (index !== -1) {
            const service = plugins.splice(index, 1);
            plugins.unshift(service[0]);
        }

        this.pluginsStore.set(file, plugins);
        debug('Plugins found:', plugins.length, file);
        debug('CLI-Plugins:', plugins);
        return plugins;
    }

    findOne({id, file}, context) {
        const plugins = this.getPlugins(file);
        const plugin = plugins.find(p => p.id === id);
        if (!plugin) {
            debug('Plugin Not found', id, file);
        }
        return plugin;
    }
}

module.exports = new Plugins();
