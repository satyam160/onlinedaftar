import React, { createContext, useContext, useState, useEffect } from 'react';
import { walletApi, notificationsApi, DEMO_TRANSACTIONS, DEMO_NOTIFICATIONS } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { isAuthenticated, isDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mode, setMode] = useState('worker'); // 'worker' or 'poster'
  const [balance, setBalance] = useState(14280); // in Rupees
  const [earnedThisMonth, setEarnedThisMonth] = useState(8450);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [toasts, setToasts] = useState([]);

  // Modals state
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    purpose: '',
    amount: 0,
    onSuccess: null
  });

  const [taskDetailModal, setTaskDetailModal] = useState({
    isOpen: false,
    task: null
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync wallet & notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      if (isDemoMode) {
        setBalance(14280);
        setTransactions(DEMO_TRANSACTIONS);
        setUnreadNotifications(2);
        return;
      }

      try {
        const walletData = await walletApi.getWallet();
        if (walletData && walletData.balancePaise !== undefined) {
          const inRupees = Math.round(walletData.balancePaise / 100);
          setBalance(inRupees);
          if (walletData.transactions) {
            setTransactions(walletData.transactions);
            const now = new Date();
            const monthlySum = walletData.transactions
              .filter(t => t.type === 'escrow_release' && t.status === 'paid')
              .filter(t => {
                const d = new Date(t.created_at);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              })
              .reduce((sum, t) => sum + Number(t.amount_paise), 0);
            setEarnedThisMonth(Math.round(monthlySum / 100));
          }
        }
      } catch (err) {
        // Fall back to demo values if network error
        setBalance(14280);
      }

      try {
        const notifData = await notificationsApi.getNotifications();
        if (notifData && notifData.unreadCount !== undefined) {
          setUnreadNotifications(notifData.unreadCount);
        }
      } catch (err) {
        // keep default
      }
    }

    loadData();
  }, [isAuthenticated, isDemoMode]);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'worker' ? 'poster' : 'worker';
      setActiveTab(next === 'poster' ? 'post' : 'browse');
      return next;
    });
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const openPaymentModal = ({ purpose, amount, onSuccess }) => {
    setPaymentModal({
      isOpen: true,
      purpose,
      amount,
      onSuccess
    });
  };

  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      purpose: '',
      amount: 0,
      onSuccess: null
    });
  };

  const openTaskDetailModal = (task) => {
    setTaskDetailModal({
      isOpen: true,
      task
    });
  };

  const closeTaskDetailModal = () => {
    setTaskDetailModal({
      isOpen: false,
      task: null
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        mode,
        setMode,
        toggleMode,
        balance,
        setBalance,
        earnedThisMonth,
        transactions,
        setTransactions,
        unreadNotifications,
        setUnreadNotifications,
        toasts,
        showToast,
        paymentModal,
        openPaymentModal,
        closePaymentModal,
        taskDetailModal,
        openTaskDetailModal,
        closeTaskDetailModal,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
