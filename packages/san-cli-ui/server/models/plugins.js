const path = require('path');
const {cwd} = require('../data/runtime');
const getContext = require('../utils/context');
const widgetsConnector = require('../connectors/widgets');
const clientAddonsConnector = require('../connectors/clientAddons');
const sharedDataConnector = require('../connectors/sharedData');
const projectsConnector = require('../connectors/projects');
const viewsConnector = require('../connectors/views');
const dependenciesConnector = require('../connectors/dependencies');
const pluginsConnector = require('../connectors/plugins');
const {getDebugLogger} = require('san-cli-utils/ttyLogger');
const debug = getDebugLogger('ui:plugins');
const PluginManager = require('../api/PluginManager');

module.exports = {
    pluginApiInstances: new Map(),
    getApi(folder) {
        return this.pluginApiInstances.get(folder);
    },

    async callAction({id, params, file = cwd.get()}, context) {
        const pluginApi = this.pluginApiInstances.get(file);
        return pluginApi.callAction(id, params);
    },

    findPlugins(deps, file) {
        const list = pluginsConnector.findPlugins(deps, file);
        return list.map(plugin => {
            plugin.installed = dependenciesConnector.isInstalled(plugin.id);
            return plugin;
        });
    },

    callHook({id, args, file}, context) {
        const pluginApi = this.getApi(file);
        if (!pluginApi) {
            return;
        }
        debug('callHook:', {id, args, file});
        const fns = pluginApi.hooks[id] || [];
        debug(`Hook ${id}`, fns.length, 'handlers');
        fns.forEach(fn => fn(...args));
    },

    async list(file, context, {resetApi = true, autoLoadApi = true} = {}) {
        const list = pluginsConnector.list(file, context);
        debug(`
            autoLoadApi:${autoLoadApi}
            resetApi: ${resetApi}
            this.pluginApiInstances.has(file):${this.pluginApiInstances.has(file)}
        `);
        if (resetApi || (autoLoadApi && !this.pluginApiInstances.has(file))) {
            await this.resetPluginApi({file}, context);
        }
        return list;
    },

    resetPluginApi({file}, context) {
        return new Promise(async (resolve, reject) => {
            debug('Reseting Plugin API...', file);
            let pluginApi = this.pluginApiInstances.get(file);
            let projectId;

            if (pluginApi) {
                projectId = pluginApi.project.id;
                const ipc = pluginApi.getIpc();
                ipc.handlers.forEach(fn => ipc.off(fn));
            }

            if (projectId) {
                sharedDataConnector.unwatchAll(projectId);
            }

            // 清空上一个项目的插件
            clientAddonsConnector.clear(context);

            const project = projectsConnector.findByPath(file, context);
            if (!project) {
                resolve(false);
                return;
            }

            if (project && projectsConnector.getType(project, context) !== 'san') {
                resolve(false);
                return;
            }

            const plugins = pluginsConnector.getPlugins(file);

            pluginApi = new PluginManager({
                plugins,
                cwd: file,
                project
            }, context);

            this.pluginApiInstances.set(file, pluginApi);

            // 运行默认插件的API
            this.runPluginApi(path.resolve(__dirname, '../../'), pluginApi, context, 'plugins');

            // 运行第三方插件的API
            plugins.forEach(plugin => this.runPluginApi(plugin.id, pluginApi, context));

            // 添加addons
            if (pluginApi.addonPlugin && pluginApi.addonPlugin.addons) {
                pluginApi.addonPlugin.addons.forEach(options => {
                    clientAddonsConnector.add(options, context);
                });
            }

            // 添加视图
            getDebugLogger('ui:views')('pluginApi.viewPlugin', pluginApi.viewPlugin);

            if (pluginApi.viewPlugin && pluginApi.viewPlugin.views) {
                for (const view of pluginApi.viewPlugin.views) {
                    await viewsConnector.add({view, project}, context);
                }
            }

            // 添加仪表盘插件
            if (pluginApi.widgetPlugin && pluginApi.widgetPlugin.widgets) {
                widgetsConnector.widgetDefs.size && widgetsConnector.reset();
                for (const definition of pluginApi.widgetPlugin.widgets) {
                    await widgetsConnector.registerDefinition({definition, project}, context);
                }
            }

            // Local plugins
            if (projectId !== project.id) {
                this.callHook({
                    id: 'projectOpen',
                    args: [project, projectsConnector.getLast(context)],
                    file
                }, context);
            }
            else {
                this.callHook({
                    id: 'pluginReload',
                    args: [project],
                    file
                }, context);
            }

            // call view open hook
            const currentView = viewsConnector.getCurrent();

            debug('currentView', currentView);

            if (currentView) {
                viewsConnector.open(currentView.id);
            }

            widgetsConnector.load(context);

            resolve(true);
        });
    },

    serve(req, res) {
        const {id: pluginId, 0: file} = req.params;
        this.serveFile({pluginId, file: path.join('public', file)}, res);
    },

    serveFile({pluginId, projectId = null, file}, res) {
        let baseFile = cwd.get();
        if (projectId) {
            const project = projectsConnector.findOne(projectId, getContext());
            if (project) {
                baseFile = project.path;
            }
        }

        if (pluginId) {
            const basePath = pluginId === '.' ? baseFile
                : dependenciesConnector.getPath({id: decodeURIComponent(pluginId), file: baseFile});
            if (basePath) {
                res.sendFile(path.join(basePath, file));
                return;
            }
        }
        else {
            console.log('serve issue', 'pluginId:', pluginId, 'projectId:', projectId, 'file:', file);
        }

        res.status(404);
        res.send(`Addon ${pluginId} not found in loaded addons.`);
    }
};
