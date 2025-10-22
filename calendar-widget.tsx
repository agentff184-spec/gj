import { useState } from "react";
import type { Habit } from "@shared/schema";

interface CalendarWidgetProps {
  habits: Habit[];
}

export default function CalendarWidget({ habits }: CalendarWidgetProps) {
  const [currentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const today = new Date().toISOString().split('T')[0];
  
  const getCompletionForDate = (day: number) => {
    const date = new Date(year, month, day).toISOString().split('T')[0];
    const completed = habits.filter(habit => 
      habit.completionHistory.includes(date)
    ).length;
    const total = habits.filter(habit => habit.isActive).length;
    
    if (total === 0) return 0;
    return (completed / total) * 100;
  };
  
  const getDateClassName = (day: number) => {
    const date = new Date(year, month, day).toISOString().split('T')[0];
    const isToday = date === today;
    const completion = getCompletionForDate(day);
    
    let baseClass = "h-8 flex items-center justify-center text-sm rounded cursor-pointer transition-colors ";
    
    if (isToday) {
      baseClass += "bg-primary text-white ";
    } else if (completion === 100) {
      baseClass += "bg-success/20 text-success hover:bg-success/30 ";
    } else if (completion > 0) {
      baseClass += "bg-accent/20 text-accent hover:bg-accent/30 ";
    } else {
      baseClass += "hover:bg-slate-100 ";
    }
    
    return baseClass;
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month's last days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevMonthDay = new Date(year, month, -i).getDate();
    calendarDays.push(
      <div key={`prev-${prevMonthDay}`} className="h-8 flex items-center justify-center text-slate-400 text-sm">
        {prevMonthDay}
      </div>
    );
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      <div key={day} className={getDateClassName(day)}>
        {day}
      </div>
    );
  }
  
  // Next month's first days to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push(
      <div key={`next-${day}`} className="h-8 flex items-center justify-center text-slate-400 text-sm">
        {day}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {monthNames[month]} {year}
      </h3>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-600 mb-2">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.slice(0, 42)} {/* Only show 6 weeks */}
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-xs text-slate-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-success/20 rounded"></div>
            <span>Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-accent/20 rounded"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
