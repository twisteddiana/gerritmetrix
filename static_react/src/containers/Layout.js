/**
 * Created by diana on 06.05.2017.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import Menu from '../components/static/Menu'
import Logo from '../components/static/Logo'

export const Layout = props => (
    <div className="container-fluid">
        <header className="row">
            <Logo/>
            <Menu/>
        </header>
        <div className="app-content">{props.children}</div>
        <footer>
            Some text
        </footer>
    </div>
)

export default Layout;