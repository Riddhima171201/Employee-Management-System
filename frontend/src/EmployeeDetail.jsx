import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function EmployeeDetail() {
    const {ID} = useParams();
    const navigate = useNavigate()
    const [employee, setEmployee] = useState([])
    useEffect(() => {
        axios.get('http://localhost:8081/get/' + ID)
        .then(res => setEmployee(res.data.Result[0]))
        .catch(err => console.log(err));
    })
    const handleLogout = () => {
        axios.get('http://localhost:8081/logout')
        // eslint-disable-next-line no-unused-vars
        .then(res => {
            navigate('/start')
        }).catch(err => console.log(err));
    }
  return (
    <div>
        <div className='d-flex justify-content-center flex-column align-items-center mt-3'>
            <img src={`http://localhost:8081/images/` + employee.Image} alt="" className='empImg'/>
            <div className='d-flex align-items-center flex-column mt-5'>
                <h3>Name: {employee.Name}</h3>
                <h3>Email: {employee.Email}</h3>
                <h3>Salary: {employee.Salary}</h3>
            </div>
            <div>
                <button className='btn btn-primary me-2'>Edit</button>
                <button className='btn btn-danger' onClick={handleLogout} >Logout</button>
            </div>
        </div>
    </div>
  )
}

export default EmployeeDetail