import os from "os";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const HWID_FILE = "./.hwid";

function generateHWID(): string {
    const systemInfo = {
        cpu: os.cpus()[0].model,
        hostname: os.hostname(),
        networkInterfaces: Object.values(os.networkInterfaces())
            .flat()
            .filter(iface => iface?.mac && !iface.internal)
            .map(iface => iface?.mac)
            .join(':'),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        totalMemory: os.totalmem()
    };

    const hash = createHash('sha256')
        .update(JSON.stringify(systemInfo))
        .digest('hex');

    return hash.slice(0, 32); // Return first 32 chars of hash
}

export function getHWID(): string {
    try {
        // Try to read existing HWID
        if (existsSync(HWID_FILE)) {
            const hwid = readFileSync(HWID_FILE, 'utf-8').trim();
            if (hwid && hwid.length === 32) {
                return hwid;
            }
        }

        // Generate new HWID if none exists or invalid
        const hwid = generateHWID();
        writeFileSync(HWID_FILE, hwid);
        return hwid;
    } catch (error) {
        console.error("Error managing HWID:", error);
        return generateHWID(); // Fallback to generated HWID
    }
} 