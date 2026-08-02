import React from 'react';

export default function PublicHome() {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">
            {/* Header / Navbar */}
            <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black tracking-wider text-blue-400">DONO ERP</span>
                </div>
                <div className="space-x-4 flex items-center">
                    <a
                        href="/login"
                        className="text-slate-300 hover:text-white font-medium px-4 py-2 transition"
                    >
                        Login
                    </a>
                    <a
                        href="/register"
                        className="bg-blue-600 hover:bg-blue-50 text-white font-bold px-5 py-2 rounded-lg shadow-md transition"
                    >
                        Register School
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-4xl mx-auto px-6 py-20 text-center">
                <span className="inline-block bg-blue-900/60 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-6 border border-blue-700/50">
                    Smart Multi-Branch Institution Management
                </span>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
                    The Ultimate School Management System for Modern Institutions
                </h1>
                <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Automate student tracking, fees payment, results entry, timetables, and multi-branch operations seamlessly on Dono School ERP.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <a
                        href="/register"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 py-3.5 rounded-xl shadow-lg transition text-center"
                    >
                        Register Your School Free
                    </a>
                    <a
                        href="/login"
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-lg px-8 py-3.5 rounded-xl transition text-center"
                    >
                        School Login Portal
                    </a>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-slate-500 text-sm border-t border-slate-800/80">
                &copy; {new Date().getFullYear()} Dono School ERP. All rights reserved. Developed by DONO De Creator.
            </footer>
        </div>
    );
}

