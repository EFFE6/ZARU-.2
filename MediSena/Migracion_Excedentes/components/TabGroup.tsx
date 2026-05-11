import React from 'react';
import '../styles/TabGroup.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface TabGroupProps {
  tabs: (string | TabItem)[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Optional icon to show on the active tab if the tab object doesn't have one */
  defaultIcon?: React.ElementType;
  /** Size of the icon inside the circular container */
  iconSize?: number;
}

const TabGroup: React.FC<TabGroupProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  defaultIcon: DefaultIcon,
  iconSize = 18
}) => {
  return (
    <div className="tg-tabs-scroll-area">
      {tabs.map((tab, index) => {
        const id = typeof tab === 'string' ? tab : tab.id;
        const label = typeof tab === 'string' ? tab : tab.label;
        const Icon = typeof tab === 'string' ? DefaultIcon : (tab.icon || DefaultIcon);
        const isActive = activeTab === id;
        
        return (
          <button
            key={id}
            type="button"
            className={`tg-tab-pill ${isActive ? 'active' : ''} ${index === 0 ? 'first' : ''}`}
            onClick={() => onTabChange(id)}
          >
            {isActive && Icon && (
              <div className="tg-active-tab-icon">
                <Icon size={iconSize} />
              </div>
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default TabGroup;
