/**
 * @file common store
 * @author zttonly
 */
import {builder} from 'san-update';
import apolloClient from '@lib/apollo-client';
import FOLDER_CURRENT from '@graphql/folder/folderCurrent.gql';
import FOLDERS_FAVORITE from '@graphql/folder/foldersFavorite.gql';
import FOLDER_OPEN from '@graphql/folder/folderOpen.gql';
import FOLDER_SET_FAVORITE from '@graphql/folder/folderSetFavorite.gql';
import FOLDER_CREATE from '@graphql/folder/folderCreate.gql';

export const folder = {
    initData: {
        folderCurrent: '',
        foldersFavorite: '',
        projects: [],
        recentProjects: []
    },
    actions: {
        ['folder:getCurrentFolder'](payload, {dispatch}) {
            return apolloClient.query({query: FOLDER_CURRENT}).then(res => {
                if (res.data) {
                    dispatch('folder:setCurrentFolder', res.data.folderCurrent);
                }
            });
        },
        ['folder:setCurrentFolder'](data, {dispatch}) {
            data.path && dispatch('cwd:setCwd', data.path);
            return builder().set('folderCurrent', data);
        },
        ['folder:getFavoriteFolders'](id, {dispatch}) {
            return apolloClient.query({query: FOLDERS_FAVORITE}).then(res => {
                if (res.data) {
                    return builder().set('foldersFavorite', res.data.foldersFavorite);
                }
            });
        },
        ['folder:openFolder'](path, {dispatch}) {
            return apolloClient.mutate({
                mutation: FOLDER_OPEN,
                variables: {
                    path
                },
                update: (cache, {data: {folderOpen}}) => {
                    cache.writeQuery({query: FOLDER_CURRENT, data: {folderCurrent: folderOpen}});
                    // change parent
                    dispatch('folder:setCurrentFolder', folderOpen);
                }
            });
        },
        ['folder:setFavoriteFolder'](payload, {dispatch, getState}) {
            const folderCurrent = getState('folderCurrent');
            apolloClient.mutate({
                mutation: FOLDER_SET_FAVORITE,
                variables: {
                    path: folderCurrent.path,
                    favorite: !folderCurrent.favorite
                },
                update: (cache, {data: {folderSetFavorite}}) => {
                    cache.writeQuery({query: FOLDER_CURRENT, data: {folderCurrent: folderSetFavorite}});
                    let {foldersFavorite} = cache.readQuery({query: FOLDERS_FAVORITE});
                    if (folderSetFavorite.favorite) {
                        foldersFavorite.push(folderSetFavorite);
                    }
                    else {
                        foldersFavorite = foldersFavorite.filter(
                            f => f.path !== folderSetFavorite.path
                        );
                    }
                    cache.writeQuery({query: FOLDERS_FAVORITE, data: {foldersFavorite}});
                    dispatch('folder:getCurrentFolder');
                    dispatch('folder:getFavoriteFolders');
                }
            });
        },
        // 创建并打开文件夹
        ['folder:createFolder'](name, {dispatch}) {
            return apolloClient.mutate({
                mutation: FOLDER_CREATE,
                variables: {
                    name
                }
            }).then(res => {
                dispatch('folder:openFolder', res.data.folderCreate.path);
            });
        }
    }
};
