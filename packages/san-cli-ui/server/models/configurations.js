const prompts = require('../connectors/prompts');
const plugins = require('../connectors/plugins');
const {cwd} = require('../data/runtime');
const configurations = require('../connectors/configurations');

module.exports = {
    async getPromptTabs(id, context) {
        const {config, data, onReadData} = configurations.getPromptTabs(id, context);
        if (!onReadData) {
            return [];
        }
        let tabs = onReadData.tabs;
        if (!tabs) {
            tabs = [
                {
                    id: '__default',
                    label: 'Default',
                    prompts: onReadData.prompts
                }
            ];
        }
        await prompts.reset();
        for (const tab of tabs) {
            tab.prompts = tab.prompts.map(data => prompts.add({
                ...data,
                tabId: tab.id
            }));
        }
        if (onReadData.answers) {
            await prompts.setAnswers(onReadData.answers);
        }
        await prompts.start();

        const $cwd = cwd.get();
        plugins.callHook({
            id: 'configRead',
            args: [{
                config,
                data,
                onReadData,
                tabs,
                cwd: $cwd
            }],
            file: $cwd
        }, context);

        return tabs;
    },

    async save(id, context) {
        const config = this.findOne(id, context);
        const current = this.current;
        if (config) {
            if (current.config === config) {
                const answers = prompts.getAnswers();
                const data = clone(current.data);
                const changedFields = {};
                const getChangedFields = fileId => changedFields[fileId] || (changedFields[fileId] = []);

                // API
                await config.onWrite({
                    prompts: prompts.list(),
                    answers,
                    data: current.data,
                    files: config.foundFiles,
                    cwd: cwd.get(),
                    api: {
                        assignData: (fileId, newData) => {
                            getChangedFields(fileId).push(...Object.keys(newData));
                            Object.assign(data[fileId], newData);
                        },
                        setData(fileId, newData) {
                            Object.keys(newData).forEach(key => {
                                let field = key;
                                const dotIndex = key.indexOf('.');
                                if (dotIndex !== -1) {
                                    field = key.substr(0, dotIndex);
                                }
                                getChangedFields(fileId).push(field);

                                const value = newData[key];
                                if (typeof value === 'undefined') {
                                    unset(data[fileId], key);
                                }
                                else {
                                    set(data[fileId], key, value);
                                }
                            });
                        },
                        async getAnswer(id, mapper) {
                            const prompt = prompts.findOne(id);
                            if (prompt) {
                                const defaultValue = await prompts.getDefaultValue(prompt);
                                if (defaultValue !== prompt.rawValue) {
                                    let value = get(answers, prompt.id);
                                    if (mapper) {
                                        value = mapper(value);
                                    }
                                    return value;
                                }
                            }
                        }
                    }
                });

                this.writeData({config, data, changedFields}, context);

                plugins.callHook({
                    id: 'configWrite',
                    args: [{
                        config,
                        data,
                        changedFields,
                        cwd: cwd.get()
                    }],
                    file: cwd.get()
                }, context);

                this.current = {};
            }
        }
        return config;
    }
};
