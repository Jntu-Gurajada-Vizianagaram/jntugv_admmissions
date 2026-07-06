import React from 'react';
import './NavBar.css';

export default function NavBar() {
  return (
    <nav className="nav-menu">
      <div className="container">
        <ul>
          <li className="active"><a href="#home">HOME</a></li>
          <li className="drop-down"><a href="#administration">ADMINISTRATION <i className="dropdown-icon">▼</i></a></li>
          <li className="drop-down"><a href="#programmes">PROGRAMMES <i className="dropdown-icon">▼</i></a></li>
          <li><a href="#contact">CONTACT US</a></li>
        </ul>
      </div>
    </nav>
  );
}
