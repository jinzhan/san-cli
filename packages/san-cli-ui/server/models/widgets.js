const prompts = require('../connectors/prompts');
const widgets = require('../connectors/widgets');

module.exports = {
    async openConfig({id}, context) {
        const {widget, promptsData} = widgets.openConfig({id}, context);
        if (promptsData && promptsData.length) {
            await prompts.reset(widget.config || {});
            promptsData.forEach(item => prompts.add(item));
            await prompts.start();
        }
        return widget;
    },

    getConfigPrompts({id}, context) {
        return widgets.isCurrentWidget ? prompts.list() : [];
    },

    saveConfig({id}, context) {
        const widget = this.saveConfig({id}, context);
        widget.config = prompts.getAnswers();
        return widget;
    },
};
