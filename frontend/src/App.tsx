import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Boxes,
  Check,
  CircleUserRound,
  ArrowUpRight,
  Bell,
  Cable,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LogOut,
  Shield,
  User,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Command,
  Database,
  Eye,
  FileText,
  GitBranch,
  History,
  Image,
  LayoutGrid,
  Menu,
  Package,
  Ship,
  ShoppingBag,
  ShoppingCart,
  UserCog,
  CalendarClock,
  MoreHorizontal,
  Mail,
  PanelLeftClose,
  Play,
  Plus,
  RefreshCw,
  Search,
  Save,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Trash2,
} from 'lucide-react';
import type { Session } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import AuthPage from './AuthPage';
import FlowsPage from './FlowsPage';
import AICanvasPage from './AICanvasPage';
import ActivityPage from './ActivityPage';
import FieldWatchPage from './FieldWatchPage';
import RunsPage from './RunsPage';
import ConnectionDetail from './ConnectionDetail';
import DashboardPage from './DashboardPage';
import MarketplacePage from './MarketplacePage';
import CheckoutPage from './CheckoutPage';
import PreBookPage from './PreBookPage';
import MyOrdersPage from './MyOrdersPage';
import ShipmentsPage from './ShipmentsPage';
import { ResourcesPage, StatementsPage, ProfilePage } from './AccountPages';
import { TeamAccess } from './TeamAccess';
import { SimpleSettings } from './SimpleSettings';
import { useCart } from '@/lib/cart';
import { navSlug } from '@/lib/nav';

type NavItem = {
  label: string;
  icon: typeof Activity;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'My Account',
    items: [
      { label: 'Overview', icon: LayoutGrid },
      { label: 'Marketplace', icon: ShoppingBag },
      { label: 'Pre-Book', icon: CalendarClock },
      { label: 'My Orders', icon: Package },
      { label: 'Shipments', icon: Ship },
      { label: 'Resources', icon: Image },
      { label: 'Statements', icon: FileText },
      { label: 'Profile & Addresses', icon: UserCog },
    ],
  },
];

type Connection = { name: string; tested: string };
type ConnectionGroup = { provider: string; short: string; color: string; tint: string; connections: Connection[] };

const connectionGroups: ConnectionGroup[] = [
  { provider: 'Airtable', short: 'A', color: '#b7770a', tint: '#fdf1d8', connections: [
    { name: 'Goorin Airtable', tested: '3 months ago' },
  ] },
  { provider: 'Extensiv', short: 'E', color: '#d52d42', tint: '#ffe8eb', connections: [
    { name: 'I3PL - DTC', tested: '4 months ago' },
    { name: 'I3PL - B2B General', tested: '4 months ago' },
    { name: 'I3PL - Cross Dock', tested: '4 months ago' },
    { name: 'I3PL - Cross Dock Buckle', tested: '4 months ago' },
    { name: 'I3PL - Cross Dock Lids Canada', tested: '4 months ago' },
    { name: 'I3PL - ATS', tested: '4 months ago' },
    { name: 'I3PL - SD Returns', tested: '4 months ago' },
  ] },
  { provider: 'Fulfil.io', short: 'F', color: '#2c312d', tint: '#eef0ea', connections: [
    { name: 'Goorin Fulfil.io', tested: 'about 2 months ago' },
  ] },
  { provider: 'Loop Returns', short: 'O', color: '#2f6bff', tint: '#e6efff', connections: [
    { name: 'Sync Platform', tested: '29 days ago' },
  ] },
  { provider: 'Shopify', short: 'S', color: '#5a8f2f', tint: '#eaf5db', connections: [
    { name: 'Goorin Shopify', tested: 'about 1 month ago' },
  ] },
];

const totalIntegrations = connectionGroups.reduce((sum, g) => sum + g.connections.length, 0);

type SettingsTab = 'users' | 'workspace' | 'notifications';

type Role = 'Admin' | 'User';

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Invited';
  initials: string;
  color: string;
  joined: string;
  you?: boolean;
};

