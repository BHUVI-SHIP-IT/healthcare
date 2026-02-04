import cors from "cors";
import express, { Request, Response } from "express";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import requestRoutes from "./routes/requestRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);

app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});
