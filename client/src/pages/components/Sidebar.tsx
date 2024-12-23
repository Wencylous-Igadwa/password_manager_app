interface SidebarProps {
  handleContentSelect: (content: 'addPassword' | 'recentActivities' | 'availablePasswords' | 'passwordStrength' | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ handleContentSelect }) => (
  <div className="sidebar">
    <h2>Menu</h2>
    <button className="menu-button" onClick={() => handleContentSelect('addPassword')}>Add Password</button>
    <button className="menu-button" onClick={() => handleContentSelect('recentActivities')}>Recent Activities</button>
    <button className="menu-button" onClick={() => handleContentSelect('availablePasswords')}>Available Passwords</button>
    <button className="menu-button"  onClick={() => handleContentSelect('passwordStrength')}>Password Analysis Report</button>
  </div>
);

export default Sidebar;
