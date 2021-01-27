const path = require('path');
const {cwd} = require('../data/runtime');
const {resolveModuleRoot} = require('../utils/module');
const projects = require('../connectors/projects');
const clientAddons = require('../connectors/clientAddons');

module.exports = {
    serve(req, res) {
        const {id, 0: file} = req.params;
        const addon = clientAddons.findOne(decodeURIComponent(id));
        if (addon && addon.path) {
            let resolvedPath = '';
            // 尝试寻找两次
            try {
                resolvedPath = require.resolve(addon.path);
            }
            catch (error) {
                try {
                    const projectPath = this.context ? projects.getCurrent(this.context).path : cwd.get();
                    resolvedPath = require.resolve(projectPath + '/node_modules/' + addon.path);
                }
                catch (e) {
                }
            }
            const basePath = resolveModuleRoot(resolvedPath);
            if (basePath) {
                res.sendFile(path.join(basePath, file), {maxAge: 0});
            }
            else {
                res.status(404);
                res.send(`File not found (resolved: ${resolvedPath}`);
            }
        }
        else {
            res.status(404);
            res.send(`Addon ${id} not found in loaded addons.`);
        }
    }
};
