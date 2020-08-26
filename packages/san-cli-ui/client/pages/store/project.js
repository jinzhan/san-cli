/**
 * @file common store
 * @author zttonly
 */
import {builder} from 'san-update';
import apolloClient from '@lib/apollo-client';
import PROJECT_CURRENT from '@graphql/project/projectCurrent.gql';
import PROJECTS from '@graphql/project/projects.gql';
import PROJECT_OPEN from '@graphql/project/projectOpen.gql';
import PROJECT_REMOVE from '@graphql/project/projectRemove.gql';
import PROJECT_SET_FAVORITE from '@graphql/project/projectSetFavorite.gql';
import PROJECT_RENAME from '@graphql/project/projectRename.gql';

export const project = {
    initData: {
        projectCurrent: {},
        projects: [],
        recentProjects: [],
        isPackage: false
    },
    actions: {
        ['project:setCurrentProject'](data) {
            return builder().set('projectCurrent', data);
        },
        ['project:getCurrentProject'](payload, {dispatch}) {
            return apolloClient.query({query: PROJECT_CURRENT}).then(res => {
                if (res.data) {
                    // 当前打开的project,记录在数据库
                    dispatch('project:setCurrentProject', res.data.projectCurrent);
                }
            });
        },
        ['project:openProject'](id, {dispatch}) {
            return apolloClient.mutate({
                mutation: PROJECT_OPEN,
                variables: {
                    id
                }
            }).then(res => {
                if (res.data) {
                    // 当前打开的project,记录在数据库
                    dispatch('project:setCurrentProject', res.data.projectOpen);
                }
            });
        },
        ['project:setProjects'](data) {
            return builder().set('projects', data);
        },
        ['project:getProjects'](payload, {dispatch}) {
            return apolloClient.query({query: PROJECTS}).then(res => {
                if (res.data) {
                    // 当前打开的project,记录在数据库
                    dispatch('project:setProjects', res.data.projects);
                }
            });
        },
        ['project:removeProject'](project, {dispatch}) {
            return apolloClient.mutate({
                mutation: PROJECT_REMOVE,
                variables: {
                    id: project.id
                },
                update: cache => {
                    const data = cache.readQuery({query: PROJECTS});
                    let projects = data.projects.filter(p => p.id === project.id);
                    cache.writeQuery({query: PROJECTS, data: {projects}});
                }
            }).then(() => {
                dispatch('project:getProjects');
                dispatch('project:getCurrentProject');
            });
        },
        ['project:favoriteProject'](project, {dispatch}) {
            return apolloClient.mutate({
                mutation: PROJECT_SET_FAVORITE,
                variables: {
                    id: project.id,
                    favorite: project.favorite ? 0 : 1
                }
            }).then(() => {
                dispatch('project:getProjects');
                dispatch('project:getCurrentProject');
            });
        },
        ['project:renameProject'](options, {dispatch}) {
            return apolloClient.mutate({
                mutation: PROJECT_RENAME,
                variables: options
            }).then(() => {
                dispatch('project:getProjects');
                dispatch('project:getCurrentProject');
            });
        },
        ['project:setRecentProjects'](data) {
            return builder().set('recentProjects', data);
        },
        ['project:getRecentProjects'](payload, {dispatch}) {
            // projects发生变化就能拿到最新的projects，减少请求projects次数
            return apolloClient.query({query: PROJECTS}).then(res => {
                if (res.data) {
                    const projectsDuplicate = res.data.projects.slice();
                    // 之所以不直接对 projects.data.projects 进行 sort，是因为如果这里改了 projects.data.projects，还会影响其它用到了 projects.data.projects 的地方
                    projectsDuplicate.sort((project1, project2) => project2.openDate - project1.openDate);
                    dispatch('project:setRecentProjects', projectsDuplicate.slice(1, 4));
                }
            });
        }
    }
};
