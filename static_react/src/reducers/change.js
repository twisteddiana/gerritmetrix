/**
 * Created by diana on 11.05.2017.
 */

import {
    SELECT_CHANGE, REQUEST_CHANGE, RECEIVE_CHANGE,
    RECEIVE_CHANGE_JOB
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
        case SELECT_CHANGE: {
            return {
                ...state,
                change_number: action.change_number,
                loaded: false,
                isLoading: false,
            }
        }
        case REQUEST_CHANGE: {
            return {
                ...state,
                loaded: false,
                isLoading: true
            }
        }
        case RECEIVE_CHANGE: {
            let authors = {}
            let results = {}
            action.change.comments.forEach((comment) => {
                authors[comment.author.username] = {
                    username: comment.author.username,
                    name: comment.author.name,
                    jobs: []
                }
                results[comment.author.username] = []
            })

            let changes_list = action.change.patchSets.map((patchSet) => {
                return [patchSet.change.number, patchSet.patchSet.number]
            })

            return {
                ...state,
                loaded: true,
                change: action.change,
                isLoading: false,
                authors: authors,
                changes_list: changes_list,
                authors: authors,
                results: results,
                results_per_patchset: {}
            }
        }
        case RECEIVE_CHANGE_JOB: {
            let {authors, results, results_per_patchset} = state
            authors[action.request.author].jobs = action.result.jobs.map((job) => ({
                job: job
            }))
            results[action.request.author] = action.result.result
            results[action.request.author].map((result) => {
                let change_val = result.number + '_' + result.patchSet
                if (results_per_patchset[change_val] == undefined)
                    results_per_patchset[change_val] = {}
                if (results_per_patchset[change_val][action.request.author] == undefined)
                    results_per_patchset[change_val][action.request.author] = {}
                if (results_per_patchset[change_val][action.request.author][result.job] == undefined)
                    results_per_patchset[change_val][action.request.author][result.job] = []

                results_per_patchset[change_val][action.request.author][result.job].push(result)
            })

            return {
                ...state,
                authors: authors,
                results: results,
                results_per_patchset: results_per_patchset
            }
        }
        default:
            return state
    }
}

export default change_reducer