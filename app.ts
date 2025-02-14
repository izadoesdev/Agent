import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { getInstanceInfo } from "./src/utils/system-info";
import { getHWID } from "./src/utils/hwid";
import { CONTROL_API_URL, INSTANCE_PING_INTERVAL, REGISTRATION_RETRY_INTERVAL, MAX_REGISTRATION_ATTEMPTS } from "./src/config/constants";
import healthRouter from "./src/routes/health";
import systemRouter from "./src/routes/system";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());

// Routes
app.route("/health", healthRouter);
app.route("/system", systemRouter);

// Instance state
let instanceId: string | null = null;
let registrationAttempts = 0;
const hwid = getHWID();

// Register with Control API
async function registerInstance() {
    try {
        const instanceInfo = {
            ...getInstanceInfo(),
            hwid
        };
        
        const response = await fetch(`${CONTROL_API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(instanceInfo)
        });

        if (!response.ok) {
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const data = await response.json();
        instanceId = data.instanceId;
        console.log(`Successfully registered with ID: ${instanceId} (HWID: ${hwid})`);
        
        // Reset registration attempts on success
        registrationAttempts = 0;
        
        // Start sending heartbeats
        startHeartbeat();
    } catch (error) {
        console.error("Registration failed:", error);
        registrationAttempts++;
        
        if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
            console.log(`Retrying registration in ${REGISTRATION_RETRY_INTERVAL}ms...`);
            setTimeout(registerInstance, REGISTRATION_RETRY_INTERVAL);
        } else {
            console.error("Max registration attempts reached. Giving up.");
            process.exit(1); // Exit if we can't register
        }
    }
}

// Enhanced heartbeat with HWID
function startHeartbeat() {
    if (!instanceId) return;

    setInterval(async () => {
        try {
            const response = await fetch(`${CONTROL_API_URL}/instances/${instanceId}/ping`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hwid,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                console.error("Failed to send heartbeat:", response.statusText);
                // If we get a 404, the instance might have been deleted
                if (response.status === 404) {
                    console.log("Instance not found, attempting re-registration");
                    instanceId = null;
                    registrationAttempts = 0;
                    registerInstance();
                }
            }
        } catch (error) {
            console.error("Heartbeat error:", error);
        }
    }, INSTANCE_PING_INTERVAL);
}

// Enhanced shutdown handler
async function handleShutdown() {
    if (instanceId) {
        try {
            await fetch(`${CONTROL_API_URL}/instances/${instanceId}/offline`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hwid })
            });
            console.log("Successfully marked instance as offline");
        } catch (error) {
            console.error("Failed to mark instance as offline:", error);
        }
    }
    process.exit(0);
}

// Register shutdown handlers
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

// Initial registration
registerInstance();

export default app;