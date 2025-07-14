import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <div className="flex flex-row">
        <nav className="">
          <ul className="flex justify-evenly w-50 h-screen bg-pink-700 flex-col [&>*]:m-3 text-center text-gray-100">
            <li> <Link to="/">Login</Link> </li>
            <li> <Link to="/Register">Register</Link> </li>
            <li>-------</li>
            <li> <Link to="/sDash">sDash</Link> </li>
            <li> <Link to="/sDevi">sDevi</Link> </li>
            <li> <Link to="/sSubm">sSubm</Link> </li>
            <li>-------</li>
            <li> <Link to="/rDash">rDash</Link> </li>
            <li> <Link to="/rRevi">rRevi</Link> </li>
            <li> <Link to="/rSubm">rSubm</Link> </li>
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