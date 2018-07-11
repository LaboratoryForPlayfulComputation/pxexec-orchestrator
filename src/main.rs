extern crate iron;
extern crate rustc_serialize;

use iron::prelude::*;
use iron::status;

use iron::method::Method;

use rustc_serialize::json;

fn handle_request(req: &mut Request) -> IronResult<Response> {
    println!("{:?}", req);
    match req.method {
        Method::Post => {
            Ok(Response::with((status::Ok, "OK")))
        },
        _ => Ok(Response::with((status::NotFound, "NOT FOUND"))),
    }
}

fn main() {
    println!("Starting server on port 3000.");
    Iron::new(handle_request).http("localhost:3000").unwrap();
}
