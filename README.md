# pxexe-orchestrator

This program listens for connections from [PXT](github.com/Microsoft/pxt) editors
such as [pxt-pi](github.com/LaboratoryForPlayfulComputation/pxt-pi), compiles
and runs the submitted typescript code using `tsc` and `Node`.

It requires the support of [pxexec-runtime](github.com/LaboratoryForPlayfulComputation/pxexec-runtime) to execute code.

## DO NOT RUN THIS REPO ...

... on anything of great importance. Its intended purpose and design is to
create an intentional Arbitrary Code Execution endpoint. In case it isn't clear:

** This program listens to an IP socket and will compile and run ANY TypeScript
code you send to it. If you run this program, you are potentially granting the
entire internet access to run code on that machine. **

## Contributors

- William Temple

## License

This program is licensed under the terms of the GNU General Public License, version 3.