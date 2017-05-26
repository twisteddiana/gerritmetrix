/**
 * Created by diana on 11.05.2017.
 */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchChangeIfNeeded, selectChange } from '../actions/change'
import Moment from 'react-moment'
import MappleToolTip from 'reactjs-mappletooltip'
import jsxToString from 'jsx-to-string';

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
        authors: PropTypes.array.isRequired,
        results: PropTypes.object.isRequired
    }

    componentWillMount() {
        window.addEventListener('scroll', this.handleScroll.bind(this))
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll.bind(this))
    }

    handleScroll() {
        if (this.holder.getBoundingClientRect().top < 0) {
            //this.holder.
        }
    }

    render() {
        let {authors, changes_list, results} = this.props

        return(
            <div className="table-holder">
                <div className="flex-holder" ref={ holder => this.holder = holder }>
                    <ChangeTableSidebar authors={authors}/>
                    {changes_list.map((change_arr, key) =>
                        <PatchSetResult key={key} change_number={change_arr[0]} patchSet={change_arr[1]} authors={authors} results={results[change_arr[0]+'_'+change_arr[1]]} />
                    )}
                </div>
            </div>
        )
    }
}

class ChangeTableSidebar extends React.Component {
    static propTypes = {
        authors: PropTypes.array.isRequired
    }

    render() {
        let {authors} = this.props;
        return (
            <div className="flex-sidebar">
                <div className="flex-top"></div>
                {authors.map((author, key) =>
                    <div className="author" key={key}>
                        <div className="item">{author.name}</div>
                        {author.jobs.map((job, key) =>
                            <div className="item" key={key}>
                                <span>
                                    {job.job}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }
}

class PatchSetResult extends React.Component {
    static propTypes = {
        change_number: PropTypes.string.isRequired,
        patchSet: PropTypes.string.isRequired,
        authors: PropTypes.array.isRequired,
        results: PropTypes.object
    }

    render() {
        let { change_number, patchSet, authors, results } = this.props;
        if (!results)
            return null

        return (
            <div className="flex-item">
                <div className="flex-top">
                    {change_number}
                    <br/>
                    {patchSet}
                </div>
                {authors.map((author, key) =>
                    <div className="author" key={key}>
                        <AuthorResult results={results[author.username]} author={author.username}/>
                        {author.jobs.map((job, key) =>
                            <JobResult results={results[author.username]} job={job.job} key={key}/>
                        )}
                    </div>
                )}
            </div>
        )
    }
}

class JobResult extends React.Component {
    static propTypes = {
        results: PropTypes.object.isRequired,
        job: PropTypes.string.isRequired
    }

    static defaultProps = {
        results: {}
    }

    render() {
        let { results, job } = this.props
        if (typeof results[job] == 'undefined')
            return (
                <div className="ci-result"></div>
            )

        return (
            <div className="ci-result">
                {results[job].map((result, key) =>
                    <CiTestResult result={result.result} key={key}/>
                )}
                <ResultTooltip results={results[job]} type="job"/>
            </div>
        )
    }
}

const ResultTooltip = ({results, type}) => {

    if (type == 'author') {
        var test_key = 'build_result'
    } else {
        var test_key = 'result'
    }

    return(
        <div className="tooltip">
            <div className="tooltip-inner">
                {results.length > 1 &&
                <p>{results.length - 1} recheck</p>
                }
                {results.map((result, key) =>
                    <div key={key}>
                        <strong>{result[test_key]}</strong> at <Moment format="do MMM Y HH:mm:ss">{result.checkedOn * 1000}</Moment>
                    </div>
                )}
            </div>
        </div>
    )
}

class AuthorResult extends React.Component {
    static propTypes = {
        results: PropTypes.object.isRequired,
        author: PropTypes.string.isRequired
    }

    static defaultProps = {
        results: {},
        author: ''
    }

    render() {
        let { results, author } = this.props

        if (typeof results[author] == 'undefined')
            return (
                <div className="ci-result"></div>
            )

        return (
            <div className="ci-result">
                {results[author].map((result, key) =>
                    <CiTestResult result={result.build_result} key={key}/>
                )}
                <ResultTooltip results={results[author]} type="author"/>
            </div>
        )
    }
}

class CiTestResult extends React.Component {
    render() {
        let result = this.props.result
        let className = 'general';
        if (typeof result == 'undefined')
            className = 'fail';
        else if (result.toLowerCase().indexOf('fail') > -1)
            className = 'fail';
        else if (result.toLowerCase().indexOf('succ') > -1)
            className = 'success';

        return (
            <div className={className}></div>
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
        let { change, changes_list, results_per_patchset, ordered_authors } = this.props
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
                    <ChangeTable authors={ordered_authors} changes_list={changes_list} results={results_per_patchset}/>
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