/**
 * Created by diana on 07.05.2017.
 */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchProjectsIfNeeded, filterProjects } from '../actions/projects'
import { TextFilter } from './static/Filter'

export class Projects extends React.Component {
    static propTypes = {
        search: PropTypes.string.isRequired,
        projects: PropTypes.array.isRequired,
        isLoading: PropTypes.bool.isRequired,
        dispatch: PropTypes.func.isRequired
    }

    componentDidMount() {
        const { dispatch } = this.props
        dispatch(fetchProjectsIfNeeded())
    }

    handleFilter = search => {
        this.props.dispatch(filterProjects(search))
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.loaded && this.props.loaded && !nextProps.isLoading)
            nextProps.dispatch(fetchProjectsIfNeeded())
    }

    render() {
        const { search, projects } = this.props
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
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                    {projects.map((project, i) =>
                        <tr key={project.project}>
                            <td>{project.project}</td>
                            <td>{project.number}</td>
                            <td>{project.status[0]}</td>
                            <td>{project.lastUpdate}</td>
                        </tr>
                    )}
                    </tbody>
                    <tfoot>

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