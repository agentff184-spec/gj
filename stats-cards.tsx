import { Flame, Target, Trophy, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  currentStreak: number;
  todayProgress: string;
  bestStreak: number;
  completionRate: string;
}

export default function StatsCards({ currentStreak, todayProgress, bestStreak, completionRate }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Flame className="text-primary text-lg" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Current Streak</p>
            <p className="text-2xl font-bold text-slate-900">{currentStreak} days</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Target className="text-secondary text-lg" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Today's Progress</p>
            <p className="text-2xl font-bold text-slate-900">{todayProgress}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Trophy className="text-accent text-lg" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Best Streak</p>
            <p className="text-2xl font-bold text-slate-900">{bestStreak} days</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-success text-lg" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900">{completionRate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
