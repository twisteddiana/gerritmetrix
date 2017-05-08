/**
 * Created by diana on 06.05.2017.
 */
import axios from 'axios'

export const REQUEST_PROJECTS = 'REQUEST_PROJECTS'
export const RECEIVE_PROJECTS = 'RECEIVE_PROJECTS'
export const NEXT_PAGE = 'NEXT_PAGE'
export const PREV_PAGE = 'PREV_PAGE'
export const FILTER = 'FILTER'

export const requestProjects = () => ({
    type: REQUEST_PROJECTS
})

export const receiveProjects = projects => ({
    type: RECEIVE_PROJECTS,
    projects: projects
})

const fetchProjects = data => dispatch => {
    dispatch(requestProjects())
    return axios.post('/api/projects', data)
        .then(response => {
            dispatch(receiveProjects(response.data.rows))
        })
}

const shouldFetchProjects = (state) => {
    const projects = state.collection;
    if (!projects)
        return true;
    if (state.isLoading)
        return false;
    if (state.loaded)
        return false;
    return true;
}

export const fetchProjectsIfNeeded = () => (dispatch, getState) => {
    const state = getState().project_reducer
    const data = {
        search: state.search,
        skip: state.skip,
        limit: state.limit
    }

    if (shouldFetchProjects(state)) {
        return dispatch(fetchProjects(data))
    }
}

export const filterProjects = search => ({
    type: FILTER,
    search: search
})