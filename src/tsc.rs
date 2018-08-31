use std::env::temp_dir;
use std::fs::{remove_file, File};
use std::io::copy;
use std::io::prelude::*;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};

const _PXEXEC_PREFIX: &'static str = r#"
// BEGIN PXT_EXEC PREFIX

import _pxexec from '/usr/local/share/pxexec/core-exec';
import loops from '/usr/local/share/pxexec/loops';
import grove from '/usr/local/share/pxexec/grove';

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

pub fn compile_with_tempfile(contents: &mut Read) -> Result<PathBuf, String> {
    let mut file_name = temp_dir();
    let mut js_name = file_name.clone();
    file_name.push("test.ts");
    js_name.push("test.js");
    let temp_file = File::create(file_name.clone());
    match temp_file {
        Ok(mut file) => match copy(contents, &mut file) {
            Ok(_) => {
                compile(&file_name)?;
                remove_file(file_name).unwrap();
                println!("Successfully compiled!");
                Ok(js_name)
            }
            Err(msg) => Err(msg.to_string()),
        },
        Err(msg) => Err(msg.to_string()),
    }
}

pub fn compile(path: &Path) -> Result<(), String> {
    let compiler = Command::new("tsc")
        .arg("--target")
        .arg("ES5")
        .arg("--module")
        .arg("commonjs")
        .arg("--moduleResolution")
        .arg("node")
        .arg(path)
        .output()
        .expect("failed to execute tsc");
    println!("{}", String::from_utf8(compiler.stdout).unwrap());
    Ok(())
}

pub fn execute(path: &Path, prev: Option<Child>) -> Child {
    match prev {
        Some(mut child) => {
            child.kill().unwrap();
        }
        None => {}
    }

    Command::new("node").arg(path).spawn().unwrap()
}
