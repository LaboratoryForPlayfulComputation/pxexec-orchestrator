import * as ts from "typescript";

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

        return ts.visitEachChild(node, asyncVisitor, cx);

    }

    return (file: ts.SourceFile) => asyncVisitor(file) as ts.SourceFile;
}

export function compile(text: string): ts.TranspileOutput {
    return ts.transpileModule(text, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            lib: ["ES2015"],
            target: ts.ScriptTarget.ES2015,
        },
        transformers: {
            before: [asyncBootstrap]
        }
    })
}

export function compileAll(files: Map<string, string>): Map<string, string> {
    const r = new Map<string, string>();
    files.forEach((value: string, key: string) => {
        const output = compile(value);
        r.set(name, output.outputText);
    });
    return r;
}
