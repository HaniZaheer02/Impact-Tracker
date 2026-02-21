import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/AuthService';
import {
    ChevronLeft, ChevronRight, LayoutDashboard,
    Heart, History, User, Users, LogOut, PlusCircle
} from 'lucide-react';
import '../styles/dashboard.css';

const DashboardLayout = ({ children }) => {
    const { role, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Default open on desktop, closed on mobile
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsCollapsed(true);
            else setIsCollapsed(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarWidth = isCollapsed ? '80px' : '260px';

    const NavItem = ({ to, icon: Icon, label }) => (
        <div
            className={`nav-link-custom cursor-pointer ${location.pathname === to ? 'active' : ''}`}
            onClick={() => navigate(to)}
        >
            <Icon className="nav-icon" size={22} />
            {!isCollapsed && <span className="ms-3 fw-medium">{label}</span>}
        </div>
    );

    return (
        <div className="dashboard-wrapper">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar" style={{ width: sidebarWidth, height: '100vh' }}>
                <div className="p-4 mb-4 overflow-hidden" style={{ height: '80px' }}>
                    {!isCollapsed ? (
                        <h4 className="auth-heading-gradient mb-0">TRACK YOUR IMPACT</h4>
                    ) : (
                        <div className="text-center auth-heading-gradient">TYI</div>
                    )}
                </div>

                <div className="d-flex flex-column">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

                    {role === 'donor' && (
                        <>
                            <NavItem to="/my-impact" icon={History} label="My Impact" />
                            <NavItem to="/donate" icon={Heart} label="Donate" />
                        </>
                    )}

                    {role === 'admin' && (
                        <NavItem to="/user-management" icon={Users} label="Users" />
                    )}

                    <NavItem to="/my-profile" icon={User} label="Profile" />
                </div>

                <div className="mt-auto mb-4">
                    <div
                        className="nav-link-custom text-danger d-flex align-items-center cursor-pointer"
                        onClick={() => authService.logout()}
                    >
                        <LogOut className="nav-icon" size={22} />
                        {!isCollapsed && <span className="ms-3 fw-medium">Logout</span>}
                    </div>
                </div>

                <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </div>
            </aside >

            {/* --- HEADER & CONTENT --- */}
            < div className="w-100" >
                <header className="top-header" style={{ left: sidebarWidth }}>
                    <div className="d-flex align-items-center gap-4">
                        {role === 'donor' && (
                            <button
                                className="btn btn-grad-custom btn-sm px-4 rounded-pill d-flex align-items-center"
                                onClick={() => navigate('/donate')}
                            >
                                <PlusCircle size={18} className="me-2" />
                                <span className="d-none d-sm-inline">Donate Now</span>
                            </button>
                        )}

                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-md-block">
                                <div className="text-white small fw-bold">{user?.displayName}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{role?.toUpperCase()}</div>
                            </div>
                            <img
                                src={user?.photoURL || 'https://via.placeholder.com/40'}
                                className="rounded-circle border border-info p-1"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                </header>

                <main className="main-content" style={{ marginLeft: isCollapsed ? '0' : '0' }}>
                    <div className="container-fluid" style={{ paddingLeft: sidebarWidth }}>
                        {children}
                    </div>
                </main>
            </div >
        </div >
    );
};

export default DashboardLayout;