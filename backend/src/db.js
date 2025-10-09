import Datastore from "nedb-promises";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Proper ESM-compatible __filename/__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const users = Datastore.create({
  filename: path.join(dataDir, "users.db"),
  autoload: true,
});
export const items = Datastore.create({
  filename: path.join(dataDir, "items.db"),
  autoload: true,
});

// Indexes
users.ensureIndex({ fieldName: "email", unique: true });
items.ensureIndex({ fieldName: "userId" });
