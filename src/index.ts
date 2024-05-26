import { spawn } from 'child_process';
import { debug } from 'util';

export interface ITunnelOptions {
    localPort: number;
    remoteUser: string;
    remoteHost: string;
    remotePort: number;
    sshKeyPath?: string;
}

export interface ITunnel {
    stop: () => boolean;
    options: Readonly<ITunnelOptions>;
}

const log = debug('ssh-tunnel');

export function createTunnel(options: ITunnelOptions) {
    return new Promise<ITunnel>((resolve, reject) => {
        const args = [
            '-R', `0.0.0.0:25400:127.0.0.1:${options.localPort}`,
            `${options.remoteUser}@${options.remoteHost}`,
        ];

        if (options.sshKeyPath !== undefined) {
            args.push('-i', options.sshKeyPath);
        }

        const proc = spawn('ssh', args);

        const tunnel: ITunnel = {
            stop: () => {
                return proc.kill('SIGTERM');
            },
            options,
        };

        proc.on('spawn', () => {
            log('[tunnel] Connecting to SSH...');
        });

        proc.stdout.on('data', () => {
            log(`[tunnel] Tunnel created: ${options.remoteHost}:${options.remotePort}`);

            resolve(tunnel);
        });

        proc.on('exit', () => reject);
    });
}
