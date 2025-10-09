import { Router } from "express";
import { items } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.use(authRequired);

// List items for current user
router.get("/", async (req, res) => {
  const docs = await items
    .find({ userId: req.user.userId })
    .sort({ column: 1, order: 1 })
    .exec();
  res.json(docs.map(mapItem));
});

// Create item
router.post("/", async (req, res) => {
  const {
    title,
    description = "",
    column = "todo",
    priority = "normal",
  } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  const last = await items
    .find({ userId: req.user.userId, column })
    .sort({ order: -1 })
    .limit(1)
    .exec();
  const order = last?.[0]?.order + 1 || 1;
  const now = Date.now();
  const doc = await items.insert({
    userId: req.user.userId,
    title,
    description,
    column,
    order,
    priority,
    createdAt: now,
    updatedAt: now,
  });
  res.status(201).json(mapItem(doc));
});

// Update item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, column, priority } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (column !== undefined) update.column = column;
  if (priority !== undefined) update.priority = priority;
  update.updatedAt = Date.now();
  const result = await items.update(
    { _id: id, userId: req.user.userId },
    { $set: update },
    { returnUpdatedDocs: true }
  );
  const updatedDoc = result?.affectedDocuments;
  if (!updatedDoc) return res.status(404).json({ error: "Not found" });
  res.json(mapItem(updatedDoc));
});

// Delete item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const num = await items.remove(
    { _id: id, userId: req.user.userId },
    { multi: false }
  );
  if (!num) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// Reorder items within/between columns
router.post("/reorder", async (req, res) => {
  const { orderMap } = req.body;
  if (!orderMap || typeof orderMap !== "object")
    return res.status(400).json({ error: "orderMap required" });
  const userId = req.user.userId;
  for (const [column, ids] of Object.entries(orderMap)) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      await items.update(
        { _id: id, userId },
        { $set: { column, order: i + 1, updatedAt: Date.now() } },
        {}
      );
    }
  }
  const docs = await items
    .find({ userId })
    .sort({ column: 1, order: 1 })
    .exec();
  res.json(docs.map(mapItem));
});

function mapItem(doc) {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description,
    column: doc.column,
    order: doc.order,
    priority: doc.priority || "normal",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export default router;
