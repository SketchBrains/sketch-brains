import React, { useState } from 'react';
import { Brain, Menu, X, LogOut, User, Calendar, BookOpen, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Sketch Brains</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <a href="/dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </a>
                <a href="/events" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span>Events</span>
                </a>
                <a href="/materials" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span>Materials</span>
                </a>
                {profile?.is_admin && (
                  <a href="/admin" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors font-semibold">
                    <User className="w-4 h-4" />
                    <span>Admin</span>
                  </a>
                )}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-300">
                  <a href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{profile?.full_name || 'Profile'}</span>
                  </a>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
            {!user && (
              <div className="flex items-center space-x-3">
                <a href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </a>
                <a href="/signup">
                  <Button size="sm">Sign Up</Button>
                </a>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            {user && (
              <>
                <a href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Dashboard
                </a>
                <a href="/events" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Events
                </a>
                <a href="/materials" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Materials
                </a>
                {profile?.is_admin && (
                  <a href="/admin" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-semibold">
                    Admin Panel
                  </a>
                )}
                <a href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Profile
                </a>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            {!user && (
              <>
                <a href="/login" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Login
                </a>
                <a href="/signup" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                  Sign Up
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
