const views = require('../connectors/views');
const widgets = require('../connectors/widgets');
const {cwd} = require('../data/runtime');
const dependencies = require('../connectors/dependencies');


module.exports = {
    async unInstall({id}, context) {
        const deleteData = dependencies.unInstall({id}, context);

        // 这个 id 是插件的 npm 包名
        const viewArr = views.findByPkgName(id);
        // 这个 id 是插件开发者定义的视图 id。
        viewArr.forEach(view => views.remove(view.id, context));

        const widgetArr = widgets.findByPkgName(id);
        widgetArr.forEach(widget => widgets.remove(widget, context));

        return deleteData;
    }
};
