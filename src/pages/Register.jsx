import { useState } from 'react';

function Register() {
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [bdate, setBdate] = useState("");
    const [address, setAddress] = useState("");
    const [idNum, setIdNum] = useState("");
    const [organi, setOrgani] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [cpass, setCPass] = useState("");
    const [department, setDepartment] = useState("");
    const [major, setMajor] = useState("");
    const [studentId, setStudentId] = useState("");
    const [yearLevel, setYearLevel] = useState("");

    const submit = (event) => {
        event.preventDefault();
        alert(`Account Registered`)
    }

    return (
        <form onSubmit={submit}>

            <label>
                First Name:
                <input type="text" value={fname} onChange={(e) => setFname(e.target.value)} required />
            </label>

            <label>
                Last Name:
                <input type="text" value={lname} onChange={(e) => setLname(e.target.value)} required />
            </label>

            <label>
                Birthdate:
                <input type="date" value={bdate} onChange={(e) => setBdate(e.target.value)} required />
            </label>

            <label>
                Address:
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </label>

            <label>
                ID Number:
                <input type="number" value={idNum} onChange={(e) => setIdNum(e.target.value)} required />
            </label>

            <label>
                Organization:
                <input type="text" value={organi} onChange={(e) => setOrgani(e.target.value)} required />
            </label>

            <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label>
                Password:
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} minLength={8} required />
            </label>

            <label>
                Confirm Password:
                <input type="password" value={cpass} onChange={(e) => setCPass(e.target.value)} minLength={8} required />
            </label>

            <label>
                Department:
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
            </label>

            <label>
                Major:
                <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} required />
            </label>

            <label>
                Student ID:
                <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
            </label>

            <label>
                Year Level:
                <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} required>
                    <option value="">Select Year</option>
                    <option value="Freshman">Freshman (1st Year)</option>
                    <option value="Sophomore">Sophomore (2nd Year)</option>
                    <option value="Junior">Junior (3rd Year)</option>
                    <option value="Senior">Senior (4th Year)</option>
                    <option value="Graduate">Graduate</option>
                </select>
            </label>
            <button type="submit">Submit</button>

        </form>
    )
}

export default Register