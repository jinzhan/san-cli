/**
 * @file FolderExplorer组件
 * @author zttonly
 */

import {connect} from '@lib/Store';
import Component from '@lib/san-component';
import {isValidMultiName} from '@lib/utils/folders';
import {logo} from '@lib/const';
import './folder-explorer.less';

export default class FolderExplorer extends Component {
    static template = /* html */`
        <div class="flex-all folder-explorer">
            <div class="flex-none contents">
                <s-tooltip title="{{$t('project.select.folderExplorer.tooltip.pre')}}">
                    <s-button type="primary" icon="left" on-click="onPathChange(-2)"></s-button>
                </s-tooltip>
                <div class="path-guide">
                    <s-input s-if="editing"
                        placeholder="{{$t('project.select.folderExplorer.placeholder.edit')}}"
                        value="{{inputValue}}"
                        on-blur="onOpenFolder"
                        on-pressEnter="onOpenFolder"
                    ></s-input>
                    <template s-else s-for="p,index in paths">
                        <s-button s-if="index === 0"
                            type="primary"
                            icon="folder"
                            on-click="onPathChange(index)"
                        ></s-button>
                        <s-button s-elif="p"
                            type="primary"
                            on-click="onPathChange(index)"
                        >{{p}}</s-button>
                    </template>
                </div>
                <s-tooltip title="{{$t('project.select.folderExplorer.tooltip.edit')}}" class="operate-btn">
                    <s-button type="primary" icon="form" on-click="onEdit"></s-button>
                </s-tooltip>
                <s-tooltip title="{{$t('project.select.folderExplorer.tooltip.star')}}"
                    s-if="folderCurrent"
                    class="operate-btn"
                >
                    <s-button type="primary" on-click="onFavorite">
                        <s-icon type="star" theme="{{folderCurrent.favorite ? 'filled' : 'outlined'}}"></s-icon>
                    </s-button>
                </s-tooltip>
                <s-tooltip title="{{$t('project.select.folderExplorer.tooltip.refresh')}}" class="operate-btn">
                    <s-button type="primary" icon="redo" on-click="onOpenFolder(folderCurrent.path)"></s-button>
                </s-tooltip>
                <s-tooltip s-if="foldersFavorite && foldersFavorite.length > 0"
                    title="{{$t('project.select.folderExplorer.tooltip.starDirs')}}"
                    class="operate-btn"
                >
                    <s-dropdown trigger="click" placement="bottomRight">
                        <s-menu slot="overlay"
                            selectable="{{false}}"
                            class="contents-menu"
                            on-click="onStarMenuClick"
                        >
                            <s-menu-item s-for="item in foldersFavorite" key="{{item.path}}">{{item.path}}</s-menu-item>
                        </s-menu>
                        <s-button type="primary" icon="caret-down"></s-button>
                    </s-dropdown>
                </s-tooltip>
                <s-dropdown trigger="click"  placement="bottomRight">
                    <s-menu slot="overlay"
                        selectable="{{false}}"
                        class="contents-menu"
                        on-click="onMoreMenuClick"
                    >
                        <s-menu-item key="showCreateModal">
                            {{$t('project.select.folderExplorer.menu.createFolder')}}
                        </s-menu-item>
                        <s-menu-item key="showHiddenFolder">
                            {{showHiddenFolder ? $t('project.select.folderExplorer.menu.hiddenFolder') 
                                : $t('project.select.folderExplorer.menu.hiddenFolderShow')}}
                        </s-menu-item>
                    </s-menu>
                    <s-button type="primary" icon="more"></s-button>
                </s-dropdown>
            </div>
            <div class="flex-all folders">
                <s-spin spinning="{{loading}}"/>
                <template s-if="folderCurrent && folderCurrent.children" s-for="folder in folderCurrent.children">
                    <div s-if="showHiddenFolder || !folder.hidden"
                        class="folder-item {{folder.hidden ? 'hidden' : ''}}"
                        on-click="onOpenFolder(folder.path)"
                    >
                        <img s-if="folder.isSanProject" class="san-project-icon" src="{{logo}}" />
                        <s-icon s-else type="{{folder.isPackage ? 'folder' : 'folder-open'}}" theme="filled"></s-icon>
                        <div class="folder-name">
                            {{folder.name}}  
                        </div>
                        <s-icon s-if="folder.favorite" type="star" theme="filled"></s-icon>
                    </div>
                </template>
            </div>
            <s-modal title="{{$t('project.select.folderExplorer.modalCreateTitle')}}"
                visible="{=showCreateModal=}"
                on-ok="handleModalOk"
                on-cancel="handleModalCancel"
            >
                <s-input placeholder="{{$t('project.select.folderExplorer.placeholder.edit')}}"
                    value="{=newFolderName=}"
                ></s-input>
            </s-modal>
        </div>
    `;

