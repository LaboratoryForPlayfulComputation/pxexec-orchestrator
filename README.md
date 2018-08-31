# pxexe-orchestrator

This program listens for connections from [PXT](github.com/Microsoft/pxt) editors
such as [pxt-pi](github.com/LaboratoryForPlayfulComputation/pxt-pi), compiles
and runs the submitted typescript code using `tsc` and `Node`.

It requires the support of
[pxexec-runtime](github.com/LaboratoryForPlayfulComputation/pxexec-runtime) to
execute code.

# !!! DO NOT RUN THIS REPO  !!! ...

... on anything of great importance. Its intended purpose and design is to
create an intentional Arbitrary Code Execution endpoint. In case it isn't clear:

** This program listens to an IP socket and will compile and run ANY TypeScript
code you send to it. If you run this program, you are potentially granting the
entire internet access to run code on that machine. **

## Configuration

The user can configure the behavior of the program through two environment
variables. __Note__: these are intended for debugging purposes only.

- PXEXEC\_OVERRIDE\_EDITOR\_PATH="/path/to/pxt/staticpkg" -- set the directory
  to bind to `/editor` in the application. This should be the path to a
  staticpkg of pxt-pi. Otherwise, the editor must be located in `./editor`
  relative to the executable.

- PXEXEC\_HOST="<ip>:<port>" -- set the IP and port to listen to for connections.

## Contributors

- William Temple

## License

This program is licensed under the terms of the GNU General Public License,
version 3.
