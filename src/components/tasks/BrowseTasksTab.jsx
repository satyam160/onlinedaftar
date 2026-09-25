import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { tasksApi, DEMO_TASKS } from '../../services/api';
import { Search, Filter, ShieldCheck, Check, ArrowRight } from 'lucide-react';

export const BrowseTasksTab = () => {
  const { showToast, setActiveTab } = useApp();
  const { isDemoMode } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const categories = ['All', 'Field & Retail', 'Data Entry', 'Translation', 'QA Testing', 'Admin', 'Design'];

  const fetchTasks = async (category) => {
    setLoading(true);
    try {
      if (isDemoMode) {
        setTasks(DEMO_TASKS);
      } else {
        const data = await tasksApi.getTasks(category);
        if (Array.isArray(data) && data.length > 0) {
          setTasks(data);
        } else {
          // If backend has no open tasks yet, supplement with demo tasks for rich experience
          setTasks(DEMO_TASKS);
        }
      }
    } catch (err) {
      // Backend not running / offline fallback
      setTasks(DEMO_TASKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(selectedCategory);
  }, [selectedCategory, isDemoMode]);

  const handleAccept = async (task) => {
    setAcceptingId(task.id);
    try {
      if (!isDemoMode && !task.id.startsWith('demo-')) {
        await tasksApi.acceptTask(task.id);
      }
      showToast(`Task accepted! Added to "My Tasks" — proceed to submit proof.`);
      // Remove from available tasks
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      // Navigate to My Tasks
      setTimeout(() => {
        setActiveTab('mytasks');
      }, 900);
    } catch (err) {
      showToast(err.message || 'Could not accept task.');
    } finally {
      setAcceptingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="tab-panel active" id="browse">
      {/* Category Pills & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`auth-tab ${selectedCategory === cat ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '20px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
            />
            <input
              type="text"
              placeholder="Search tasks by keyword…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: '20px',
                fontSize: '13px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: 'var(--text)' }}>
            Loading escrow tasks…
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>
            No tasks found
          </div>
          <div style={{ fontSize: '13px' }}>
            Try selecting another category or clear your search filter.
          </div>
        </div>
      ) : (
        <div className="task-grid">
          {filteredTasks.map((t) => {
            const payInRupees = Math.round(t.pay_paise / 100);
            return (
              <div key={t.id} className="task-card">
                <div className="task-card-top">
                  <span className="task-cat">{t.category}</span>
                  <span className="task-pay mono">₹{payInRupees.toLocaleString('en-IN')}</span>
                </div>
                <h3>{t.title}</h3>
                <p>{t.description || 'Complete the deliverables as outlined by the poster.'}</p>
                <div className="task-card-foot">
                  <span className="task-poster">Posted by {t.poster_name || 'Verified Employer'}</span>
                  <button
                    className="btn"
                    disabled={acceptingId === t.id}
                    onClick={() => handleAccept(t)}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {acceptingId === t.id ? 'Accepting…' : 'Accept Task'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
