// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import jwt from "jsonwebtoken";
import bcrypt2 from "bcrypt";

// server/storage.ts
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
var MemStorage = class {
  users = /* @__PURE__ */ new Map();
  habits = /* @__PURE__ */ new Map();
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async getHabitsByUserId(userId) {
    return Array.from(this.habits.values()).filter((habit) => habit.userId === userId);
  }
  async getHabit(id) {
    return this.habits.get(id);
  }
  async createHabit(userId, insertHabit) {
    const id = randomUUID();
    const habit = {
      ...insertHabit,
      id,
      userId,
      description: insertHabit.description || null,
      reminderTime: insertHabit.reminderTime || null,
      streak: 0,
      bestStreak: 0,
      startDate: /* @__PURE__ */ new Date(),
      isActive: true,
      completionHistory: [],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.habits.set(id, habit);
    return habit;
  }
  async updateHabit(id, updates) {
    const habit = this.habits.get(id);
    if (!habit) return void 0;
    const updatedHabit = { ...habit, ...updates };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }
  async deleteHabit(id) {
    return this.habits.delete(id);
  }
  async toggleHabitCompletion(id, date) {
    const habit = this.habits.get(id);
    if (!habit) return void 0;
    const completionHistory = [...habit.completionHistory];
    const dateIndex = completionHistory.indexOf(date);
    if (dateIndex > -1) {
      completionHistory.splice(dateIndex, 1);
    } else {
      completionHistory.push(date);
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let streak = 0;
    const sortedDates = completionHistory.sort().reverse();
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = /* @__PURE__ */ new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (currentDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0]) {
        streak++;
      } else {
        break;
      }
    }
    const bestStreak = Math.max(habit.bestStreak, streak);
    const updatedHabit = {
      ...habit,
      completionHistory,
      streak,
      bestStreak
    };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }
};
var MongoStorage = class {
  client;
  db;
  users;
  habits;
  constructor(mongoUri) {
    const uri = mongoUri || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is required");
    }
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      throw new Error(`Invalid MongoDB URI format: ${uri.substring(0, 20)}...`);
    }
    this.client = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 1e4,
      connectTimeoutMS: 1e4
    });
    this.db = this.client.db("habittracker");
    this.users = this.db.collection("users");
    this.habits = this.db.collection("habits");
  }
  async connect() {
    try {
      await this.client.connect();
      await this.client.db("admin").command({ ping: 1 });
      console.log("Successfully connected to MongoDB Atlas");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
  async getUser(id) {
    const user = await this.users.findOne({ id });
    return user || void 0;
  }
  async getUserByEmail(email) {
    const user = await this.users.findOne({ email });
    return user || void 0;
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.users.insertOne(user);
    return user;
  }
  async getHabitsByUserId(userId) {
    const habits2 = await this.habits.find({ userId }).toArray();
    return habits2;
  }
  async getHabit(id) {
    const habit = await this.habits.findOne({ id });
    return habit || void 0;
  }
  async createHabit(userId, insertHabit) {
    const id = randomUUID();
    const habit = {
      ...insertHabit,
      id,
      userId,
      description: insertHabit.description || null,
      reminderTime: insertHabit.reminderTime || null,
      streak: 0,
      bestStreak: 0,
      startDate: /* @__PURE__ */ new Date(),
      isActive: true,
      completionHistory: [],
      createdAt: /* @__PURE__ */ new Date()
    };
    await this.habits.insertOne(habit);
    return habit;
  }
  async updateHabit(id, updates) {
    const result = await this.habits.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || void 0;
  }
  async deleteHabit(id) {
    const result = await this.habits.deleteOne({ id });
    return result.deletedCount === 1;
  }
  async toggleHabitCompletion(id, date) {
    const habit = await this.habits.findOne({ id });
    if (!habit) return void 0;
    const completionHistory = [...habit.completionHistory];
    const dateIndex = completionHistory.indexOf(date);
    if (dateIndex > -1) {
      completionHistory.splice(dateIndex, 1);
    } else {
      completionHistory.push(date);
    }
    let streak = 0;
    const sortedDates = completionHistory.sort().reverse();
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = /* @__PURE__ */ new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (currentDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0]) {
        streak++;
      } else {
        break;
      }
    }
    const bestStreak = Math.max(habit.bestStreak, streak);
    const updatedHabit = {
      ...habit,
      completionHistory,
      streak,
      bestStreak
    };
    await this.habits.findOneAndUpdate(
      { id },
      { $set: updatedHabit },
      { returnDocument: "after" }
    );
    return updatedHabit;
  }
};
var StorageService = class {
  storageInstance = null;
  initializationPromise = null;
  async getStorage() {
    if (this.storageInstance) {
      return this.storageInstance;
    }
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeStorage();
    }
    this.storageInstance = await this.initializationPromise;
    return this.storageInstance;
  }
  async initializeStorage() {
    let mongoUri = process.env.MONGODB_URI;
    if (mongoUri && !mongoUri.startsWith("mongodb")) {
      mongoUri = `mongodb+srv://charlescarmichaal:${mongoUri}@habitcluster.ymf4dab.mongodb.net/?retryWrites=true&w=majority&appName=habitcluster`;
      console.log("Reconstructed MongoDB URI from password");
    }
    if (mongoUri) {
      try {
        console.log("Initializing MongoDB storage...");
        console.log("MongoDB URI length:", mongoUri.length);
        console.log("MongoDB URI starts with:", mongoUri.substring(0, 20) + "...");
        const cleanUri = mongoUri.trim();
        if (!cleanUri.startsWith("mongodb://") && !cleanUri.startsWith("mongodb+srv://")) {
          throw new Error(`Invalid MongoDB URI format. Expected mongodb:// or mongodb+srv:// but got: ${cleanUri.substring(0, 20)}...`);
        }
        const mongoStorage = new MongoStorage(mongoUri);
        await mongoStorage.connect();
        console.log("MongoDB storage initialized successfully");
        return mongoStorage;
      } catch (err) {
        console.error("Failed to initialize MongoDB storage:", err);
        console.error("Error details:", err instanceof Error ? err.message : err);
        console.log("Falling back to in-memory storage");
        return new MemStorage();
      }
    } else {
      console.log("Using in-memory storage (MONGODB_URI not found)");
      return new MemStorage();
    }
  }
};
var storageService = new StorageService();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(),
  // "daily" or "weekly"
  reminderTime: text("reminder_time"),
  streak: integer("streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  completionHistory: json("completion_history").$type().default([]).notNull(),
  // array of date strings
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  userId: true,
  streak: true,
  bestStreak: true,
  startDate: true,
  isActive: true,
  completionHistory: true,
  createdAt: true
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// server/routes.ts
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  });
};
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const userData = insertUserSchema.parse(req.body);
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
          email: user.email
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/habits", authenticateToken, async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const habits2 = await storage.getHabitsByUserId(req.userId);
      res.json(habits2);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/habits", authenticateToken, async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const habitData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(req.userId, habitData);
      res.json(habit);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });
  app2.put("/api/habits/:id", authenticateToken, async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const { id } = req.params;
      const updates = req.body;
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
  app2.delete("/api/habits/:id", authenticateToken, async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const { id } = req.params;
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
  app2.post("/api/habits/:id/toggle", authenticateToken, async (req, res) => {
    try {
      const storage = await storageService.getStorage();
      const { id } = req.params;
      const { date } = req.body;
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5001", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
  server.listen({
    port,
    host
  }, async () => {
    log(`serving on ${host}:${port}`);
    try {
      const storage = await storageService.getStorage();
      log("\u2705 Storage service initialized successfully");
    } catch (error) {
      log("\u274C Storage service initialization failed:", String(error));
    }
  });
})();
