import * as path from "path";

import * as ts from "typescript";

import * as pxt from "./pxt";

function fnIsAlreadyAsync(mods?: ts.NodeArray<ts.Modifier>): boolean {
    mods.forEach((m: ts.Modifier) => {
        if (m.kind === ts.SyntaxKind.AsyncKeyword) return true;
    })
    return false;
}

/*
 *  This hideous structure is just how TypeScript wants you to
 * organize the transforms. 
 */
function asyncBootstrap(cx: ts.TransformationContext) {
    /*
     *  This function is the workhorse.
     */
    function asyncVisitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if (ts.isCallExpression(node)) {
            // If this is already an await context, then all is good
            if ((node.flags & ts.NodeFlags.AwaitContext) &&
                !ts.isAwaitExpression(node.parent)) {
                return ts.createAwait(node);
            }
        }

        // Turn the arrows async
        if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {

            if ((node.flags & ts.NodeFlags.AwaitContext) && node.modifiers === undefined) {
                let modifier = ts.createNode(
                    ts.SyntaxKind.AsyncKeyword
                ) as ts.Modifier;
                modifier.flags |= node.flags;
                node.modifiers = ts.createNodeArray<ts.Modifier>([
                    modifier
                ]);
            }
        }

        if (ts.isFunctionDeclaration(node)) {
            const fds = node as ts.FunctionDeclaration;

        }

        return ts.visitEachChild(node, asyncVisitor, cx);

    }

    return (file: ts.SourceFile) => {
        console.log(file);
        return asyncVisitor(file) as ts.SourceFile;
    }
}


const _PREFIX = process.env.PXEXEC_IMPORT_PREFIX || "/usr/local/share/pxexec/"

function importLine(pkg: string) {
    if (pkg === 'core') {
        return _CORE_LINES;
    } else {
        return `import * as ${pkg} from '${path.join(_PREFIX, pkg)}';`;
    }
}

const _CORE_LINES = `
import * as _pxexec from '${path.join(_PREFIX, 'core-exec')}';
${importLine('loops')}
${importLine('console')}`;

function initializeLine(pkg: string) {
    return pkg !== 'core' ? `${pkg}.initialize()` : '';
}

function injectFile(dependencies: string[], text: string): string {
    return `// PXEXEC MODIFIED FILE

import * as Fiber from '${_PREFIX}/node_modules/fibers';

` + dependencies.map(importLine).join('\n') + `

_pxexec.init();

Fiber(function() {
` + dependencies.map(initializeLine).join('\n') + `

` + text + `
}).run();
`;
}

function compile(text: string): ts.TranspileOutput {
    return ts.transpileModule(text, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            lib: ["ES2015"],
            target: ts.ScriptTarget.ES2015,
        },
        /*transformers: {
            before: [asyncBootstrap]
        }*/
    })
}

export function compileAll(context: pxt.PXTJson, files: Map<string, string>): Map<string, ts.TranspileOutput> {
    const r = new Map<string, ts.TranspileOutput>();
    const deps = Object.keys(context.dependencies)
        .filter((s) => context.dependencies.hasOwnProperty(s));
    files.forEach((value: string, key: string) => {
        console.log(injectFile(deps, value));
        const output = compile(injectFile(deps, value));

        r.set(key, output);
    });
    return r;
}
