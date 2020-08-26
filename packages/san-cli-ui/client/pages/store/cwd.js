/**
 * @file common store
 * @author zttonly
 */
import {builder} from 'san-update';
import apolloClient from '@lib/apollo-client';
import PROJECT_CWD_RESET from '@graphql/project/projectCwdReset.gql';
import CWD from '@graphql/cwd/cwd.gql';
import CWD_CHANGE from '@graphql/cwd/cwdChanged.gql';

export const cwd = {
    initData: {
        cwd: ''
    },
    actions: {
        ['cwd:resetCwd'](payload, {dispatch, getState}) {
            return apolloClient.mutate({
                mutation: PROJECT_CWD_RESET
            }).then(res => {
                if (res.data) {
                    // 路径变化触发plugins改变
                    dispatch('plugin:init');
                    // 更新store内的cwd值
                    dispatch('cwd:setCwd', res.data.projectCwdReset);
                }
            });
        },
        ['cwd:getCwd'](payload, {dispatch}) {
            return apolloClient.query({query: CWD}).then(res => {
                if (res.data) {
                    dispatch('folder:setCwd', res.data.cwd);
                }
            });
        },
        ['cwd:setCwd'](path) {
            return builder().set('cwd', path);
        },
        ['cwd:cwdChangeObserver'](payload, {dispatch}) {
            const observer = apolloClient.subscribe({query: CWD_CHANGE});
            observer.subscribe({
                next: result => {
                    const {data, loading, error, errors} = result;
                    /* eslint-disable no-console */
                    if (error || errors) {
                        console.log('err');
                    }

                    if (loading) {
                        // TODO: 测试loading态可见时长后决定页面增加显示效果
                        console.log('loading');
                    }

                    if (data && data.cwd) {
                        dispatch('cwd:setCwd', data.cwd);
                        dispatch('folder:getCurrentFolder');
                        dispatch('folder:getFavoriteFolders');
                    }
                },
                error: err => {
                    console.log('error', err);
                    /* eslint-enable no-console */
                }
            });
        }
    }
};
