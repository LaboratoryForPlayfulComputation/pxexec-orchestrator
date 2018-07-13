extern crate iron;

extern crate serde;
extern crate serde_json;

extern crate unescape;

use iron::prelude::*;
use iron::status;

use iron::method::Method;

use unescape::unescape;

use std::collections::HashMap;
use std::io::prelude::*;

type RequestData = HashMap<String, String>;

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
fn handle_request(req: &mut Request) -> IronResult<Response> {
    println!("Message received: {:?}", req);
    let mut data = String::new();
    req.body.read_to_string(&mut data);
    match req.method {
        Method::Post => {
            let deserialized : Result<RequestData, serde_json::Error> = serde_json::from_str(&data);
            match deserialized {
                Ok(obj) => {
                    if let Some(main_text) = obj.get("main.ts") {
                        println!("{:?}", unescape(main_text).unwrap());
                    }
                    Ok(Response::with((status::Ok, "ACCEPTED")))
                },
                Err(msg) => Ok(Response::with((status::BadRequest, format!("YOUR FAULT\n{:?}", msg))))
            }
        },
        _ => Ok(Response::with((status::NotFound, "NOT FOUND"))),
    }
}

fn main() {
    println!("Starting server on port 3074.");
    Iron::new(handle_request).http("localhost:3074").unwrap();
}
