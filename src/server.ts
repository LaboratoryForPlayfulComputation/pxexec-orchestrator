import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { isNamedExports } from "typescript";

import { compile } from "./compiler";

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
    }

    private api() {
        this.app.get("/test", (req: express.Request, res: express.Response) => {
            const out = compile("(async () => { let x = foo(); })();");
            res.send(out.outputText);
        });
    }

    private config() {
        const editorPath = process.env.EDITOR_PATH || path.join(process.cwd(), "editor");
        this.app.use("/editor", express.static(editorPath));

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