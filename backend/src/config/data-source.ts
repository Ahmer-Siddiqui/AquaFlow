import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL connection
  },
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [],
  migrations: [],
  subscribers: [],
});

