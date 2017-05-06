/**
 * Created by diana on 30.04.2017.
 */
import { combineReducers } from 'redux'
import project_reducer from './projects'

const gerritmetrixApp = combineReducers({
    project_reducer
})

export default gerritmetrixApp