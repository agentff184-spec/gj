import { type User, type InsertUser, type Habit, type InsertHabit } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { MongoClient, Db, Collection } from "mongodb";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Habit methods
  getHabitsByUserId(userId: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(userId: string, habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;
  toggleHabitCompletion(id: string, date: string): Promise<Habit | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private habits: Map<string, Habit> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getHabitsByUserId(userId: string): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(habit => habit.userId === userId);
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async createHabit(userId: string, insertHabit: InsertHabit): Promise<Habit> {
    const id = randomUUID();
    const habit: Habit = {
      ...insertHabit,
      id,
      userId,
      description: insertHabit.description || null,
      reminderTime: insertHabit.reminderTime || null,
      streak: 0,
      bestStreak: 0,
      startDate: new Date(),
      isActive: true,
      completionHistory: [],
      createdAt: new Date(),
    };
    this.habits.set(id, habit);
    return habit;
  }

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;
    
    const updatedHabit = { ...habit, ...updates };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(id: string): Promise<boolean> {
    return this.habits.delete(id);
  }

  async toggleHabitCompletion(id: string, date: string): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;

    const completionHistory = [...habit.completionHistory];
    const dateIndex = completionHistory.indexOf(date);
    
    if (dateIndex > -1) {
      // Remove completion
      completionHistory.splice(dateIndex, 1);
    } else {
      // Add completion
      completionHistory.push(date);
    }

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    const sortedDates = completionHistory.sort().reverse();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
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
      bestStreak,
    };

    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection<User>;
  private habits: Collection<Habit>;

  constructor(mongoUri?: string) {
    const uri = mongoUri || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is required");
    }
    
    // Validate the URI format
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(`Invalid MongoDB URI format: ${uri.substring(0, 20)}...`);
    }
    
    // Configure MongoDB client with TLS options for Replit environment
    this.client = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    this.db = this.client.db("habittracker");
    this.users = this.db.collection("users");
    this.habits = this.db.collection("habits");
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      // Verify connection
      await this.client.db("admin").command({ ping: 1 });
      console.log("Successfully connected to MongoDB Atlas");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.users.findOne({ id });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    await this.users.insertOne(user);
    return user;
  }

  async getHabitsByUserId(userId: string): Promise<Habit[]> {
    const habits = await this.habits.find({ userId }).toArray();
    return habits;
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const habit = await this.habits.findOne({ id });
    return habit || undefined;
  }

  async createHabit(userId: string, insertHabit: InsertHabit): Promise<Habit> {
    const id = randomUUID();
    const habit: Habit = {
      ...insertHabit,
      id,
      userId,
      description: insertHabit.description || null,
      reminderTime: insertHabit.reminderTime || null,
      streak: 0,
      bestStreak: 0,
      startDate: new Date(),
      isActive: true,
      completionHistory: [],
      createdAt: new Date(),
    };
    await this.habits.insertOne(habit);
    return habit;
  }

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | undefined> {
    const result = await this.habits.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteHabit(id: string): Promise<boolean> {
    const result = await this.habits.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async toggleHabitCompletion(id: string, date: string): Promise<Habit | undefined> {
    const habit = await this.habits.findOne({ id });
    if (!habit) return undefined;

    const completionHistory = [...habit.completionHistory];
    const dateIndex = completionHistory.indexOf(date);
    
    if (dateIndex > -1) {
      // Remove completion
      completionHistory.splice(dateIndex, 1);
    } else {
      // Add completion
      completionHistory.push(date);
    }

    // Calculate streak
    let streak = 0;
    const sortedDates = completionHistory.sort().reverse();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
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
      bestStreak,
    };

    await this.habits.findOneAndUpdate(
      { id },
      { $set: updatedHabit },
      { returnDocument: 'after' }
    );
    
    return updatedHabit;
  }
}

// Storage service
class StorageService {
  private storageInstance: IStorage | null = null;
  private initializationPromise: Promise<IStorage> | null = null;

  async getStorage(): Promise<IStorage> {
    if (this.storageInstance) {
      return this.storageInstance;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeStorage();
    }

    this.storageInstance = await this.initializationPromise;
    return this.storageInstance;
  }

  private async initializeStorage(): Promise<IStorage> {
    let mongoUri = process.env.MONGODB_URI;
    
    // Temporary fix: if the URI is just the password, construct the full URI
    if (mongoUri && !mongoUri.startsWith('mongodb')) {
      mongoUri = `mongodb+srv://charlescarmichaal:${mongoUri}@habitcluster.ymf4dab.mongodb.net/?retryWrites=true&w=majority&appName=habitcluster`;
      console.log("Reconstructed MongoDB URI from password");
    }
    
    if (mongoUri) {
      try {
        console.log("Initializing MongoDB storage...");
        console.log("MongoDB URI length:", mongoUri.length);
        console.log("MongoDB URI starts with:", mongoUri.substring(0, 20) + "...");
        
        // Clean and validate the URI
        const cleanUri = mongoUri.trim();
        if (!cleanUri.startsWith('mongodb://') && !cleanUri.startsWith('mongodb+srv://')) {
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
}

export const storageService = new StorageService();
