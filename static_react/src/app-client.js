/**
 * Created by diana on 30.04.2017.
 */

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import App from './containers/App';
import gerritmetrixApp from './reducers'
import thunk from 'redux-thunk'
import { createLogger } from 'redux-logger'
import createDebounce from 'redux-debounced';

const middleware = []
middleware.push(createLogger())
middleware.push(createDebounce())
middleware.push(thunk)

let store = createStore(
    gerritmetrixApp,
    applyMiddleware(...middleware)
)

window.onload = () => {
    render(
        <Provider store={store}>
            <Router>
                <App/>
            </Router>
        </Provider>,
        document.getElementById('main')
    )
}