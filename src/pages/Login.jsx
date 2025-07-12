import { useState } from 'react';

function Login() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const submit = (event) => {
        event.preventDefault();
        alert(`Logged In`)
    }

    return (
        <form onSubmit={submit}>

            <label>Email:
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </label>

            <label>Password:
                <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    minLength={8}
                    required
                />
            </label>

            <button type="submit">Submit</button>

        </form>
    )
}

export default Login