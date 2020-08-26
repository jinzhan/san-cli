/**
 * @file List组件
 * @author zttonly
 */
import {connect} from '@lib/Store';
import Component from '@lib/san-component';
import '@store';
import List from './list';
import 'animate.css';
import './project-list.less';
import {openInEditor} from '@lib/utils/openInEditor';

export default class ProjectList extends Component {

    static template = /* html */`
        <div class="project-list">
            <!---empty tip---->
            <div class="empty-tip" s-if="!projects || projects.length <= 0">
                <div>
                    <s-icon type="coffee" />
                    <p class="tip-text">{{$t('project.list.emptyTip')}}</p>
                </div>
            </div>
            <div class="input-search" s-else>
                <s-input-search
                    placeholder="{{$t('project.list.searchPlaceholder')}}"
                    value="{=filterInput=}"
                    style="width: 400px;"
                    size="large"
                />
            </div>
            <!---favorite list---->
            <template s-if="favoriteList && favoriteList.length > 0">
                <div class="favorite">
                    <h3>{{$t('project.list.collectionTitle')}}</h3>
                    <c-list
                        list="{=favoriteList=}"
                        on-edit="onEdit"
                        on-open="onOpen"
                        on-remove="onRemove"
                        on-favorite="onFavorite"
                        on-itemclick="onItemClick"
                        lastOpenProject="{=lastOpenProject=}"
                    />
                </div>
            </template>

            <!---all list---->
            <template s-if="nomarlList && nomarlList.length > 0">
                <h3 s-if="favoriteList && favoriteList.length > 0">{{$t('project.list.listTitle')}}</h3>
                <c-list
                    list="{=nomarlList=}"
                    on-edit="onEdit"
                    on-open="onOpen"
                    on-remove="onRemove"
                    on-favorite="onFavorite"
                    on-itemclick="onItemClick"
                    lastOpenProject="{=lastOpenProject=}"
                />
            </template>

            <s-modal wrap-class-name="rename-modal"
                width="580"
                title="{{$t('project.list.tooltip.rename')}}"
                visible="{=showRenameModal=}"
                okText="{{$t('project.list.modal.oktext')}}"
                on-ok="handleModalOk"
                on-cancel="handleModalCancel"
            >
                <p>{{$t('project.list.modal.tip')}}</p>
                <s-input placeholder="{{$t('project.list.modal.placeholder')}}"
                    value="{=projectName=}"
                    size="large"
                >
                    <s-icon type="folder" style="color: #1890ff;font-size:20px" theme="filled" slot="prefix" ></s-icon>
                </s-input>
            </s-modal>
        </div>
    `;
    static computed = {
        filterList() {
            let projects = this.data.get('projects');
            let filterInput = this.data.get('filterInput');
            return filterInput ? projects.filter(item => item.name.indexOf(filterInput) >= 0) : projects;
        },
        favoriteList() {
            let filterList = this.data.get('filterList');
            return filterList && filterList.filter(item => item.favorite);
        },
        nomarlList() {
            let filterList = this.data.get('filterList');
            return filterList && filterList.filter(item => !item.favorite);
        },
        lastOpenProject() {
            const projectCurrent = this.data.get('projectCurrent');
            return projectCurrent && projectCurrent.id;
        }
    };
    initData() {
        return {
            showRenameModal: false,
            projectName: '',
            editProject: '',
            filterInput: ''
        };
    }

    static components = {
        'c-list': List
    }
    attached() {
        this.actions.getProjects();
        this.actions.getCurrentProject();
    }

    onOpen({item}) {
        openInEditor.call(this, item.path);
    }
    onEdit(e) {
        this.data.set('showRenameModal', true);
        this.data.set('editProject', e.item);
        this.data.set('projectName', e.item.name);
    }
    async handleModalOk() {
        const {editProject, projectName} = this.data.get();
        await this.actions.renameProject({
            id: editProject.id,
            name: projectName
        });
        this.data.set('showRenameModal', false);
    }
    handleModalCancel() {
        this.data.set('showRenameModal', false);
    }
    async onRemove(e) {
        this.actions.removeProject(e.item);
    }
    async onFavorite(e) {
        this.actions.favoriteProject(e.item);
    }
    async onItemClick(e) {
        let projectCurrent = this.data.get('projectCurrent');
        if (!projectCurrent || projectCurrent.id !== e.item.id) {
            this.actions.openProject(e.item.id);
        }
        await this.actions.resetCwd();
        let r = this.$t('menu') ? this.$t('menu')[0].link : '';
        this.fire('routeto', r);
    }
}

connect.san(
    {
        projectCurrent: 'projectCurrent',
        projects: 'projects'
    },
    {
        getCurrentProject: 'project:getCurrentProject',
        openProject: 'project:openProject',
        resetCwd: 'project:resetCwd',
        getProjects: 'project:getProjects',
        removeProject: 'project:removeProject',
        favoriteProject: 'project:favoriteProject',
        renameProject: 'project:renameProject'
    }
)(ProjectList);
