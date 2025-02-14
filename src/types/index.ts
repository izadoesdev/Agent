import os from "os";
export interface SystemInfo {
    hostname: string;
    platform: string;
    arch: string;
    specs: {
        cpu: string;
        cores: number;
        memory: {
            total: number;
            free: number;
        };
        loadavg: number[];
    };
    network: {
        interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
    };
    uptime: number;
}

export interface InstanceInfo {
    hostname: string;
    ipAddress: string;
    machineSpecs: {
        cpu: string;
        memory: string;
        disk: string;
    };
} 