/**
 * @file 依赖管理
 */
import {Component} from 'san';
import Layout from '@components/layout';
import DependencyHead from '@components/dependency/dependency-head';
import DependencySearch from '@components/dependency/dependency-filter';
import DependencyItem from '@components/dependency/dependency-item';
import DependencyPackageSearch from '@components/dependency/dependency-package-search';
import DEPENDENCIES from '@graphql/dependency/dependencies.gql';
import './dependency.less';

export default class Dependency extends Component {
    static template = /* html */`
        <c-layout menu="{{$t('menu')}}" nav="{{['dependency']}}" title="{{$t('dependency.title')}}">
            <div slot="content" class="dependency">
                <c-dependence-search on-keywordChange="keywordChange" />

                <div class="dependency-wrapper">
                    <div class="pkg-body" s-if="dependencies.length">
                        <h2>{{$t('dependency.dependencies')}}</h2>
                        <template s-for="item in dependencies">
                            <c-dependency-item item="{{item}}" />
                        </template>
                    </div>

                    <div class="pkg-body" s-if="devDependencies.length">
                        <h2>{{$t('dependency.devDependencies')}}</h2>
                        <template s-for="item in devDependencies">
                            <c-dependency-item item="{{item}}" />
                        </template>
                    </div>
                </div>

                <c-dependency-packgae-search s-if="packageModalShow" on-modalClose="onModalClose" />
            </div>
        </c-layout>
    `;

    static components = {
        'c-layout': Layout,
        'c-dependence-search': DependencySearch,
        'c-dependence-head': DependencyHead,
        'c-dependency-item': DependencyItem,
        'c-dependency-packgae-search': DependencyPackageSearch
    };

    static computed = {
        devDependencies() {
            return this.data.get('dependenciesList')
                .filter(item => {
                    const keyword = this.data.get('keyword') || '';
                    return item.type === 'devDependencies'
                        && (!keyword || ~item.id.indexOf(keyword));
                });
        },
        dependencies() {
            return this.data.get('dependenciesList')
                .filter(item => {
                    const keyword = this.data.get('keyword') || '';
                    return item.type === 'dependencies'
                        && (!keyword || ~item.id.indexOf(keyword));
                });
        }
    };

    initData() {
        return {
            keyword: '',
            dependenciesList: [],
            packageModalShow: false
        };
    }

    attached() {
        this.getDependencies();
        this.watch('packageModalShow', packageModalShow => {
            if (!packageModalShow) {
                this.getDependencies();
            }
        });
    }

    keywordChange(keyword) {
        keyword = keyword.trim();
        this.data.set('keyword', keyword);
    }

    // 初始化获取数据列表
    async getDependencies() {
        const query = await this.$apollo.query({query: DEPENDENCIES});
        this.data.set('dependenciesList', query.data ? query.data.dependencies : []);
    }

    // 搜索模态框展示
    onModalClose() {
        this.data.set('packageModalShow', false);
    }

    // 搜索模态框取消
    onModalShow() {
        this.data.set('packageModalShow', true);
    }
}