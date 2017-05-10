/**
 * Created by diana on 06.05.2017.
 */
import React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux'

export class Menu extends React.Component {
    render() {
        return (
            <div className="col-8 top-menu">
                <ul>
                   <li>
                       <NavLink activeClassName="active" to="/dashboard">Dashboard</NavLink>
                   </li>
                    <li>
                         <NavLink activeClassName="active" to="/projects">Projects</NavLink>
                    </li>
                    <li>
                         <NavLink activeClassName="active" to="/changes">Changes</NavLink>
                    </li>
                </ul>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return state
}


export default withRouter(connect(mapStateToProps, null, null, {pure: false})(Menu))