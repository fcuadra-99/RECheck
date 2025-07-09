import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <nav>
        <ul>
          <li> <Link to="/">Login</Link> </li>
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

      <Outlet />
    </>
  )
};

export default Layout;