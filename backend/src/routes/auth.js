import { Router } from "express";
import { users } from "../db.js";
import bcrypt from "bcryptjs";
import { signToken } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await users.insert({
      email,
      passwordHash,
      name: name || email.split("@")[0],
      createdAt: Date.now(),
    });
    const token = signToken({
      userId: user._id,
      email: user.email,
      name: user.name,
    });
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (e) {
    if (e?.errorType === "uniqueViolated")
      return res.status(409).json({ error: "Email already registered" });
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  const user = await users.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken({
    userId: user._id,
    email: user.email,
    name: user.name,
  });
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name },
  });
});

export default router;
