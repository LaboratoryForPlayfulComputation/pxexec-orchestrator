import * as bodyParser from "body-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");

import * as sentry from '@sentry/node';

import { compileAll } from "./compiler";
import { PXTJson } from "./pxt";

import * as nx from "./node_executor";

const _PXT_JSON = "pxt.json";

export class Server {
    public app: express.Application;


    public static bootstrap(): Server {
        return new Server();
    }

    /**
     * Create a new Server object representing the daemon
     */
    constructor() {
        this.app = express();

        // Configure the application
        this.config();
        this.api();

        // If Sentry is available, use it.
        sentry.init({
            dsn: process.env.SENTRY_DSN,
        });
    }

    private api() {
        this.app.post("/api/save", (req: express.Request, res: express.Response) => {
            let jsonBody = JSON.parse((<any>req).rawBody);

            const pxtInfo = <PXTJson>JSON.parse(jsonBody[_PXT_JSON]);

            let tsFiles = Object.keys(jsonBody)
                .filter((s) => s.endsWith(".ts") && jsonBody.hasOwnProperty(s));

            let inputs: {[k: string]: string} = {};
            tsFiles.forEach((f) => {
                inputs[f] = jsonBody[f];
            });

            const compiled = compileAll(pxtInfo, inputs);

            nx.run_bundle(compiled);

            res.status(200).json({ status: 200, message: "accepted" });
        })
    }

    private config() {
        this.app.use(logger('combined'));

        const editorPath = process.env.EDITOR_PATH || path.join(process.cwd(), "editor");
        this.app.use("/editor", express.static(editorPath));

        this.app.use((req: express.Request, res: express.Response, next: any) => {
            let rawBody = '';

            req.on('data', (chunk: any) => {
                rawBody += chunk;
            });

            req.on('end', () => {
                (<any>req).rawBody = rawBody;
                next();
            });
        });
        this.app.use(bodyParser.json());

        this.app.use((
            err: any,
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
            err.status = 404;
            next(err);
        });

        this.app.use(errorHandler());
    }
}