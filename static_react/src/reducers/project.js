/**
 * Created by diana on 09.05.2017.
 */

import {
    REQUEST_PROJECT_CHANGES, RECEIVE_PROJECT_CHANGES,
    NEXT_PAGE, PREV_PAGE, QUERTY_STRING, SELECT_PROJECT
} from '../actions/project'

const initialState = {
    project_name: "",
    limit: 20,
    skip: 0,
    search: "",
    loaded: false,
    isLoading: false,
    changes: []
}

const project_changes_reducer = (state = initialState, action = {}) => {
    let {skip, limit} = state
    switch (action.type) {
        case SELECT_PROJECT:
            return {
                ...state,
                project_name: action.project_name,
                loaded: false,
                isLoading: false,
                changes: [],
                skip: 0
            }
        case REQUEST_PROJECT_CHANGES:
            return {
                ...state,
                loaded: false,
                isLoading: true
            }
        case RECEIVE_PROJECT_CHANGES:
            return {
                ...state,
                loaded: true,
                changes: action.changes,
                isLoading: false
            }
        case NEXT_PAGE:
            return {
                ...state,
                skip: skip + limit,
                loaded: false,
                isLoading: false
            }
        case PREV_PAGE:
            if (skip >= limit)
                return {
                    ...state,
                    skip: skip - limit,
                    loaded: false,
                    isLoading: false
                }
            return state
        case QUERTY_STRING:
            let newstate = state
            if (action.params.skip)
                newstate.skip = action.params.skip

            return newstate
        default:
            return state
    }
}

export default project_changes_reducer