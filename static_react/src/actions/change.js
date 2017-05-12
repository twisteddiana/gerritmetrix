/**
 * Created by diana on 11.05.2017.
 */
import axios from 'axios'

export const SELECT_CHANGE = 'SELECT_CHANGE'
export const REQUEST_CHANGE = 'REQUEST_CHANGE'
export const RECEIVE_CHANGE = 'RECEIVE_CHANGE'
export const REQUEST_JOB_DATA = 'REQUEST_JOB_DATA'
export const REQUEST_CHANGE_JOB = 'REQUEST_CHANGE_JOB'
export const RECEIVE_CHANGE_JOB = 'RECEIVE_CHANGE_JOB'

export const selectChange = (change_number) => ({
    type: SELECT_CHANGE,
    change_number
})

export const requestChange = () => ({
    type: REQUEST_CHANGE
})

export const receiveChange = change => ({
    type: RECEIVE_CHANGE,
    change: change
})

const requestJobData = () => ({
    type: REQUEST_JOB_DATA
})

const fetchChange = data => dispatch => {
    dispatch(requestChange())
    return axios.post('/api/change', data)
        .then(response => {
            dispatch(receiveChange(response.data))
            dispatch(processChange())
        })
}

const processChange = () => (dispatch, getState) => {
    const state = getState().change_reducer
    dispatch(requestJobData())
    Object.entries(state.authors).forEach(([username, author]) => {

    })
}

const shouldFetchChange = (state) => {
    const change = state.change;
    if (!change)
        return true;
    if (state.isLoading)
        return false;
    if (state.loaded)
        return false;
    return true;
}

export const fetchChangeIfNeeded = () => (dispatch, getState) => {
    const state = getState().change_reducer
    const data = {
        change_number: state.change_number
    }

    if (shouldFetchChange(state)) {
        return dispatch(fetchChange(data))
    }
}

