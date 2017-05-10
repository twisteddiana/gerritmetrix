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
            value: props.value,
            timer: null,
            interval: 500
        }
        this.reduxupdate = debounce(20, this.reduxupdate)
    }

    componentWillMount() {
        this.value = this.props.value
    }

    componentWillReceiveProps(nextProps) {
        this.setState({value: nextProps.value})
    }

    reduxupdate(value) {
        this.props.onChange(value)
    }

    keyup(value) {
        this.setState({value: value})
        clearTimeout(this.state.timer)
        this.setState({
            timer: setTimeout(() => {
                this.reduxupdate(value)
            }, this.state.interval)
        })
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

class selectOption extends React.Component {
    render() {
        let { value, label, selected } = this.props
        let is_selected = false
        if (selected.indexOf(value) > -1)
            is_selected = true;
        window.console.log("????");
        if (is_selected)
            return(
                <option value={value} selected="selected">{label}</option>
            )
        else
            return(
                <option value={value}>{label}</option>
            )

    }
}

selectOption.propTypes = {
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    selected: PropTypes.array,
}

export class MultiselectFilter extends React.Component {
    render() {
        let { value, values, onChange } = this.props
        return (
            <span>
                <select className="form-control" multiple="multiple" onChange={e => onChange(e.target.value)} value={value}>
                    {values.map((option, i) =>
                        <option key={i} value={option.value}>{option.label}</option>
                    )}
                </select>
            </span>
        )
    }
}


MultiselectFilter.propTypes = {
    values: PropTypes.array.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired
}

export default TextFilter