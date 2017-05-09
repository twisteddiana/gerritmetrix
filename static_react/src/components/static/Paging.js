/**
 * Created by diana on 09.05.2017.
 */
/**
 * Created by diana on 08.05.2017.
 */

import React from 'react'
import PropTypes from 'prop-types'

export const Paging = ({ nb_columns, skip, forward, backward }) => (
    <tr>
        <td>
            <button className="btn btn-default" onClick={backward}>Prev</button>
        </td>
        <td colSpan={nb_columns - 2}></td>
        <td className="text-right">
            <button className="btn btn-default" onClick={forward}>Forward</button>
        </td>
    </tr>
)

Paging.propTypes = {
    nb_columns: PropTypes.number.isRequired,
    skip: PropTypes.number.isRequired,
    forward: PropTypes.func.isRequired,
    backward: PropTypes.func.isRequired
}

export default Paging