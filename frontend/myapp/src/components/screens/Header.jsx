
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";

function Header() {
  const [isloggedIn, setIsloggedIn] = useState(
    Boolean(localStorage.getItem("userData"))
  );
  const navigate = useNavigate();

  useEffect(() => {
    const updateLoginStatus = () => {
      setIsloggedIn(Boolean(localStorage.getItem("userData")));
    };

    window.addEventListener("storage", updateLoginStatus);

    return () => {
      window.removeEventListener("storage", updateLoginStatus);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Logout failed");
      }

      localStorage.removeItem("userData");
      setIsloggedIn(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-black" data-bs-theme="dark">
        <div className="container-fluid">
          <LinkContainer to="/">
            <Link className="navbar-brand text-white">
              Electricity Board
            </Link>
          </LinkContainer>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarColor01"
            aria-controls="navbarColor01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarColor01">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <LinkContainer to="/">
                  <Link className="nav-link active">Home</Link>
                </LinkContainer>
              </li>

              <li className="nav-item">
                <LinkContainer to="/StatisticsCollection">
                  <Link className="nav-link text-white">
                    DashBoard Statistics
                  </Link>
                </LinkContainer>
              </li>

              {isloggedIn ? (
                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link text-white btn btn-link"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <li className="nav-item">
                  <LinkContainer to="/login">
                    <Link className="nav-link text-white">Login</Link>
                  </LinkContainer>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Header;
