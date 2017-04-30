/**
 * Created by diana on 30.04.2017.
 */

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import gerritmetrixApp from './reducers'

let store = createStore(gerritmetrixApp)

