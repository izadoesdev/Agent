import { Hono } from "hono";
import { getSystemInfo } from "../utils/system-info";

const router = new Hono();

router.get("/", (c) => c.json(getSystemInfo()));

export default router; 