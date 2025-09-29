import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Devices', path: '/devices' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className={`navbar ${theme === 'dark' ? 'bg-base-100' : 'bg-white'} shadow-lg`}>
      <div className="navbar-start">
        <div className="dropdown">
          <div 
            tabIndex={0} 
            role="button" 
            className={`btn btn-ghost lg:hidden ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </div>
          {isMobileMenuOpen && (
            <ul tabIndex={0} className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow ${theme === 'dark' ? 'bg-base-100' : 'bg-white'} rounded-box w-52`}>
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className={`${location.pathname === link.path ? 'active' : ''} ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link 
          to="/" 
          className={`btn btn-ghost text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
        >
          X-Monitor
        </Link>
      </div>
      <div className="navbar-center lg:flex sm:hidden xs:hidden">
        <ul className="menu menu-horizontal px-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link 
                to={link.path} 
                className={`${location.pathname === link.path ? 'active' : ''} ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
              >
                {link.path === '/' ? 'Dashboard' : link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end">
        <button 
          className={`btn btn-ghost btn-circle ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
