/**
 * Created by diana on 06.05.2017.
 */
import React from 'react';
import { Link } from 'react-router-dom';

export class Menu extends React.Component {
    render() {
        return (
            <div className="top-menu">
                <ul>
                   <li>
                       <Link to="/">Dashboard</Link>
                   </li>
                    <li>
                         <Link to="/projects">Projects</Link>
                    </li>
                </ul>
            </div>
        )
    }
}

export default Menu