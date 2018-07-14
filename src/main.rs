extern crate iron;

extern crate serde;
extern crate serde_json;

extern crate tempfile;

mod tsc;

use iron::prelude::*;
use iron::status;

use iron::method::Method;

use std::collections::HashMap;
use std::io::prelude::*;

type RequestData = HashMap<String, String>;

fn handle_request(body: RequestData) -> Result<(), String> {
    if let Some(main_text) = body.get("main.ts") {
        let assembled = tsc::assemble_main(main_text);
        let mut bytes: &[u8] = assembled.as_bytes();
        if let Err(msg) = tsc::compile_with_tempfile(&mut bytes) {
            return Err(msg);
        }
    }
    Ok(())
}

// This application is simple enough that I think we won't need router
// middleware or similar. That option remains open, but for now I'll just return
// 404 messages with a body that simply says "NOT FOUND" in case the message
// is not a POST message or is not to simply "/save"
//
// In case the message is invalid, I'll send a generic 400 with the text
// "YOUR FAULT" followed by a new line and any relevant error message, if one
// exists.
//
/// Dispatch HTTP handler.
fn validate_request(req: &mut Request) -> IronResult<Response> {
    println!("Message received: {:?}", req);
    let mut data = String::new();
    req.body.read_to_string(&mut data).unwrap();
    match req.method {
        Method::Post => {
            let deserialized = serde_json::from_str(&data);
            match deserialized {
                Ok(obj) => match handle_request(obj) {
                    Ok(_) => Ok(Response::with((status::Ok, "ACCEPTED"))),
                    Err(msg) => Ok(Response::with((
                        status::InternalServerError,
                        format!("MY FAULT\n{}", msg),
                    ))),
                },
                Err(msg) => Ok(Response::with((
                    status::BadRequest,
                    format!("YOUR FAULT\n{:?}", msg),
                ))),
            }
        }
        _ => Ok(Response::with((status::NotFound, "NOT FOUND"))),
    }
}

fn main() {
    println!("Starting server on port 3074.");
    Iron::new(validate_request).http("localhost:3074").unwrap();
}
