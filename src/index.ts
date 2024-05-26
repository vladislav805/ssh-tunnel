import { spawn } from 'child_process';
import { debug } from 'util';

export interface ITunnelOptions {
    localPort: number;
    remoteUser: string;
    remoteHost: string;
    remotePort: number;
    sshKeyPath?: string;
    noCommands?: boolean;
    reverse?: boolean;
}

export interface ITunnel {
    stop: () => boolean;
    options: Readonly<ITunnelOptions>;
}

const log = debug('ssh-tunnel');

export function createTunnel(options: ITunnelOptions) {
    return new Promise<ITunnel>((resolve, reject) => {
        const args: string[] = [];

        if (options.sshKeyPath !== undefined) {
            args.push('-i', options.sshKeyPath);
        }

        args.push(options.reverse ? '-R' : '-L', `0.0.0.0:${options.remotePort}:127.0.0.1:${options.localPort}`);

        if (options.noCommands) {
            args.push('-N');
        }

        args.push(`${options.remoteUser}@${options.remoteHost}`);

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

        proc.stdout.on('data', (chunk) => {
            log(`[tunnel] Tunnel created: ${options.remoteHost}:${options.remotePort}`);

            resolve(tunnel);
        });

        proc.on('exit', code => {
            reject(code);
        });
    });
}
