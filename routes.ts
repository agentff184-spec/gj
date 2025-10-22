import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storageService } from "./storage";
import { insertUserSchema, loginSchema, insertHabitSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  userId?: string;
}

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const storage = await storageService.getStorage();
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Habit routes
  app.get("/api/habits", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const storage = await storageService.getStorage();
      const habits = await storage.getHabitsByUserId(req.userId!);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/habits", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const storage = await storageService.getStorage();
      const habitData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(req.userId!, habitData);
      res.json(habit);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.put("/api/habits/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const storage = await storageService.getStorage();
      const { id } = req.params;
      const updates = req.body;
      
      // Verify habit belongs to user
      const habit = await storage.getHabit(id);
      if (!habit || habit.userId !== req.userId) {
        return res.status(404).json({ message: "Habit not found" });
      }

      const updatedHabit = await storage.updateHabit(id, updates);
      res.json(updatedHabit);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.delete("/api/habits/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const storage = await storageService.getStorage();
      const { id } = req.params;
      
      // Verify habit belongs to user
      const habit = await storage.getHabit(id);
      if (!habit || habit.userId !== req.userId) {
        return res.status(404).json({ message: "Habit not found" });
      }

      const deleted = await storage.deleteHabit(id);
      if (deleted) {
        res.json({ message: "Habit deleted" });
      } else {
        res.status(404).json({ message: "Habit not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/habits/:id/toggle", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const storage = await storageService.getStorage();
      const { id } = req.params;
      const { date } = req.body;
      
      // Verify habit belongs to user
      const habit = await storage.getHabit(id);
      if (!habit || habit.userId !== req.userId) {
        return res.status(404).json({ message: "Habit not found" });
      }

      const updatedHabit = await storage.toggleHabitCompletion(id, date);
      res.json(updatedHabit);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
