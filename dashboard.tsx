import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import Navbar from "@/components/navbar";
import StatsCards from "@/components/stats-cards";
import HabitList from "@/components/habit-list";
import ProgressChart from "@/components/progress-chart";
import CalendarWidget from "@/components/calendar-widget";
import type { Habit, User } from "@shared/schema";

export default function Dashboard() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    queryFn: async () => {
      const response = await fetch("/api/habits", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch habits");
      return response.json();
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(habit => habit.completionHistory.includes(today));
  const totalActiveHabits = habits.filter(habit => habit.isActive).length;

  // Calculate stats
  const currentStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
  const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.bestStreak), 0);
  const completionRate = totalActiveHabits > 0 
    ? Math.round((completedToday.length / totalActiveHabits) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Good morning, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-slate-600">
            Let's make today count. You have{" "}
            <span className="font-semibold text-primary">{totalActiveHabits}</span> habits to complete.
          </p>
        </div>

        {/* Stats Overview */}
        <StatsCards
          currentStreak={currentStreak}
          todayProgress={`${completedToday.length}/${totalActiveHabits}`}
          bestStreak={bestStreak}
          completionRate={`${completionRate}%`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Habits */}
          <div className="lg:col-span-2">
            <HabitList habits={habits} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProgressChart habits={habits} />
            
            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {currentStreak >= 7 && (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <i className="fas fa-medal text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{currentStreak}-Day Streak!</p>
                      <p className="text-sm text-slate-600">Keep it up!</p>
                    </div>
                  </div>
                )}
                
                {completionRate === 100 && totalActiveHabits > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg">
                    <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                      <i className="fas fa-star text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Perfect Day</p>
                      <p className="text-sm text-slate-600">All habits completed</p>
                    </div>
                  </div>
                )}

                {habits.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p>Start creating habits to see achievements!</p>
                  </div>
                )}
              </div>
            </div>

            <CalendarWidget habits={habits} />
          </div>
        </div>
      </main>
    </div>
  );
}
