interface SidebarProps {
  handleContentSelect: (content: 'addPassword' | 'recentActivities' | 'availablePasswords') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ handleContentSelect }) => (
  <div className="sidebar">
    <h2>Menu</h2>
    <button className="menu-button" onClick={() => handleContentSelect('addPassword')}>Add Password</button>
    <button className="menu-button" onClick={() => handleContentSelect('recentActivities')}>Recent Activities</button>
    <button className="menu-button" onClick={() => handleContentSelect('availablePasswords')}>Available Passwords</button>
  </div>
);

export default Sidebar;
