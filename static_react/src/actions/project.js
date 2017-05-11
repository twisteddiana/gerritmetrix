/**
 * Created by diana on 09.05.2017.
 */
import axios from 'axios'

export const SELECT_PROJECT = 'SELECT_PROJECT'
export const REQUEST_PROJECT_CHANGES = 'REQUEST_PROJECT_CHANGES'
export const RECEIVE_PROJECT_CHANGES = 'RECEIVE_PROJECT_CHANGES'
export const NEXT_PAGE = 'NEXT_PAGE'
export const PREV_PAGE = 'PREV_PAGE'
export const QUERTY_STRING = 'QUERY_STRING'

export const requestChanges = () => ({
    type: REQUEST_PROJECT_CHANGES
})

export const receiveChanges = changes => ({
    type: RECEIVE_PROJECT_CHANGES,
    changes: changes
})

const fetchChanges = data => dispatch => {
    dispatch(requestChanges())
    return axios.post('/api/project', data)
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
    const state = getState().project_changes_reducer
    const data = {
        project_name: state.project_name,
        skip: state.skip,
        limit: state.limit
    }

    if (shouldFetchChanges(state)) {
        return dispatch(fetchChanges(data))
    }
}

export const nextPage = () => ({
    type: NEXT_PAGE
})

export const prevPage = () => ({
    type: PREV_PAGE
})

export const selectProject = (project_name) => ({
    type: SELECT_PROJECT,
    project_name
})

export const applyQueryString = (queryString) => ({
    type: QUERTY_STRING,
    params: queryString
})