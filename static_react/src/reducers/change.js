/**
 * Created by diana on 11.05.2017.
 */

import {
    SELECT_CHANGE, REQUEST_CHANGE, RECEIVE_CHANGE
} from '../actions/change'

const initialState = {
    change_number: "",
    loaded: false,
    isLoading: false,
    change: false
}

const change_reducer = (state = initialState, action = {}) => {
    let {skip, limit} = state
    switch (action.type) {
        case SELECT_CHANGE:
            return {
                ...state,
                change_number: action.change_number,
                loaded: false,
                isLoading: false,
            }
        case REQUEST_CHANGE:
            return {
                ...state,
                loaded: false,
                isLoading: true
            }
        case RECEIVE_CHANGE:
            return {
                ...state,
                loaded: true,
                change: action.change,
                isLoading: false
            }
        default:
            return state
    }
}

export default change_reducer