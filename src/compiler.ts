import * as path from "path";

import * as ts from "typescript";

import * as pxt from "./pxt";

const _PREFIX = process.env.PXEXEC_IMPORT_PREFIX || "/usr/local/share/pxexec/"

function importLine(pkg: string) {
    if (pkg === 'core') {
        return _CORE_LINES;
    } else {
        return `import * as ${pkg} from '${path.join(_PREFIX, pkg)}';`;
    }
}

const _CORE_LINES = `
import * as _core from '${path.join(_PREFIX, 'core-exec')}';
${importLine('loops')}
${importLine('console')}`;

function initializeLine(pkg: string) {
    return pkg !== 'core' ? `${pkg}.initialize()` : '';
}

function injectFile(dependencies: string[], text: string): string {
    return `// PXEXEC MODIFIED FILE
// Import modules
` + dependencies.map(importLine).join('\n') + `

// Initialize modules
` + dependencies.map(initializeLine).join('\n') + `

_core.main(() => {
    // Original program text
` + text + `
});
`;
}

function compile(text: string): ts.TranspileOutput {
    return ts.transpileModule(text, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            lib: ["esnext"],
            target: ts.ScriptTarget.ES5,
        }
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
