import { useState } from 'react';
import Styles from '../assets/components/style'

function Register() {
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [organi, setOrgani] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [cpass, setCPass] = useState("");

    const submit = (event) => {
        event.preventDefault();
        alert(`Account Registered`)
    }

    return (
        <form onSubmit={submit} className="w-fill mx-auto m-5">

            <div className="grid md:grid-cols-2 md:gap-6">
                <div className={Styles("space1")}>
                    <input
                        type="text"
                        id="floating_first_name"
                        className={Styles("input1")}
                        placeholder=" "
                        value={fname}
                        ind
                        onChange={(e) => setFname(e.target.value)}
                        required
                        autoComplete='new-password'
                    />
                    <label
                        htmlFor="floating_first_name"
                        className={Styles("label1")}
                    >
                        First Name
                    </label>
                </div>
                <div className={Styles("space1")}>
                    <input
                        type="text"
                        id="floating_last_name"
                        className={Styles("input1")}
                        placeholder=" "
                        value={lname}
                        onChange={(e) => setLname(e.target.value)}
                        required
                        autoComplete='new-password'
                    />
                    <label
                        htmlFor="floating_last_name"
                        className={Styles("label1")}
                    >
                        Last Name
                    </label>
                </div>
            </div>

            <div className={Styles("space1")}>
                <input
                    type="email"
                    id="floating_email"
                    className={Styles("input1")}
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete='new-password'
                />
                <label
                    htmlFor="floating_email"
                    className={Styles("label1")}
                >
                    Email
                </label>
            </div>

            <div className={Styles("space1")}>
                <input
                    type="text"
                    id="floating_company"
                    className={Styles("input1")}
                    placeholder=" "
                    value={organi}
                    onChange={(e) => setOrgani(e.target.value)}
                    required
                    autoComplete='new-password'
                />
                <label
                    htmlFor="floating_company"
                    className={Styles("label1")}
                >
                    Organization
                </label>
            </div>

            <div className={Styles("space1")}>
                <input
                    type="password"
                    id="floating_password"
                    className={Styles("input1")}
                    placeholder=" "
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    minLength={8}
                    required
                    autoComplete='new-password'
                />
                <label
                    htmlFor="floating_password"
                    className={Styles("label1")}
                >
                    Password
                </label>
            </div>

            <div className={Styles("space1")}>
                <input
                    type="password"
                    id="floating_repeat_password"
                    className={Styles("input1")}
                    placeholder=" "
                    value={cpass}
                    onChange={(e) => setCPass(e.target.value)}
                    minLength={8}
                    required
                    autoComplete='new-password'
                />
                <label
                    htmlFor="floating_repeat_password"
                    className={Styles("label1")}
                >
                    Confirm Password
                </label>
            </div>

            <button
                type="submit"
                className={Styles("btn1")}
            >
                Submit
            </button>
        </form>
    )
}

export default Register