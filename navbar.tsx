import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";

interface NavbarProps {
  user?: User;
}

export default function Navbar({ user }: NavbarProps) {
  const [location] = useLocation();
  
  const handleLogout = () => {
    authService.logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">HabitTrail</h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === '/dashboard' || location === '/' 
                      ? 'text-slate-900 bg-slate-100' 
                      : 'text-slate-600 hover:text-primary'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/analytics" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === '/analytics' 
                      ? 'text-slate-900 bg-slate-100' 
                      : 'text-slate-600 hover:text-primary'
                  }`}
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700">
                {user?.name || 'User'}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
