/**
 * Created by diana on 30.04.2017.
 */
import { combineReducers } from 'redux'
import project_reducer from './projects'
import project_changes_reducer from './project'
import changes_reducer from './changes'

const gerritmetrixApp = combineReducers({
    project_reducer,
    project_changes_reducer,
    changes_reducer
})

export default gerritmetrixApp