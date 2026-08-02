import React from 'react';

export default function PublicHome() {
    return (
        <div style={{ backgroundColor: '#090d16', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header / Navbar */}
            <header style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.05em', color: '#3b82f6' }}>DONO ERP</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <a
                        href="/login"
                        style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '500', fontSize: '15px', padding: '8px 14px', transition: 'color 0.2s' }}
                    >
                        Login
                    </a>
                    <a
                        href="/register"
                        style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', fontSize: '14px', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                    >
                        Register School
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <main style={{ maxWidth: '896px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', backgroundColor: 'rgba(30, 58, 138, 0.4)', color: '#93c5fd', fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    Enterprise Multi-Branch School Management
                </div>
                <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '20px', lineHeight: '1.15', color: '#ffffff' }}>
                    The Ultimate School Management System for Modern Institutions
                </h1>
                <p style={{ fontSize: '1.125rem', color: '#94a3b8', marginBottom: '40px', maxWidth: '672px', marginInline: 'auto', lineHeight: '1.6' }}>
                    Automate student tracking, fees payment, results entry, timetables, and multi-branch operations seamlessly on Dono School ERP.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', smFlexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                    <a
                        href="/register"
                        style={{ width: '100%', maxWidth: '320px', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', fontSize: '1.05rem', padding: '16px 28px', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                        Register Your School Free
                    </a>
                    <a
                        href="/login"
                        style={{ width: '100%', maxWidth: '320px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontWeight: '700', fontSize: '1.05rem', padding: '16px 28px', borderRadius: '12px', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                        School Login Portal
                    </a>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.85rem', borderTop: '1px solid #1e293b' }}>
                &copy; {new Date().getFullYear()} Dono School ERP. All rights reserved. Developed by DONO De Creator.
            </footer>
        </div>
    );
}

