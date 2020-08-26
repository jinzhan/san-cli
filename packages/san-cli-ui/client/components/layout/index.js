/**
 * @file 带侧边栏布局组件
 * @author zttonly
 */
import {connect} from '@lib/Store';
import Component from '@lib/san-component';
import {Link} from 'san-router';
import '@store';
import './index.less';
import {openInEditor} from '@lib/utils/openInEditor';

export default class ComponentLayout extends Component {
    static template = /* html */`
            <s-layout class="h1oh layout">
                <s-layout-header class="header">
                    <r-link to="/">
                        <s-icon type="home" class="home-link" />
                    </r-link>
                    <s-dropdown trigger="click" class="project-name">
                        <s-menu slot="overlay"
                            selectable="{{false}}"
                            on-click="handleMenuClick"
                            style="box-shadow: 0 2px 20px rgba(0, 0, 0 , .1); border-radius: 5px; width: 160px;"
                        >
                            <s-menu-item key="open-in-editor">
                                <s-icon type="codepen"></s-icon>{{$t('dropdown.editor')}}
                            </s-menu-item>
                            <s-menu-divider></s-menu-divider>
                            <s-menu-item-group title="{{$t('dropdown.recentProject')}}">
                                <s-menu-item s-for="project in recentProjects" key="{{project.id}}">
                                    <s-icon type="history"></s-icon>{{project.name}}
                                </s-menu-item>
                            </s-menu-item-group>
                        </s-menu>
                        <s-button>{{projectCurrent.name}}<s-icon type="down" /></s-button>
                    </s-dropdown>
                    <span class="line"></span>
                    <h1 class="title">{{title}}</h1>
                    <div class="head-right">
                        <slot name="right"></slot>
                    </div>
                </s-layout-header>

                <s-layout class="h1oh flex-all main-wrap">
                    <s-layout-sider theme="light">
                        <s-menu class="menu" mode="inline" selectedKeys="{{nav}}">
                            <s-menu-item s-for="item in $t('menu')" key="{{item.key}}">
                                <r-link to="{{item.link}}">
                                    <s-icon type="{{item.icon}}"></s-icon>
                                    <span>{{item.text}}</span>
                                </r-link>
                            </s-menu-item>
                        </s-menu>
                    </s-layout-sider>
                    <s-layout-content class="main">
                        <s-spin s-if="pageLoading"
                            class="loading"
                            spinning="{=pageLoading=}"
                            size="large"
                        >
                            <s-icon slot="indicator" type="loading" style="font-size: 30px;" />
                        </s-spin>
                        <slot name="content"></slot>
                    </s-layout-content>
                </s-layout>
            </s-layout>
    `;
    static components = {
        'r-link': Link
    };
    initData() {
        return {
            pageLoading: false
        };
    }
    async inited() {
        this.actions.getRecentProjects();
        this.actions.getCurrentProject();
    }

    async handleMenuClick(e) {
        if (e.key === 'open-in-editor') {
            openInEditor.call(this, this.data.get('projectCurrent.path'));
            return;
        }

        this.actions.openProject(e.key);
        this.actions.getRecentProjects();

        location.reload();
    }
}
connect.san(
    {
        projectCurrent: 'projectCurrent',
        recentProjects: 'recentProjects'
    },
    {
        getCurrentProject: 'project:getCurrentProject',
        openProject: 'project:openProject',
        getRecentProjects: 'project:getRecentProjects'
    }
)(ComponentLayout);