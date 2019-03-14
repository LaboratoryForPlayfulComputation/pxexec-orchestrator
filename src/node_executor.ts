import * as fs from "fs";
import * as path from "path";

import * as tmp from "tmp";

import * as sentry from '@sentry/node';

import { ChildProcess, spawn } from "child_process";

import { TranspileOutput } from "typescript";

const _KILL_SIGNAL = 'SIGTERM';

let _handler: NodeHandler | undefined = undefined;

class UnexpectedClientTermination extends Error {}

// Why in all hell do I have to implement this method
// I tried to write this async but I'm not smart enough
function recursiveDeleteSync(p) {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach(function (file, index) {
            var nextPath = path.join(p, file);
            if (fs.lstatSync(nextPath).isDirectory()) { // recurse
                recursiveDeleteSync(nextPath);
            } else {
                fs.unlinkSync(nextPath);
            }
        });
        fs.rmdirSync(p);
    }
};

class NodeChild {

    private proc: ChildProcess;
    private dir: string;

    constructor(node: string, dir: string) {
        const _child = this;
        this.dir = dir;

        // TODO: Let's use Linux Namespaces to sandbox the child process
        this.proc = spawn(
            node,
            [path.join(this.dir, "main.js")]
        );

        this.proc.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        this.proc.stderr.on('data', (data) => {
            const err = data.toString();
            console.log(err);
            sentry.captureException(new Error(err));
        });

        this.proc.on('close', (code, signal) => {
            console.log("proc died with ", signal, "status", code);
            _child.proc = undefined;
            _child.destroy();
        });
    }

    public destroy() {
        if (this.proc) {
            this.proc.kill(_KILL_SIGNAL);
        }
        recursiveDeleteSync(this.dir);
    }
}

class NodeHandler {
    private NODE: string;

    private CHILD: NodeChild | undefined;

    constructor() {
        this.NODE = process.env.NODE || "node";
        this.CHILD = undefined;
    }

    public replace(dir: string) {
        if (this.CHILD !== undefined) {
            this.CHILD.destroy();
        }

        this.CHILD = new NodeChild(this.NODE, dir);
    }
}

export function run_bundle(bundle: Map<string, TranspileOutput>) {
    if (_handler === undefined) {
        _handler = new NodeHandler();
    }

    let dir = tmp.dirSync().name;
    bundle.forEach((v: TranspileOutput, k: string) => {
        const newName = k.split('.')[0] + '.js'
        fs.writeFileSync(path.join(dir, newName), v.outputText);
    });

    _handler.replace(dir);
}