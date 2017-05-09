/**
 * Created by diana on 09.05.2017.
 */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchChangesIfNeeded, selectProject, nextPage, prevPage, applyQueryString } from '../actions/project'
import { Paging } from './static/Paging'
import Moment from 'react-moment'
import queryString from 'query-string'

class ChangeRow extends React.Component {
    static propTypes = {
        change: PropTypes.object.isRequired
    }

    render() {
        let { change } = this.props
        if (!change.number)
            return null;

        let subject = change.commitMessage.split('\n')[0]

        return (
            <tr key={change.number}>
                <td>
                    <Link to={"/changes/"+ change.number}>
                        {change.number}
                    </Link>
                </td>
                <td>
                    <Link to={"/changes/"+ change.number}>
                        {subject}
                    </Link>
                </td>
                <td>{change.status}</td>
                <td>{change.owner.name}</td>
                <td>
                    <Moment format="do MMM Y HH:mm:ss">{change.lastUpdate * 1000}</Moment>
                </td>
            </tr>
        )
    }
}

export class Project extends React.Component {
    static propTypes = {
        changes: PropTypes.array.isRequired,
        isLoading: PropTypes.bool.isRequired,
        dispatch: PropTypes.func.isRequired
    }

    componentWillMount() {
        let { project_1, project_2 } = this.props.match.params
        let { dispatch } = this.props
        let project_name = project_1 + '/' + project_2;
        dispatch(selectProject(project_name))

        let parsed = queryString.parse(this.props.location.search);
        this.props.dispatch(applyQueryString(parsed))
    }

    componentDidMount() {
        const { dispatch } = this.props
        dispatch(fetchChangesIfNeeded())
    }

    handleHistory = (param, value) => {
        let parsed = queryString.parse(this.props.location.search);
        if (value)
            parsed[param] = value
        else
            delete parsed[param]
        this.props.location.search = queryString.stringify(parsed)
        this.props.history.push({
            pathname: this.props.location.url,
            search: this.props.location.search
        })
    }

    handlePrev = () => {
        let { skip, limit } = this.props

        this.handleHistory("skip", Math.max(0, skip - limit))
        this.props.dispatch(prevPage())
    }

    handleNext = () => {
        let { skip, limit } = this.props
        this.handleHistory("skip", skip + limit)
        this.props.dispatch(nextPage())
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.loaded && this.props.loaded && !nextProps.isLoading)
            nextProps.dispatch(fetchChangesIfNeeded())
    }

    render() {
        let { project_name, changes, skip } = this.props
        return(
            <div className="data-list">
                <h1>{ project_name }</h1>

                <table className="table">
                    <thead>
                    <tr>
                        <th>Change</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {changes.map((change, i) =>
                        <ChangeRow key={i} change={change}/>
                    )}
                    </tbody>
                    <tfoot>
                    <Paging nb_columns={5} skip={skip} forward={this.handleNext} backward={this.handlePrev}/>
                    </tfoot>
                </table>
            </div>
        )
    }
}

const mapStateToProps = state => {

    const { project_changes_reducer } = state
    return project_changes_reducer
}

export default withRouter(connect(mapStateToProps)(Project))