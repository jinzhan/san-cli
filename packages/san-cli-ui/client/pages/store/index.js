/**
 * @file store输出
 * @author zttonly
 */

import {store} from '@lib/Store';
import * as stores from './stores';

const initObj = Object.keys(stores).reduce((pre, cur) => ({
    initData: {
        ...pre.initData,
        ...stores[cur].initData
    },
    actions: {
        ...pre.actions,
        ...stores[cur].actions
    }
}), {initData: {}, actions: {}});

store.initData(initObj.initData).addActions(initObj.actions);
