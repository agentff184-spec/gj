import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Target, Award } from "lucide-react";
import type { Habit, User } from "@shared/schema";

export default function Analytics() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Calculate analytics data
  const totalHabits = habits.length;
  const activeHabits = habits.filter(h => h.isActive).length;
  const longestStreak = Math.max(...habits.map(h => h.bestStreak), 0);
  const currentStreaks = habits.filter(h => h.streak > 0);
  
  // Calculate weekly completion rates
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const completedHabits = habits.filter(h => 
      h.completionHistory.includes(dateString)
    ).length;
    const totalActiveOnDay = activeHabits;
    const completionRate = totalActiveOnDay > 0 ? (completedHabits / totalActiveOnDay) * 100 : 0;
    
    weeklyData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completionRate: Math.round(completionRate),
      completed: completedHabits,
      total: totalActiveOnDay
    });
  }

  const avgCompletionRate = weeklyData.reduce((sum, day) => sum + day.completionRate, 0) / 7;

  // Habit performance analysis
  const habitPerformance = habits.map(habit => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days.push(habit.completionHistory.includes(dateString));
    }
    
    const weeklyCompletions = last7Days.filter(Boolean).length;
    const weeklyRate = (weeklyCompletions / 7) * 100;
    
    return {
      ...habit,
      weeklyCompletions,
      weeklyRate: Math.round(weeklyRate)
    };
  }).sort((a, b) => b.weeklyRate - a.weeklyRate);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Analytics</h2>
          <p className="text-slate-600">
            Insights into your habit tracking performance and progress over time.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="mr-2 h-4 w-4 text-primary" />
                Active Habits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeHabits}</div>
              <p className="text-xs text-slate-600">of {totalHabits} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-success" />
                Avg. Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgCompletionRate)}%</div>
              <p className="text-xs text-slate-600">last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="mr-2 h-4 w-4 text-accent" />
                Longest Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{longestStreak}</div>
              <p className="text-xs text-slate-600">days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-secondary" />
                Active Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStreaks.length}</div>
              <p className="text-xs text-slate-600">habits with streaks</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 text-sm text-slate-600">{day.date}</div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{ width: `${day.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{day.completionRate}%</span>
                      <span className="text-xs text-slate-500">({day.completed}/{day.total})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Habit Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Habit Performance</CardTitle>
              <p className="text-sm text-slate-600">Weekly completion rates</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habitPerformance.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No habits created yet. Start tracking to see performance data!
                  </p>
                ) : (
                  habitPerformance.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{habit.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={habit.frequency === 'daily' ? 'secondary' : 'outline'} className="text-xs">
                            {habit.frequency}
                          </Badge>
                          <span className="text-xs text-slate-600">
                            {habit.weeklyCompletions}/7 days
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          habit.weeklyRate >= 80 ? 'text-success' :
                          habit.weeklyRate >= 60 ? 'text-accent' :
                          'text-slate-600'
                        }`}>
                          {habit.weeklyRate}%
                        </div>
                        <div className="text-xs text-slate-500">
                          {habit.streak > 0 ? `${habit.streak} day streak` : 'No streak'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Performance Highlights</h4>
                {avgCompletionRate >= 80 && (
                  <div className="flex items-start space-x-3 p-3 bg-success/10 rounded-lg">
                    <Award className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-success">Excellent Performance!</p>
                      <p className="text-xs text-slate-600">You're maintaining an {Math.round(avgCompletionRate)}% completion rate</p>
                    </div>
                  </div>
                )}
                {longestStreak >= 7 && (
                  <div className="flex items-start space-x-3 p-3 bg-accent/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-accent">Strong Consistency!</p>
                      <p className="text-xs text-slate-600">Your longest streak is {longestStreak} days</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Areas for Improvement</h4>
                {avgCompletionRate < 50 && (
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <Target className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-700">Focus on Consistency</p>
                      <p className="text-xs text-slate-600">Try starting with fewer, easier habits</p>
                    </div>
                  </div>
                )}
                {currentStreaks.length === 0 && totalHabits > 0 && (
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Build Momentum</p>
                      <p className="text-xs text-slate-600">Start a streak by completing habits for 2-3 days in a row</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}