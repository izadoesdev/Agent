import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { PrismaClient } from "@prisma/client";
import { cors } from "hono/cors";

const prisma = new PrismaClient();
const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// Types
type InstanceRegistration = {
  hwid: string;
  hostname: string;
  ipAddress: string;
  region?: string;
  machineSpecs: {
    cpu: string;
    memory: string;
    disk: string;
  };
  commitHash?: string;
}

// Health check
app.get("/", (c) => {
  return c.json({ status: "ok", service: "Control API" });
});

// Instance registration with HWID
app.post("/register", async (c) => {
  try {
    console.log("Registering instance");
    const body = await c.req.json<InstanceRegistration>();
    console.log(body);

    // Check for existing instance with this HWID
    const existingInstance = await prisma.instance.findUnique({
      where: { hwid: body.hwid }
    });

    let instance;
    if (existingInstance) {
      // Update existing instance
      instance = await prisma.instance.update({
        where: { hwid: body.hwid },
        data: {
          hostname: body.hostname,
          ipAddress: body.ipAddress,
          region: body.region,
          machineSpecs: JSON.stringify(body.machineSpecs),
          commitHash: body.commitHash,
          status: "active",
          lastPing: new Date()
        }
      });
      console.log("Instance reconnected:", instance.id);
    } else {
      // Create new instance
      instance = await prisma.instance.create({
        data: {
          hwid: body.hwid,
          hostname: body.hostname,
          ipAddress: body.ipAddress,
          region: body.region,
          machineSpecs: JSON.stringify(body.machineSpecs),
          commitHash: body.commitHash
        }
      });
      console.log("New instance registered:", instance.id);
    }

    return c.json({
      success: true,
      instanceId: instance.id,
      message: existingInstance ? "Instance reconnected" : "Instance registered successfully"
    }, 201);
  } catch (error) {
    console.error("Failed to register instance", error);
    return c.json({
      success: false,
      error: "Failed to register instance",
      details: error.message
    }, 400);
  }
});

// Instance heartbeat/status update
app.post("/instances/:id/ping", async (c) => {
  const instanceId = c.req.param("id");
  
  try {
    const instance = await prisma.instance.update({
      where: { id: instanceId },
      data: { 
        lastPing: new Date(),
        status: "active"
      }
    });

    return c.json({
      success: true,
      instance
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to update instance status",
      details: error.message
    }, 400);
  }
});

// Get all instances
app.get("/instances", async (c) => {
  try {
    const instances = await prisma.instance.findMany({
      orderBy: { lastPing: "desc" }
    });

    return c.json({ instances });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to fetch instances",
      details: error.message
    }, 500);
  }
});

// Get instance details
app.get("/instances/:id", async (c) => {
  const instanceId = c.req.param("id");
  
  try {
    const instance = await prisma.instance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      return c.json({ error: "Instance not found" }, 404);
    }

    return c.json({ instance });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to fetch instance",
      details: error.message
    }, 500);
  }
});

// Mark instance as offline
app.post("/instances/:id/offline", async (c) => {
  const instanceId = c.req.param("id");
  
  try {
    const instance = await prisma.instance.update({
      where: { id: instanceId },
      data: { status: "offline" }
    });

    return c.json({
      success: true,
      instance
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to update instance status",
      details: error.message
    }, 400);
  }
});

// Background task to mark stale instances as offline
setInterval(async () => {
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
  
  await prisma.instance.updateMany({
    where: {
      lastPing: {
        lt: staleThreshold
      },
      status: "active"
    },
    data: {
      status: "offline"
    }
  });
}, 60 * 1000); // Run every minute

export default app;