    static computed = {
        // 计算路径的分割符，linux是'/'，windows是'\\'
        separator() {
            const cwd = this.data.get('cwd');
            if (!cwd) {
                return '';
            }
            let index = cwd.indexOf('/');
            let indexWin = cwd.indexOf('\\');
            return index !== -1 ? '/'
                : indexWin !== -1 ? '\\' : '';
        },
        // 路径切分为数据，用于页面渲染
        paths() {
            const cwd = this.data.get('cwd');
            const separator = this.data.get('separator');
            return separator ? cwd.split(separator) : [cwd];
        },
        newFolderValid() {
            return isValidMultiName(this.data.get('newFolderName'));
        }
    };
    initData() {
        return {
            logo,
            inputValue: '', // 输入框的值
            separator: '', // 分隔符
            editing: false,
            loading: true,
            folderCurrent: {},
            foldersFavorite: '',
            showHiddenFolder: false,
            newFolderName: '',
            showCreateModal: false
        };
    }

    attached() {
        this.data.set('loading', false);
        this.actions.getCurrentFolder();
        this.actions.getFavoriteFolders();
        this.actions.cwdChangeObserver();
    }
    onEdit() {
        let {paths, separator} = this.data.get();
        this.data.set('inputValue', paths.join(separator));
        this.data.set('editing', true);
        this.nextTick(() => {
            document.querySelector('input').focus();
        });
    }
    onPathChange(index) {
        let {paths, separator} = this.data.get();
        // 本地根路径，linux是'/'，windows是'C:\\'
        let p = paths.slice(0, index + 1).join(separator) + separator;
        this.onOpenFolder(p);
    }
    onStarMenuClick(e) {
        this.onOpenFolder(e.key);
    }
    async onFavorite() {
        this.actions.setFavoriteFolder();
    }
    onMoreMenuClick(e) {
        switch (e.key) {
            case 'showCreateModal':
                this.data.set('showCreateModal', true);
                break;
            case 'showHiddenFolder':
                this.data.set('showHiddenFolder', !this.data.get('showHiddenFolder'));
                break;
        }
    }
    async onOpenFolder(path) {
        this.data.set('editing', false);
        this.data.set('loading', true);
        try {
            this.actions.openFolder(path);
        }
        catch (e) {
            this.data.set('error', e);
        }
        this.data.set('loading', false);
    }
    handleModalOk() {
        this.onCreateFolder();
        this.data.set('showCreateModal', false);
    }
    handleModalCancel() {
        this.data.set('showCreateModal', false);
    }
    onCreateFolder() {
        let {newFolderName, newFolderValid} = this.data.get();
        if (!newFolderValid) {
            return;
        }
        this.actions.createFolder(newFolderName);
        this.data.set('newFolderName', '');
    }
}

connect.san(
    {
        cwd: 'cwd',
        folderCurrent: 'folderCurrent',
        foldersFavorite: 'foldersFavorite'
    },
    {
        getCurrentFolder: 'folder:getCurrentFolder',
        getFavoriteFolders: 'folder:getFavoriteFolders',
        openFolder: 'folder:openFolder',
        setFavoriteFolder: 'folder:setFavoriteFolder',
        createFolder: 'folder:createFolder',
        cwdChangeObserver: 'folder:cwdChangeObserver'
    }
)(FolderExplorer);
