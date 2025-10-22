import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // "daily" or "weekly"
  reminderTime: text("reminder_time"),
  streak: integer("streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  completionHistory: json("completion_history").$type<string[]>().default([]).notNull(), // array of date strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  userId: true,
  streak: true,
  bestStreak: true,
  startDate: true,
  isActive: true,
  completionHistory: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
