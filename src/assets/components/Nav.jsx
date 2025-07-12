import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
        <nav className="fixed">
          <ul className="flex justify-around bg-blue-500 flex-col w-40 h-screen [&>*]:m-5 text-center">
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
        <div className="bg-red-500 w-screen"></div>
      <Outlet />
    </>
  )
};

export default Layout;