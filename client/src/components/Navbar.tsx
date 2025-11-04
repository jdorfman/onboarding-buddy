import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GitHubSignInButton from './GitHubSignInButton';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">
          Onboarding Buddy
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                Chat
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/guides"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Setup Guides
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/quiz"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Quiz
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="d-flex align-items-center">
          {user ? (
            <div className="dropdown">
              <button
                className="btn btn-outline-light dropdown-toggle d-flex align-items-center"
                type="button"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="rounded-circle me-2"
                    style={{ width: '24px', height: '24px' }}
                  />
                ) : (
                  <div
                    className="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center"
                    style={{ width: '24px', height: '24px', fontSize: '12px', color: 'white' }}
                  >
                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                )}
                <span className="d-none d-sm-inline">
                  {user.firstName || user.email.split('@')[0]}
                </span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <span className="dropdown-item-text text-muted small">{user.email}</span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={logout}>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <GitHubSignInButton />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
