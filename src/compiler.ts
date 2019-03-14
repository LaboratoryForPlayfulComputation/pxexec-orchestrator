import * as path from "path";

import * as ts from "typescript";

import * as pxt from "./pxt";

const _PREFIX = process.env.PXEXEC_IMPORT_PREFIX || "/usr/local/share/pxexec/"

function importLine(pkg: string): string {
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

function importExtension(ext: string): string {
    const pkg = ext.split('.')[0];
    return `import ${pkg} from './${pkg}';`
}

function injectExtension(importLines: string, text: string, name: string): string {
    return `// PXEXEC MODIFIED EXTENSION
${importLines}

${text}

export default ${name};
`;
}

function injectMain(importLines: string, text: string, extensions: string[]): string {
    return `// PXEXEC MODIFIED MAIN

// IMPORTS
${importLines}

// EXTENSIONS
` + extensions.map(importExtension).join('\n') + `

// This is a hack until wrtc can fix its module
_core.hacks.wrtc = require('${_PREFIX}/../../../dss/client/node_modules/wrtc');

_core.main(() => {
    // Original program text
${text}
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

export function compileAll(context: pxt.PXTJson, files: { [k: string]: string }): Map<string, ts.TranspileOutput> {
    const results = new Map<string, ts.TranspileOutput>();

    // We have to import the extension files, even though PXT does it by magic.
    const extensions = Object.keys(files).filter((k) => files.hasOwnProperty(k) && k !== "main.ts");

    const deps = Object.keys(context.dependencies)
        .filter((s) => context.dependencies.hasOwnProperty(s));

    const importLines = deps.map(importLine).join('\n');
    Object.keys(files).forEach((key) => {
        if (files.hasOwnProperty(key)) {
            const value = files[key];
            let res;
            if (key === "main.ts") {
                res = injectMain(importLines, value, extensions);
            } else {
                res = injectExtension(importLines, value, key.split('.')[0]);
            }

            console.log(res);
            const output = compile(res);

            results.set(key, output);
        }
    });

    return results;
}
