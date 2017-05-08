/**
 * Created by diana on 07.05.2017.
 */
import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = props => (
    <div className="col align-items-center">
        <span className="logo">
            <Link to="/">
                GerritMetrix
            </Link>
        </span>
    </div>
)


export default Logo;