const settingsTabs: { id: SettingsTab; label: string; short: string; icon: typeof User }[] = [
  { id: 'users', label: 'Team access', short: 'Team', icon: Users },
  { id: 'workspace', label: 'Company preferences', short: 'Company', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', short: 'Alerts', icon: Bell },
];

const settingsSubtitle: Record<SettingsTab, string> = {
  users: 'Invite coworkers and manage the access level that fits their responsibilities.',
  workspace: 'Ordering defaults, documents and email delivery for your account.',
  notifications: 'Choose how and where you are alerted about orders, shipments and invoices.',
};

const initialMembers: Member[] = [
  { id: 'm1', name: 'Awebb', email: 'awebb@goorin.com', role: 'Admin', status: 'Active', initials: 'AW', color: '#1a1a1a', joined: 'Jul 21, 2026' },
  { id: 'm2', name: 'Ryan Mirabile', email: 'rmirabile@goorin.com', role: 'Admin', status: 'Active', initials: 'RM', color: '#12b76a', joined: 'Aug 29, 2026', you: true },
];

const roleColors: Record<Role, string> = {
  Admin: '#b7791f',
  User: '#55605a',
};

const rolePermissions: { label: string; admin: boolean; user: boolean }[] = [
  { label: 'View dashboards & metrics', admin: true, user: true },
  { label: 'Create & edit flows', admin: true, user: true },
  { label: 'Run & cancel flows', admin: true, user: true },
  { label: 'Manage connections', admin: true, user: false },
  { label: 'Invite & manage users', admin: true, user: false },
  { label: 'Workspace settings', admin: true, user: false },
];

function App() {
  const toast = useToast();
  const cart = useCart();
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(() => {
    const labels = [...navGroups.flatMap((g) => g.items.map((i) => i.label)), 'Checkout'];
    return labels.find((l) => `#${navSlug(l)}` === window.location.hash) ?? 'Overview';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('users');
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('User');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'All' | 'Admin' | 'User'>('All');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberMenu, setMemberMenu] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState('3');
  const [backoff, setBackoff] = useState('60');
  const [retention, setRetention] = useState('1');
  const [resendKey, setResendKey] = useState('re_1a2b3c4d5e6f7g8h');
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [alertEmail, setAlertEmail] = useState('rmirabile@goorin.com');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [outageThreshold, setOutageThreshold] = useState('5 (default)');
  const [selectedConnection, setSelectedConnection] = useState<{ provider: string; short: string; color: string; tint: string; name: string } | null>(null);
  const [collapsedConns, setCollapsedConns] = useState<Set<string>>(new Set());
  const toggleConnGroup = (id: string) =>
    setCollapsedConns((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  useEffect(() => {
    setSelectedConnection(null);
    document.querySelector('.page-content')?.scrollTo({ top: 0 });
    if (activeNav && window.history.state?.nav !== activeNav) {
      const stale = window.history.state?.sub;
      window.history[stale ? 'replaceState' : 'pushState']({ nav: activeNav }, '', `#${navSlug(activeNav)}`);
    }
  }, [activeNav]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => { if (e.state?.nav) setActiveNav(e.state.nav); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const activeLabel = activeNav ?? 'Overview';

  const ActiveIcon = useMemo(() => {
    if (activeNav === 'Checkout') return ShoppingCart;
    const all = navGroups.flatMap((g) => g.items);
    return (all.find((i) => i.label === activeNav) ?? all[0]).icon;
  }, [activeNav]);

  const openSettings = (tab: SettingsTab = 'users') => {
    setSettingsTab(tab);
    setView('settings');
    setActiveNav(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const handleInvite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      toast(`${email} is already a member.`, 'error');
      return;
    }
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    setMembers([...members, {
      id: 'm' + (members.length + 1),
      name,
      email,
      role: inviteRole,
      status: 'Invited',
      initials,
      color: '#6b7280',
      joined: 'Just now',
    }]);
    setInviteEmail('');
    setInviteOpen(false);
    toast(`Invitation sent to ${email}.`);
  };

  const updateMemberRole = (id: string, role: Role) => {
    const member = members.find((m) => m.id === id);
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
    if (member) toast(`${member.name} is now ${role === 'Admin' ? 'an Admin' : 'a User'}.`);
  };

  const removeMember = (id: string) => {
    const member = members.find((m) => m.id === id);
    setMembers(members.filter((m) => m.id !== id));
    if (member) toast(`${member.name} removed from workspace.`, 'info');
  };

  const filteredMembers = members.filter((m) => {
    const matchesRole = memberRoleFilter === 'All' || m.role === memberRoleFilter;
    const q = memberSearch.trim().toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const saveProfile = () => {
    toast('Changes saved.');
  };

  const clearHistory = () => {
    toast('Run history cleared.', 'info');
  };

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setAuthReady(true);
      }).catch(() => setAuthReady(true));
      const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
      return () => sub.subscription.unsubscribe();
    } catch {
      setAuthReady(true);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setGuest(false);
    setUserMenuOpen(false);
  };

  if (!authReady) return null;
  if (!session && !guest) return <AuthPage />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="brand-lockup">
          <img className="brand-logo expanded-brand-logo" src="/b2b_ops_dark.webp" alt="Goorin B2B Ops" />
          <img className="brand-logo collapsed-brand-logo" src="/goorin-sidebar-icon copy.png" alt="Goorin" />
        </div>


        <div className="sidebar-scroll">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              {!sidebarCollapsed && <p className="nav-label">{group.title}</p>}
              {group.items.map(({ label, icon: Icon }) => (
                <button
                  className={`nav-item ${activeNav === label || (activeNav === 'Checkout' && label === 'Marketplace') ? 'active' : ''}`}
                  key={label}
                  onClick={() => { setActiveNav(label); setView('dashboard'); setMobileOpen(false); }}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon size={21} strokeWidth={1.8} />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => openSettings('users')} title={sidebarCollapsed ? 'Settings' : undefined}><Settings size={21} /><span className={sidebarCollapsed ? 'sr-only' : ''}>Settings</span></button>
        </div>
        <button className="collapse-button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label="Toggle sidebar"><PanelLeftClose size={16} /></button>
      </aside>

      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="breadcrumb">{view === 'settings' ? <><Settings size={17} /><strong>Settings</strong></> : <><ActiveIcon size={17} /><strong>{activeLabel}</strong></>}</div>
          <div className="search-wrap">
            <div className="search-bar" onClick={() => setSearchOpen(true)}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search orders, products, invoices..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                aria-label="Search"
              />
              <kbd><Command size={11} /> K</kbd>
            </div>
            {searchOpen && (
              <>
                <div className="search-overlay" onClick={() => setSearchOpen(false)} />
                <div className="search-tray">
                  <div className="search-tray-section">
                    <p className="search-tray-label">Recent</p>
                    <button className="search-tray-item"><History size={15} /><span>Orders → Warehouse</span><em>Flow</em></button>
                    <button className="search-tray-item"><History size={15} /><span>CRM → Marketing</span><em>Flow</em></button>
                    <button className="search-tray-item"><History size={15} /><span>Monitoring</span><em>Page</em></button>
                  </div>
                  <div className="search-tray-section">
                    <p className="search-tray-label">Suggested flows</p>
                    <button className="search-tray-item"><GitBranch size={15} /><span>Billing → Finance</span><em>Flow</em></button>
                    <button className="search-tray-item"><Cable size={15} /><span>Shopify connection</span><em>Connection</em></button>
                    <button className="search-tray-item"><Database size={15} /><span>Snowflake warehouse</span><em>Connection</em></button>
                  </div>
                  <div className="search-tray-section">
                    <p className="search-tray-label">Quick actions</p>
                    <button className="search-tray-item"><GitBranch size={15} /><span>Create a new flow</span><em>Action</em></button>
                    <button className="search-tray-item"><Cable size={15} /><span>Add a connection</span><em>Action</em></button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setActiveNav(cart.count > 0 ? 'Checkout' : 'Marketplace')} aria-label="Cart" data-testid="cart-button"><ShoppingCart size={17} />{cart.count > 0 && <span className="cart-count" data-testid="cart-count">{cart.count}</span>}</button>
            <div className="notification-wrap">
            <button className="icon-button notification-button" onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen} aria-haspopup="dialog"><Bell size={17} />{!notificationDismissed && <span className="notification-dot" />}</button>
            {notificationsOpen && <div className="notification-popover" role="dialog" aria-label="Notifications">
              <div className="notification-header"><strong>Notifications</strong><div className="notification-header-actions"><button className="notification-clear" onClick={() => setNotificationDismissed(true)}>Clear all</button><span className="notification-count">{notificationDismissed ? 0 : 1}</span></div></div>
              {!notificationDismissed ? <div className="notification-list"><div className="notification-item"><span className="notification-status" /><div className="notification-copy"><div className="notification-title-row"><strong>Billing connection needs attention</strong><time>12 min ago</time></div><p>Billing → Finance reported 6 exceptions in the last run.</p><div className="notification-actions"><button>View flow <ArrowUpRight size={13} /></button><button onClick={() => setNotificationDismissed(true)}>Dismiss</button></div></div></div></div> : <div className="notification-empty"><CheckCircle2 size={20} /><strong>All caught up</strong><p>There are no new notifications.</p></div>}
            </div>}
            </div>
            <span className="top-divider" aria-hidden="true" />
            <div className="profile-menu-wrap">
              <button className={`user-profile ${userMenuOpen ? 'profile-open' : ''}`} onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }} aria-expanded={userMenuOpen} aria-haspopup="menu">
                <div className="user-avatar">RM</div><div className="user-copy"><strong>Ryan M <i className="account-badge">AS</i></strong><span>Mirabile Distribution</span></div><ChevronDown className="profile-chevron" size={14} />
              </button>
              {userMenuOpen && <div className="profile-menu" role="menu">
                <div className="profile-account" data-testid="profile-account-summary">
                  <div className="profile-account-top"><div className="user-avatar profile-account-avatar">RM</div><div><strong>Ryan Mirabile</strong><span>ryan@mirabile.com</span></div></div>
                  <dl className="profile-account-meta">
                    <div><dt>Company</dt><dd>Mirabile Distribution</dd></div>
                    <div><dt>Sales rep</dt><dd><i className="account-badge">AS</i>Ally Stevens</dd></div>
                  </dl>
                </div>
                <div className="profile-menu-section"><button className="profile-menu-item" role="menuitem"><UserPlus size={21} /><span>Invite users</span></button><button className="profile-menu-item" role="menuitem" onClick={() => openSettings('users')}><Shield size={21} /><span>Access &amp; permissions</span></button><button className="profile-menu-item" role="menuitem" onClick={() => openSettings('workspace')}><Settings size={21} /><span>Workspace settings</span></button></div>
                <div className="profile-menu-section"><button className="profile-menu-item" role="menuitem" onClick={() => openSettings('users')}><User size={21} /><span>Account settings</span></button><button className="profile-menu-item" role="menuitem"><KeyRound size={21} /><span>Change password</span></button><button className="profile-menu-item logout-item" role="menuitem" onClick={handleSignOut}><LogOut size={21} /><span>Log out</span></button></div>
              </div>}
            </div>
          </div>
        </header>

        <div className="page-content">
          {view === 'dashboard' && activeNav === 'Runs' ? (
            <RunsPage />
          ) : view === 'dashboard' && activeNav === 'Activity' ? (
            <ActivityPage />
          ) : view === 'dashboard' && activeNav === 'Field Watch' ? (
            <FieldWatchPage />
          ) : view === 'dashboard' && activeNav === 'Flows' ? (
            <FlowsPage />
          ) : view === 'dashboard' && activeNav === 'AI Canvas' ? (
            <AICanvasPage />
          ) : view === 'dashboard' && activeNav === 'Connections' ? (
            selectedConnection ? (
              <ConnectionDetail
                provider={selectedConnection.provider}
                short={selectedConnection.short}
                color={selectedConnection.color}
                tint={selectedConnection.tint}
                name={selectedConnection.name}
                onBack={() => setSelectedConnection(null)}
                onSaved={saveProfile}
              />
            ) : (
            <div className="connections-page">
              <div className="conn-heading">
                <div><h1>Active Connections</h1><p>Manage external system integrations and credentials.</p></div>
                <div className="heading-actions">
                  <button className="secondary-button"><RefreshCw size={15} /> Refresh schemas</button>
                  <button className="primary-button"><Plus size={15} /> New connection</button>
                </div>
              </div>

              <div className="conn-stats">
                <div className="conn-stat"><div className="conn-stat-head"><Boxes size={15} /><span>Total integrations</span></div><strong>{totalIntegrations}</strong><p>Connected applications</p></div>
                <div className="conn-stat"><div className="conn-stat-head conn-stat-ok"><Activity size={15} /><span>Healthy</span></div><strong>{totalIntegrations}</strong><p>Fully operational</p></div>
                <div className="conn-stat"><div className="conn-stat-head"><AlertTriangle size={15} /><span>Attention</span></div><strong>0</strong><p>No errors detected</p></div>
              </div>

              <div className="conn-groups">
                {connectionGroups.map((group) => {
                  const isCollapsed = collapsedConns.has(group.provider);
                  return (
                  <section className={`conn-group card ${isCollapsed ? 'collapsed' : ''}`} key={group.provider}>
                    <div className="conn-group-head" onClick={() => toggleConnGroup(group.provider)}>
                      <span className={`group-chevron ${isCollapsed ? 'collapsed' : ''}`}><ChevronDown size={16} /></span>
                      <span className="conn-provider-icon" style={{ color: group.color, background: group.tint }}>{group.short}</span>
                      <span className="conn-provider-name">{group.provider}</span>
                      <span className="conn-count">{group.connections.length}</span>
                    </div>
                    {!isCollapsed && (
                    <div className="conn-list">
                      {group.connections.map((c) => (
                        <button className="conn-row" key={c.name} onClick={() => setSelectedConnection({ provider: group.provider, short: group.short, color: group.color, tint: group.tint, name: c.name })}>
                          <span className="conn-dot" />
                          <span className="conn-name">{c.name}</span>
                          <span className="conn-pill"><i />Healthy</span>
                          <span className="conn-tested"><RefreshCw size={13} /> Tested {c.tested}</span>
                          <ChevronRight className="conn-chevron" size={17} />
                        </button>
                      ))}
                    </div>
                    )}
                  </section>
                  );
                })}
              </div>
            </div>
            )
          ) : view === 'dashboard' && activeNav === 'Overview' ? (
            <DashboardPage name="Ryan" onNavigate={(label) => setActiveNav(label)} />
          ) : view === 'dashboard' && activeNav === 'Marketplace' ? (
            <MarketplacePage onCheckout={() => setActiveNav('Checkout')} />
          ) : view === 'dashboard' && activeNav === 'Pre-Book' ? (
            <PreBookPage onNavigate={(label) => setActiveNav(label)} />
          ) : view === 'dashboard' && activeNav === 'My Orders' ? (
            <MyOrdersPage />
          ) : view === 'dashboard' && activeNav === 'Shipments' ? (
            <ShipmentsPage />
          ) : view === 'dashboard' && activeNav === 'Resources' ? (
            <ResourcesPage />
          ) : view === 'dashboard' && activeNav === 'Statements' ? (
            <StatementsPage />
          ) : view === 'dashboard' && activeNav === 'Profile & Addresses' ? (
            <ProfilePage />
          ) : view === 'dashboard' && activeNav === 'Checkout' ? (
            <CheckoutPage onBack={() => setActiveNav('Marketplace')} onComplete={() => setActiveNav('My Orders')} />
          ) : view === 'dashboard' ? (
            <div className="page-heading" data-testid="placeholder-page">
              <div><h1>{activeLabel}</h1><p>This section is coming soon.</p></div>
            </div>
          ) : (
            <div className="set-page set-page--v2" data-testid="settings-page">
              <div className="ac-hero set-hero">
                <div><h1>Settings</h1><p>Manage who can access this account and how it behaves.</p></div>
                <span className="set-autosave"><Check size={14} /> Changes save automatically</span>
              </div>
              <div className="set-grid">
                <aside className="set-side">
                  <div className="set-account">
                    <span className="set-account-avatar">MD</span>
                    <div><strong>Mirabile Distribution</strong><small>Wholesale account · Net 60</small></div>
                  </div>
                  <nav className="set-nav set-nav--v" aria-label="Settings sections">
                    {settingsTabs.map((tab) => (
                      <button key={tab.id} className={`set-nav-item ${settingsTab === tab.id ? 'active' : ''}`} onClick={() => setSettingsTab(tab.id)} data-testid={`settings-tab-${tab.id}`}>
                        <i><tab.icon size={16} strokeWidth={1.9} /></i>
                        <span><b>{tab.label}</b><u>{tab.short}</u><small>{settingsSubtitle[tab.id]}</small></span>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  </nav>
                  <button className="set-side-link" onClick={() => setActiveNav('Profile & Addresses')} data-testid="settings-goto-profile"><User size={15} /> Profile, addresses & payment terms</button>
                </aside>
                <div className="set-main">
                  <div className="set-section-head"><h2>{settingsTabs.find((t) => t.id === settingsTab)?.label}</h2><p>{settingsSubtitle[settingsTab]}</p></div>
                  {settingsTab === 'users' && <TeamAccess />}
                  {settingsTab === 'workspace' && <SimpleSettings section="company" />}
                  {settingsTab === 'notifications' && <SimpleSettings section="notifications" />}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
