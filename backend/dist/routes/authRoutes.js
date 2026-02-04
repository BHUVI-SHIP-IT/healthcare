"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const authService_1 = require("../services/authService");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    try {
        const { email, fullName, password, role, classSection } = req.body;
        if (!email || !fullName || !password || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const parsedRole = role;
        const { token, user } = await (0, authService_1.registerUser)({
            email,
            fullName,
            password,
            role: parsedRole,
            classSection,
        });
        return res.status(201).json({ token, user });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        return res.status(400).json({ message });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Missing credentials" });
        }
        const { token, user } = await (0, authService_1.loginUser)(email, password);
        return res.json({ token, user });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        return res.status(401).json({ message });
    }
});
router.get("/me", authenticate_1.authenticate, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({ user: req.user });
});
exports.default = router;
