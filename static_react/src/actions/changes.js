/**
 * Created by diana on 10.05.2017.
 */
import axios from 'axios'

export const REQUEST_CHANGES = 'REQUEST_CHANGES'
export const RECEIVE_CHANGES = 'RECEIVE_CHANGES'
export const NEXT_PAGE = 'NEXT_PAGE'
export const PREV_PAGE = 'PREV_PAGE'
export const FILTER = 'FILTER'
export const QUERTY_STRING = 'QUERY_STRING'

export const requestChanges = () => ({
    type: REQUEST_CHANGES
})

export const receiveChanges = changes => ({
    type: RECEIVE_CHANGES,
    changes: changes
})

const fetchChanges = data => dispatch => {
    dispatch(requestChanges())
    return axios.post('/api/changes', data)
        .then(response => {
            dispatch(receiveChanges(response.data.rows))
        })
}

const shouldFetchChanges = (state) => {
    const changes = state.changes;
    if (!changes)
        return true;
    if (state.isLoading)
        return false;
    if (state.loaded)
        return false;
    return true;
}

export const fetchChangesIfNeeded = () => (dispatch, getState) => {
    const state = getState().changes_reducer
    const data = {
        search: {
            project: state.search,
            status: state.status
        },
        skip: state.skip,
        limit: state.limit
    }

    if (shouldFetchChanges(state)) {
        return dispatch(fetchChanges(data))
    }
}

export const filterChanges = (search, status) => ({
    type: FILTER,
    search: search,
    status: status.constructor == Array?status:[status]
})

export const nextPage = () => ({
    type: NEXT_PAGE
})

export const prevPage = () => ({
    type: PREV_PAGE
})

export const applyQueryString = (queryString) => ({
    type: QUERTY_STRING,
    params: queryString
})