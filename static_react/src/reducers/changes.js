/**
 * Created by diana on 10.05.2017.
 */
/**
 * Created by diana on 30.04.2017.
 */
import {
    REQUEST_CHANGES, RECEIVE_CHANGES,
    NEXT_PAGE, PREV_PAGE, FILTER, QUERTY_STRING
} from '../actions/changes'

const initialState = {
    limit: 20,
    skip: 0,
    search: "",
    status: ["ALL"],
    loaded: false,
    isLoading: false,
    changes: []
}

const changes_reducer = (state = initialState, action = {}) => {
    let {skip, limit} = state
    switch (action.type) {
        case REQUEST_CHANGES:
            return {
                ...state,
                loaded: false,
                isLoading: true
            }
        case RECEIVE_CHANGES:
            return {
                ...state,
                loaded: true,
                changes: action.changes,
                isLoading: false
            }
        case NEXT_PAGE:
            return {
                ...state,
                skip: skip * 1 + limit,
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
        case FILTER:
            return {
                ...state,
                skip: 0,
                search: action.search,
                status: action.status,
                loaded: false,
                isLoading: false
            }
        case QUERTY_STRING:
            let newstate = state
            if (action.params.search)
                newstate.search = action.params.search
            if (action.params.skip)
                newstate.skip = parseInt(action.params.skip)
            if (action.params.status)
                newstate.status = action.params.status

            return newstate
        default:
            return state
    }
}

export default changes_reducer