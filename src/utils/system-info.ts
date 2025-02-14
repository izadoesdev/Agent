import os from "os";

export function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        specs: {
            cpu: os.cpus()[0].model,
            cores: os.cpus().length,
            memory: {
                total: os.totalmem(),
                free: os.freemem()
            },
            loadavg: os.loadavg()
        },
        network: {
            interfaces: os.networkInterfaces()
        },
        uptime: os.uptime()
    };
}

export function getInstanceInfo() {
    const systemInfo = getSystemInfo();
    const primaryInterface = Object.values(systemInfo.network.interfaces)
        .flat()
        .find(iface => iface?.family === "IPv4" && !iface.internal);

    return {
        hostname: systemInfo.hostname,
        ipAddress: primaryInterface?.address || "unknown",
        machineSpecs: {
            cpu: `${systemInfo.specs.cpu} (${systemInfo.specs.cores} cores)`,
            memory: `${Math.round(systemInfo.specs.memory.total / 1024 / 1024 / 1024)}GB`,
            disk: "pending" // Will implement disk space check later
        }
    };
} 