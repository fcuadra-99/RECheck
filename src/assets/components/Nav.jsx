import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <div className="flex flex-row">
        <nav className="">
          <ul className="flex justify-evenly w-50 h-screen bg-pink-600 flex-col [&>*]:m-3 text-center text-gray-100">
            <li> <Link to="/" viewTransition>Login</Link> </li>
            <li> <Link to="/Register" viewTransition>Register</Link> </li>
            <li>-------</li>
            <li> <Link to="/sDash" viewTransition>sDash</Link> </li>
            <li> <Link to="/sDevi" viewTransition>sDevi</Link> </li>
            <li> <Link to="/sSubm" viewTransition>sSubm</Link> </li>
            <li>-------</li>
            <li> <Link to="/rDash" viewTransition>rDash</Link> </li>
            <li> <Link to="/rRevi" viewTransition>rRevi</Link> </li>
            <li> <Link to="/rSubm" viewTransition>rSubm</Link> </li>
          </ul>
        </nav>
        <div className="grow-2 px-15 py-10 flex-col bg-gray-200">
          <Outlet />
        </div>
      </div>

    </>
  )
};

export default Layout;