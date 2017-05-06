/**
 * Created by diana on 30.04.2017.
 */
import {REQUEST_PROJECTS, RECEIVE_PROJECTS} from '../actions/projects'

const initialState = {
    limit: 20,
    skip: 0,
    search: "",
    loaded: false,
}

const NEXT = 'gerritmetrix/projects/NEXT'
const PREV = 'gerritmetrix/projects/PREV'
const FILTER = 'gerritmetrix/projects/FILTER'

const project_reducer = (state = initialState, action = {}) => {
    let {skip, limit} = state
    switch (action.type) {
        case REQUEST_PROJECTS:
            return {
                ...state,
                loaded: false,
            }
        case RECEIVE_PROJECTS:
            return {
                ...state,
                loaded: true,
                projects: action.projects,
            }
        case NEXT:
            return {
                ...state,
                skip: skip + limit,
                loaded: false,
            }
        case PREV:
            if (skip > limit)
                return {
                    ...state,
                    skip: skip - limit,
                    loaded: false,
                }
            return state
        case FILTER:
            return {
                ...state,
                search: action.search,
                loaded: false,
            }
        default:
            return state
    }
}

export default project_reducer