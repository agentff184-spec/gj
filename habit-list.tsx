import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit, Flame, Plus } from "lucide-react";
import HabitModal from "./habit-modal";
import type { Habit } from "@shared/schema";

interface HabitListProps {
  habits: Habit[];
}

export default function HabitList({ habits }: HabitListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'missed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const response = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date }),
      });
      if (!response.ok) throw new Error("Failed to toggle habit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit updated",
        description: "Great job on staying consistent!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    },
  });

  const getFilteredHabits = () => {
    switch (filter) {
      case 'completed':
        return habits.filter(habit => habit.completionHistory.includes(today));
      case 'active':
        return habits.filter(habit => habit.isActive && !habit.completionHistory.includes(today));
      case 'missed':
        return habits.filter(habit => !habit.completionHistory.includes(today) && habit.frequency === 'daily');
      default:
        return habits.filter(habit => habit.isActive);
    }
  };

  const filteredHabits = getFilteredHabits();

  const handleToggleHabit = (habitId: string) => {
    toggleHabitMutation.mutate({ habitId, date: today });
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Today's Habits</h3>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Habit
            </Button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 mt-4 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                filter === 'active' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                filter === 'completed' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                filter === 'missed' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        <div className="p-6">
          {filteredHabits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No habits found. {filter === 'all' ? 'Create your first habit!' : `No ${filter} habits.`}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHabits.map((habit) => {
                const isCompleted = habit.completionHistory.includes(today);
                const isDue = habit.frequency === 'weekly' && !isCompleted;
                
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-success text-white'
                            : 'border-2 border-slate-300 hover:border-primary'
                        }`}
                        disabled={toggleHabitMutation.isPending}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                      </button>
                      <div>
                        <h4 className={`font-medium ${
                          isCompleted ? 'text-slate-900 line-through' : 'text-slate-900'
                        }`}>
                          {habit.title}
                        </h4>
                        {habit.description && (
                          <p className="text-sm text-slate-600">{habit.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge 
                            variant={habit.frequency === 'daily' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {habit.frequency === 'daily' ? 'Daily' : 'Weekly'}
                          </Badge>
                          {habit.streak > 0 && (
                            <span className="text-xs text-accent flex items-center">
                              <Flame className="mr-1 h-3 w-3" />
                              {habit.streak} {habit.frequency === 'daily' ? 'day' : 'week'} streak
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${
                        isCompleted ? 'text-success' : isDue ? 'text-slate-600' : 'text-slate-600'
                      }`}>
                        {isCompleted ? 'Completed' : isDue ? 'Due Sunday' : 'Pending'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditHabit(habit)}
                      >
                        <Edit className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <HabitModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        habit={editingHabit}
      />
    </>
  );
}
