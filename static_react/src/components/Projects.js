/**
 * Created by diana on 07.05.2017.
 */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchProjectsIfNeeded, filterProjects, nextPage, prevPage, applyQueryString } from '../actions/projects'
import { TextFilter } from './static/Filter'
import { Paging } from './static/Paging'
import Moment from 'react-moment'
import queryString from 'query-string'

class ProjectRow extends React.Component {
    static propTypes = {
        project: PropTypes.object.isRequired
    }

    render() {
        let { project } = this.props
        if (!project.project)
            return null;

        return (
            <tr key={project.project}>
                <td>
                    <Link to={"/projects/"+ project.project}>
                        {project.project}
                    </Link>
                </td>
                <td>{project.number}</td>
                <td>{project.status[0]}</td>
                <td>
                    <Moment format="do MMM Y HH:mm:ss">{project.lastUpdate * 1000}</Moment>
                </td>
            </tr>
        )
    }
}

export class Projects extends React.Component {
    static propTypes = {
        search: PropTypes.string.isRequired,
        projects: PropTypes.array.isRequired,
        isLoading: PropTypes.bool.isRequired,
        dispatch: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props)
        //this.handleFilter = debounce(200, this.handleFilter)
    }

    componentWillMount() {
         let parsed = queryString.parse(this.props.location.search);
        this.props.dispatch(applyQueryString(parsed))
    }

    componentDidMount() {
        const { dispatch } = this.props
        dispatch(fetchProjectsIfNeeded())
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

    handleFilter = search => {
        this.handleHistory("search", search)
        this.props.dispatch(filterProjects(search))
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
            nextProps.dispatch(fetchProjectsIfNeeded())
    }

    render() {
        const { search, projects, skip } = this.props
        return (
            <div className="data-list">
                <h1>Projects</h1>

                <table className="table">
                    <thead>
                    <tr>
                        <th>Project name</th>
                        <th>Last Change</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                    <tr>
                        <th>
                            <TextFilter value={search} onChange={this.handleFilter} />
                        </th>
                        <th colSpan="3"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {projects.map((project, i) =>
                        <ProjectRow key={i} project={project}/>
                    )}
                    </tbody>
                    <tfoot>
                    <Paging nb_columns={4} skip={skip} forward={this.handleNext} backward={this.handlePrev}/>
                    </tfoot>
                </table>
            </div>
        );
    }
}


const mapStateToProps = state => {

    const { project_reducer } = state
    return project_reducer
}

export default withRouter(connect(mapStateToProps)(Projects))