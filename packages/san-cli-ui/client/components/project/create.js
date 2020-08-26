/**
 * @file san项目创建
 * @author jinzhan
 */
import {connect} from '@lib/Store';
import Component from '@lib/san-component';
import '@store';
import PromptsForm from '@components/prompts-form';
import PROJECT_CREATION from '@graphql/project/projectCreation.gql';
import CONSOLE_LOG_ADDED from '@graphql/console/consoleLogAdded.gql';
import './create.less';

export default class ProjectCreate extends Component {
    static template = /* html */`
        <div class="flex-all create">
            <s-form label-col="{{formItemLayout.labelCol}}"
                wrapper-col="{{formItemLayout.wrapperCol}}">
                <s-formitem label="{{$t('project.components.create.folderName')}}">
                    <s-input value="{=app.name=}"></s-input>
                    <div class="grey">{{cwd}}/{{app.name}}</div>
                </s-formitem>
            </s-form>

            <c-prompts-form s-ref="form"
                prompts="{{prompts}}"
                hide-submit-btn="true"
                submit-text="{{$t('project.components.create.submitText')}}"
                on-submit="onPromptsFormSubmit"></c-prompts-form>

            <s-spin tip="{{loadingTip}}" 
                    spinning="{{isCreating}}"
                    size="large">
                    <s-icon slot="indicator" type="loading" style="font-size: 30px;" ></s-icon>
                </s-spin>
        </div>
    `;

    static components = {
        'c-prompts-form': PromptsForm
    };

    initData() {
        return {
            isCreating: false,
            loadingTip: '',
            app: {
                name: ''
            },
            formItemLayout: {
                labelCol: {
                    xs: {
                        span: 12
                    },
                    sm: {
                        span: 4
                    }
                },
                wrapperCol: {
                    xs: {
                        span: 24
                    },
                    sm: {
                        span: 16
                    }
                }
            }
        };
    }

    attached() {
        this.data.set('loadingTip', this.$t('project.components.create.spinTip'));

        // add a subscribe for fetch the console.log from command line
        this.observer = this.$apollo.subscribe({
            query: CONSOLE_LOG_ADDED
        });

        this.observer.subscribe({
            next: ({data}) => {
                this.data.set('loadingTip', data.consoleLogAdded.message);
            }
        });
    }

    submit(data) {
        this.formData = data;
        this.ref('form').handleSubmit();
    }

    onPromptsFormSubmit(presets) {
        this.data.set('isCreating', true);
        this.$apollo.mutate({
            mutation: PROJECT_CREATION,
            variables: {
                name: this.data.get('app').name || '',
                presets,
                ...this.formData
            }
        }).then(({data}) => {
            // 创建完成
            this.data.set('isCreating', false);

            // TODO: 跳转到项目页面
        });
    }
}

connect.san(
    {
        cwd: 'cwd'
    }
)(ProjectCreate);