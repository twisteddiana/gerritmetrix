/**
 * Created by diana on 08.05.2017.
 */

import React from 'react'
import PropTypes from 'prop-types'
import {debounce} from 'throttle-debounce';

export class TextFilter extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: props.value
        }
        this.reduxupdate = debounce(500, this.reduxupdate)
    }
    componentWillMount() {
        this.value = this.props.value
    }

    componentWillReceiveProps(nextProps) {
        window.console.log(nextProps);
        this.setState({value: nextProps.value})
    }

    reduxupdate(value) {
        this.props.onChange(value)
    }

    keyup(value) {
        this.setState({value: value})
        this.reduxupdate(value)
    }

    render() {
        let value = this.state.value
        return(
            <span>
            <input
                type="text"
                value={value}
                className="form-control"
                onChange={e => this.keyup(e.target.value)}
                placeholder="Filter"
            />
            </span>
        )
    }
}

TextFilter.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
}

export default TextFilter