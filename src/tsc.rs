use tempfile::tempfile;

use std::fs::File;
use std::io::copy;
use std::io::prelude::*;
use std::process::Command;

const _PXEXEC_PREFIX: &'static str = r#"
// BEGIN PXT_EXEC PREFIX

import _pxexec from './core-exec';
import loops from './loops';

_pxexec.init();

// END PXT_EXEC PREFIX

"#;

const _PXEXEC_SUFFIX: &'static str = r#"
// BEGIN PXT_EXEC SUFFIX

_pxexec.run();

// END PXT_EXEC SUFFIX

"#;

const _PXEXEC_TSC_FMT_STRING: &'static str = "tsc --out {out_dir}";

pub fn assemble_main(body: &str) -> String {
    String::from(_PXEXEC_PREFIX) + body + _PXEXEC_SUFFIX
}

pub fn compile_with_tempfile(contents: &mut Read) -> Result<(), String> {
    let mut file = tempfile();
    println!("{:?}", file);
    match file {
        Ok(ref mut file) => match copy(contents, file) {
            Ok(_) => compile(file),
            Err(msg) => Err(msg.to_string()),
        },
        Err(msg) => Err(msg.to_string()),
    }
}

pub fn compile(file: &mut File) -> Result<(), String> {
    let compiler = Command::new("tsc")
        .arg(file.path)
    Ok(())
}
