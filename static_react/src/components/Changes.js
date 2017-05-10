/**
 * Created by diana on 10.05.2017.
 */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchChangesIfNeeded, filterChanges, nextPage, prevPage, applyQueryString } from '../actions/changes'
import { TextFilter, MultiselectFilter } from './static/Filter'
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

        let subject = change.commitMessage.split("\n")[0]

        return (
            <tr key={change.number}>
                <td>
                    <Link to={"/projects/"+ change.project}>
                        {change.project}
                    </Link>
                </td>
                <td>{subject}</td>
                <td>{change.owner.name}</td>
                <td>
                    <Link to={"/changes/"+ change.number}>
                        {change.number}
                    </Link>
                </td>
                <td>{change.status}</td>
                <td>
                    <Moment format="do MMM Y HH:mm:ss">{change.lastUpdate * 1000}</Moment>
                </td>
            </tr>
        )
    }
}

export class Changes extends React.Component {
    static propTypes = {
        search: PropTypes.string.isRequired,
        status: PropTypes.array.isRequired,
        changes: PropTypes.array.isRequired,
        isLoading: PropTypes.bool.isRequired,
        dispatch: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props)
    }

    componentWillMount() {
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

    handleFilter = (search, status) => {
        this.handleHistory("search", search)
        this.handleHistory("skip", 0);
        this.props.dispatch(filterChanges(search, this.props.status))
    }

    handleStatus = (status) => {
        this.handleHistory("status", status)
        this.handleHistory("skip", 0);
        this.props.dispatch(filterChanges(this.props.search, status))
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
        const { search, changes, skip, status } = this.props
        const status_values = [
            {label: 'All', value: 'ALL'},
            {label: 'New', value: 'NEW'},
            {label: 'Merged', value: 'MERGED'},
            {label: 'Abandoned', value: 'ABANDONED'}
        ]
        return (
            <div className="data-list">
                <h1>Projects</h1>

                <table className="table">
                    <thead>
                    <tr>
                        <th>Project name</th>
                        <th>Subject</th>
                        <th>Owner</th>
                        <th>Number</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                    <tr>
                        <th>
                            <TextFilter value={search} onChange={this.handleFilter} />
                        </th>
                        <th colSpan="3"></th>
                        <th>
                            <MultiselectFilter value={status} onChange={this.handleStatus} values={status_values}/>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {changes.map((change, i) =>
                        <ChangeRow key={i} change={change}/>
                    )}
                    </tbody>
                    <tfoot>
                    <Paging nb_columns={6} skip={parseInt(skip)} forward={this.handleNext} backward={this.handlePrev}/>
                    </tfoot>
                </table>
            </div>
        );
    }
}


const mapStateToProps = state => {

    const { changes_reducer } = state
    return changes_reducer
}

export default withRouter(connect(mapStateToProps)(Changes))