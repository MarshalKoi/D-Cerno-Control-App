import React from 'react';

export type NavigationPage = 'discussion' | 'layout' | 'recordings';

interface NavigationProps {
  currentPage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const navigationItems = [
    {
      id: 'discussion' as NavigationPage,
      icon: '🎤',
      label: 'Discussion Mode',
      description: 'Change discussion mode'
    },
    {
      id: 'layout' as NavigationPage,
      icon: '🏗️',
      label: 'Room Layout',
      description: 'Design seat arrangement'
    },
    {
      id: 'recordings' as NavigationPage,
      icon: '📹',
      label: 'Recordings',
      description: 'View session recordings'
    }
  ];

  return (
    <nav className="navigation-sidebar">
      <div className="navigation-header">
        <div className="app-icon">🎯</div>
      </div>

      <div className="navigation-menu">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`navigation-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
            title={`${item.label} - ${item.description}`}
          >
            <div className="navigation-icon">{item.icon}</div>
            <div className="navigation-tooltip">
              <span className="navigation-label">{item.label}</span>
              <span className="navigation-description">{item.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="navigation-footer">
        <div className="version-info" title="Application Version">
          <span>v1.0</span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;