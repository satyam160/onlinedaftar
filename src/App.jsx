import React from 'react';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer } from './components/ui/Toast';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { BrowseTasksTab } from './components/tasks/BrowseTasksTab';
import { PostTaskTab } from './components/tasks/PostTaskTab';
import { MyTasksTab } from './components/tasks/MyTasksTab';
import { WalletTab } from './components/wallet/WalletTab';
import { VideoMarketTab } from './components/videomarket/VideoMarketTab';
import { NotificationsTab } from './components/notifications/NotificationsTab';
import { ProfileTab } from './components/profile/ProfileTab';
import { TaskDetailModal } from './components/modals/TaskDetailModal';
import { PaymentModal } from './components/modals/PaymentModal';

export const App = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeTab, mode } = useApp();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--gold-soft)',
          fontFamily: 'Fraunces, serif',
          fontSize: '22px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '12px', fontSize: '32px' }}>✦</div>
          <div>OnlineDaftar</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer />

      {/* Username / Password Auth Gate Modal */}
      {!isAuthenticated ? (
        <AuthModal />
      ) : (
        <div className={`app ${mode === 'poster' ? 'poster-mode' : ''}`}>
          <Sidebar />

          <main className="main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Topbar />

            <div className="content" style={{ flex: 1, padding: '28px 34px' }}>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'browse' && <BrowseTasksTab />}
              {activeTab === 'wallet' && <WalletTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'post' && <PostTaskTab />}
              {activeTab === 'mytasks' && <MyTasksTab />}
              {activeTab === 'videomarket' && <VideoMarketTab />}
              {activeTab === 'profile' && <ProfileTab />}
            </div>
          </main>

          {/* Interactive Modals */}
          <TaskDetailModal />
          <PaymentModal />
        </div>
      )}
    </>
  );
};

export default App;
