/**
 * Created by diana on 11.05.2017.
 */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchChangeIfNeeded, selectChange } from '../actions/change'
import Moment from 'react-moment'

class ChangeHeaderLeft extends React.Component {
    static propTypes = {
        change: PropTypes.object.isRequired
    }

    render()  {
        let { change } = this.props

        return (
            <div className="box">
                <div className="row">
                    <div className="col">Status</div>
                    <div className="col-8">
                        <strong>
                            {change.change.status}
                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col">Uploaded at</div>
                    <div className="col-8">
                        <strong>
                            <Moment format="do MMM Y HH:mm:ss">{change.eventCreatedOn * 1000}</Moment>
                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col">Last updated</div>
                    <div className="col-8">
                        <strong>
                            <Moment format="do MMM Y HH:mm:ss">{change.lastUpdate * 1000}</Moment>
                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col">Uploader</div>
                    <div className="col-8">
                        <strong>
                            {change.uploader.name} ({change.uploader.email})
                        </strong>
                    </div>
                </div>
            </div>
        )
    }
}

class ChangeHeaderRight extends React.Component {
    static propTypes = {
        commitMessage: PropTypes.string.isRequired
    }

    render() {
        let {commitMessage} = this.props

        return (
            <div className="box">
                {commitMessage.split("\n").map((item, i) =>
                    <p key={i}>{item}</p>
                )}
            </div>
        )
    }
}

class ChangeTable extends React.Component {
    static propTypes = {
        changes_list: PropTypes.array.isRequired,
        authors: PropTypes.object.isRequired,
        results: PropTypes.object.isRequired
    }

    render() {
        let {authors, changes_list, results} = this.props
        return(
            <div className="table-holder">
                <div className="flex-holder">
                    <ChangeTableSidebar authors={authors}/>
                </div>
            </div>
        )
    }
}

class ChangeTableSidebar extends React.Component {
    static propTypes = {
        authors: PropTypes.object.isRequired
    }

    render() {
        let {authors} = this.props;
        let ordered_authors = [];

        Object.entries(authors).forEach(([username, author]) => {
            if (username == 'jenkins')
                ordered_authors.unshift(author)
            else
                ordered_authors.push(author)
        })
        return (
            <div className="flex-sidebar">
                <div className="empty-top"></div>
                {ordered_authors.map((author, key) =>
                    <div className="author">
                        <div className="item">{author.name}</div>
                        {author.jobs.map((job, key) =>
                            <div className="item">{job.job}</div>
                        )}
                    </div>
                )}
            </div>
        )
    }
}

export class Change extends React.Component {
    static propTypes = {
        change_number: PropTypes.string.isRequired,
        isLoading: PropTypes.bool.isRequired,
        dispatch: PropTypes.func.isRequired
    }

    componentWillMount() {
        let { change_number } = this.props.match.params
        let { dispatch } = this.props
        dispatch(selectChange(change_number))
    }

    componentDidMount() {
        const { dispatch } = this.props
        dispatch(fetchChangeIfNeeded())
    }

    render() {
        let { change, authors, changes_list, results_per_patchset } = this.props
        if (!change)
            return null

        return(
            <div className="change">
                <h1>{change.change.project} {change.change.number}</h1>
                <div className="row">
                    <div className="col-3">
                        <ChangeHeaderLeft change={change}/>
                    </div>
                    <div className="col-6">
                        <ChangeHeaderRight commitMessage={change.change.commitMessage}/>
                    </div>
                </div>
                <div className="box">
                    <ChangeTable authors={authors} changes_list={changes_list} results={results_per_patchset}/>
                </div>
            </div>
        )
    }
}


const mapStateToProps = state => {

    const { change_reducer } = state
    return change_reducer
}

export default withRouter(connect(mapStateToProps)(Change))