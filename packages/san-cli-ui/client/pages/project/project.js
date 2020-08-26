/**
 * @file 项目管理容器
 * @author zttonly
 */
import {connect} from '@lib/Store';
import {router, Link} from 'san-router';
import Component from '@lib/san-component';
import PROJECT_INIT_TEMPLATE from '@graphql/project/projectInitTemplate.gql';
import PROJECT_TEMPLATE_LIST from '@graphql/project/projectTemplateList.gql';
import PROJECT_IMPORT from '@graphql/project/projectImport.gql';
import ConnectionStatus from '@components/connection-status';
import ProjectList from '@components/project-list';
import ProjectTemplateList from '@components/project/template-list';
import FolderExplorer from '@components/folder-explorer';
import ProjectCreate from '@components/project/create';
import Layout from '@components/layout/horizontal';
import '@store';
import './project.less';
import {Modal} from 'santd';

export default class Project extends Component {
    static template = /* html */`
        <div class="h1oh project-select">
            <c-connection-status />
            <c-layout menu="{{$t('project.select.menu')}}"
                nav="{=nav=}"
                page-loading="{=pageLoading=}"
            >
                <template slot="content">
                    <!--- 1.项目列表 -->
                    <c-list
                        s-if="route.path === '/' || route.query.nav === 'list'"
                        on-routeto="handleRouteTo"
                    />

                    <!--- 2.创建项目 -->
                    <div class="h1oh project-create" s-if="route.query.nav === 'create'">
                        <c-folder-explorer s-if="current === 0" />
                        <c-project-template-list 
                            s-elif="current === 1"
                            s-ref="projectTemplates"
                            on-submit="initProject"
                            hide-submit-btn="{{true}}"
                            current-template="{{projectTemplateList.length ? projectTemplateList[0].value : ''}}"
                            project-template-list="{{projectTemplateList}}"
                        />
                        <c-create 
                            s-elif="current === 2"
                            s-ref="create"
                            prompts="{{projectPrompts}}"
                        />

                        <!---底部按钮--->
                        <div class="flex-none footer-wrapper">
                            <s-button
                                class="custom-santd-btn"
                                size="large"
                                s-if="current === 0"
                                type="primary"
                                on-click="getProjectTemplateList"
                                icon="plus"
                            >{{$t('project.select.create.initProject')}}</s-button>
                            
                            <s-button
                                class="custom-santd-btn"
                                s-if="current === 1"
                                size="large"
                                on-click="handleInitProject"
                                type="primary"
                            >{{$t('next')}}</s-button>

                            <s-button
                                class="custom-santd-btn"
                                s-if="current === 2"
                                size="large"
                                on-click="createProject"
                                type="primary"
                            >{{$t('project.components.create.submitText')}}</s-button>

                            <!----上一步---->
                            <s-button s-if="current > 0"
                                type="link"
                                size="large"
                                class="cancel-submit"
                                on-click="cancelSubmit"
                            >{{$t('pre')}}</s-button>
                        </div>
                    </div>

                    <!--- 3.导入项目 -->
                    <div class="h1oh project-import" s-if="route.query.nav === 'import'">
                        <c-folder-explorer />
                        <div class="footer-wrapper">
                            <s-button
                                class="custom-santd-btn"
                                disabled="{{!isPackage}}"
                                loading="{{isImporting}}"
                                size="large"
                                icon="import"
                                s-if="current === 0"
                                type="primary"
                                on-click="importProject"
                            >{{$t('project.select.import.importBtnText')}}</s-button>
                        </div>
                    </div>
                </template>
            </c-layout>
        </div>
    `;
    static components = {
        'r-link': Link,
        'c-connection-status': ConnectionStatus,
        'c-list': ProjectList,
        'c-folder-explorer': FolderExplorer,
        'c-create': ProjectCreate,
        'c-layout': Layout,
        'c-project-template-list': ProjectTemplateList
    };
    initData() {
        return {
            projectPrompts: [],
            pageLoading: false,
            current: 0,
            menuData: [],
            nav: [],
            isImporting: false,
            projectTemplateList: [],
            projectTemplate: ''
        };
    }

    async attached() {
        let menuData = this.$t('project.select.menu');
        let queryNav = this.data.get('route.query.nav');
        this.data.set('menuData', menuData);
        this.data.set('nav', [queryNav || menuData[0].key]);
    }

    handleRouteTo(r) {
        r && router.locator.redirect(r);
    }

    formatPrompts(data) {
        data.forEach(item => {
            // cli中的name是默认文件夹名称，web里面不能使用，故设置为空
            if (item.name === 'name') {
                item.default = '';
            }

            // 把default赋值给value
            item.default && (item.value = item.default);

            // 给select赋初始值
            item.choices && (item.value = item.choices[0].value);
        });
        return data;
    }

    // 获取可选的脚手架
    async getProjectTemplateList() {
        this.data.set('pageLoading', true);
        const {data} = await this.$apollo.query({
            query: PROJECT_TEMPLATE_LIST
        });
        this.data.set('pageLoading', false);
        this.data.set('current', this.data.get('current') + 1);
        this.data.set('projectTemplateList', data.projectTemplateList);
    }

    async initProject(template) {
        this.data.set('pageLoading', true);
        const {data} = await this.$apollo.mutate({
            mutation: PROJECT_INIT_TEMPLATE,
            variables: {
                template
            }
        });
        this.data.set('pageLoading', false);
        if (data.projectInitTemplate && data.projectInitTemplate.prompts) {
            // 存储起来，create项目的时候要用
            this.data.set('projectTemplate', template);
            this.data.set('projectPrompts', this.formatPrompts(data.projectInitTemplate.prompts));
            this.data.set('current', this.data.get('current') + 1);
        }
    }

    handleInitProject() {
        this.ref('projectTemplates').handleSubmit();
    }

    createProject() {
        this.ref('create').submit({
            template: this.data.get('projectTemplate')
        });
    }

    cancelSubmit() {
        this.data.set('current', this.data.get('current') - 1);
    }

    async importProject() {
        this.data.set('isImporting', true);
        const res = await this.$apollo.mutate({
            mutation: PROJECT_IMPORT,
            variables: {
                path: this.data.get('cwd'),
                force: false
            }
        });
        this.data.set('isImporting', false);
        let $t = this.$t;
        if (res.errors && res.errors.some(item => item.message === 'NO_MODULES')) {
            Modal.error({
                title: $t('project.components.import.noModulesTipsTitle'),
                content: $t('project.components.import.noModulesTipsContent')
            });
            return;
        }
        router.locator.redirect('/');
    }
}

connect.san(
    {
        cwd: 'cwd',
        isPackage: 'folderCurrent.isPackage'
    }
)(Project);
