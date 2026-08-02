import React from 'react';

export default function PublicHome() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-col justify-between">
            {/* Header / Navbar */}
            <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black tracking-wider">DONO ERP</span>
                </div>
                <div className="space-x-4">
                    <a
                        href="/login"
                        className="text-white hover:text-blue-200 font-medium px-4 py-2 transition"
                    >
                        Login
                    </a>
                    <a
                        href="/register"
                        className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-5 py-2 rounded-lg shadow transition"
                    >
                        Register School
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-5xl mx-auto px-6 py-16 text-center">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                    The Ultimate School Management System for Modern Institutions
                </h1>
                <p className="text-lg sm:text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
                    Automate student tracking, fees payment, results entry, timetables, and multi-branch operations seamlessly on Dono School ERP.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <a
                        href="/register"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg transition text-center"
                    >
                        Register Your School Free
                    </a>
                    <a
                        href="/login"
                        className="w-full sm:w-auto bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 text-white font-bold text-lg px-8 py-3 rounded-lg transition text-center"
                    >
                        School Login Portal
                    </a>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-blue-300 text-sm border-t border-blue-800/50">
                &copy; {new Date().getFullYear()} Dono School ERP. All rights reserved. Developed by DONO De Creator.
            </footer>
        </div>
    );
}

