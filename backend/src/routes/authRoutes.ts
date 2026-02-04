import { Role } from "@prisma/client";
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { loginUser, registerUser } from "../services/authService";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, fullName, password, role, classSection } = req.body;
    if (!email || !fullName || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedRole = role as Role;
    const { token, user } = await registerUser({
      email,
      fullName,
      password,
      role: parsedRole,
      classSection,
    });

    return res.status(201).json({ token, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return res.status(400).json({ message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const { token, user } = await loginUser(email, password);
    return res.json({ token, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return res.status(401).json({ message });
  }
});

router.get("/me", authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ user: req.user });
});

export default router;
