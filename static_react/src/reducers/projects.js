/**
 * Created by diana on 30.04.2017.
 */
import {
    REQUEST_PROJECTS, RECEIVE_PROJECTS,
    NEXT_PAGE, PREV_PAGE, FILTER
} from '../actions/projects'

const initialState = {
    limit: 20,
    skip: 0,
    search: "",
    loaded: false,
    isLoading: false,
    projects: []
}

const project_reducer = (state = initialState, action = {}) => {
    let {skip, limit} = state
    switch (action.type) {
        case REQUEST_PROJECTS:
            return {
                ...state,
                loaded: false,
                isLoading: true
            }
        case RECEIVE_PROJECTS:
            return {
                ...state,
                loaded: true,
                projects: action.projects,
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
            if (skip > limit)
                return {
                    ...state,
                    skip: skip - limit,
                    loaded: false,
                    isLoading: false
                }
            return state
        case FILTER:
            return {
                ...state,
                search: action.search,
                loaded: false,
                isLoading: false
            }
        default:
            return state
    }
}

export default project_reducer