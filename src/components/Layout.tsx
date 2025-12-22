import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="header">
        {/* Header content can be added here if needed */}
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
