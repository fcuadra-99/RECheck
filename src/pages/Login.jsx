import { useState } from 'react';
import Styles from '../assets/components/style'

function Login() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const submit = (event) => {
        event.preventDefault();
        alert(`Logged In`)
    }

    return (
        <form onSubmit={submit} className="w-fill mx-auto m-5">
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

    <button
        type="submit"
        className={Styles("btn1")}
    >
        Submit
    </button>
</form>
    )
}

export default Login