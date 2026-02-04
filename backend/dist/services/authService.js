"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
async function registerUser(input) {
    const normalizedEmail = input.email.toLowerCase();
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
        throw new Error("Email already registered");
    }
    if (!Object.values(client_1.Role).includes(input.role)) {
        throw new Error("Invalid role");
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: normalizedEmail,
            fullName: input.fullName,
            role: input.role,
            passwordHash,
            classSection: input.classSection,
        },
    });
    const token = signToken(user.id, user.email, user.role);
    return { token, user };
}
async function loginUser(email, password) {
    const normalizedEmail = email.toLowerCase();
    const user = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const match = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!match) {
        throw new Error("Invalid credentials");
    }
    const token = signToken(user.id, user.email, user.role);
    return { token, user };
}
function signToken(userId, email, role) {
    const payload = { sub: userId, email, role };
    const expiresIn = env_1.env.jwtExpiresIn;
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, { expiresIn });
}
