/**
 * Created by diana on 08.05.2017.
 */

import React from 'react'
import PropTypes from 'prop-types'

export const TextFilter = ({ value, onChange }) => (
    <span>
        <input
            type="text"
            className="form-control"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Filter"
        />
    </span>
)

TextFilter.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
}

export default TextFilter