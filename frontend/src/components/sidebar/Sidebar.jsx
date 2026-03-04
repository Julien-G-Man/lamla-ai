import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

/**
 * Shared sidebar for Dashboard, AdminDashboard, and Profile.
 *
 * Props:
 *   user       - auth user object
 *   navItems   - [{ id, icon, label }]
 *   activeId   - currently highlighted nav item id
 *   onNavigate - (id) => void
 *   onLogout   - () => void
 *   variant    - 'user' | 'admin'  (controls accent colour)
 */
const Sidebar = ({ user, navItems, activeId, onNavigate, onLogout, variant = 'user' }) => {
  return (
    <>
      <aside className={`db-sidebar db-sidebar--${variant}`}>
        <div className="db-sidebar-user">
          <div className="db-avatar">
            {user?.profile_image
              ? <img src={user.profile_image} alt="avatar" />
              : user?.username?.[0]?.toUpperCase()}
          </div>
          <h3>{user?.username}</h3>
          <p>{user?.email}</p>
          <span className={`db-role-badge ${variant === 'admin' ? 'admin' : ''}`}>
            {variant === 'admin' ? 'Admin' : 'Student'}
          </span>
        </div>

        <nav className="db-nav">
          {navItems.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`db-nav-item ${activeId === id ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <FontAwesomeIcon icon={icon} />
              {label}
            </button>
          ))}
        </nav>

        <button className="db-logout-btn" onClick={onLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </aside>

      <nav className={`db-mobile-nav db-mobile-nav--${variant}`} aria-label="Dashboard navigation">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={`mobile-${id}`}
            className={`db-mobile-nav-item ${activeId === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <FontAwesomeIcon icon={icon} />
            <span>{label}</span>
          </button>
        ))}
        <button className="db-mobile-nav-item" onClick={onLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
