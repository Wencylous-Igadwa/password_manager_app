type NavbarProps = {
    menuOpen: boolean;
    handleMenuToggle: () => void;
    username: string;
    handleLogout: () => void;
    toggleTheme: () => void;
    isDarkMode: boolean;
};

const Navbar: React.FC<NavbarProps> = ({
    menuOpen,
    handleMenuToggle,
    username,
    handleLogout,
    toggleTheme,
    isDarkMode
}) => (
    <nav className="navbar">
        {/* Menu Button */}
        <div className="menu-button" onClick={handleMenuToggle}>
            ☰
        </div>

        {/* Brand Name */}
        <div className="navbar-brand">Password Manager</div>

        {/* Links/Logout */}
        <div className="navbar-links">
            <button onClick={handleLogout}>Logout</button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
            <div className="dropdown-menu">
                <p>
                    <strong>Account:</strong> {username}
                </p>
                <button onClick={toggleTheme}>
                    {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
            </div>
        )}
    </nav>
);

export default Navbar;
