/**
 * Created by diana on 06.05.2017.
 */
import React, { Component } from 'react'
import { Route, Switch, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Layout from './Layout';
import Dashboard from '../components/Dashboard'
import NotFoundPage from '../components/NotFoundPage';
import Projects from '../components/Projects'

class App extends Component {
    render() {
        return (
             <Layout>
                 <Switch>
                     <Route exact path="/" component={Dashboard} />
                     <Route exact path="/dashboard" component={Dashboard} />
                     <Route exact path="/projects" component={Projects} />
                     <Route component={NotFoundPage} />
                 </Switch>
             </Layout>
        )
    }
}

const mapStateToProps = state => {
    return state
}

export default withRouter(connect(mapStateToProps)(App))