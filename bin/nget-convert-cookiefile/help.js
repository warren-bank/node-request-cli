const help = `
usage:
======
nget-convert-cookiefile --json-to-text --in <filepath> --out <filepath>
nget-convert-cookiefile --text-to-json --in <filepath> --out <filepath>

options:
========
"-h"
"--help"
    Print a help message describing all of Nget's command-line options.

"-V"
"--version"
    Display the version of Nget.

"--json-to-text"
    Enable the conversion operation: JSON to Netscape text format

"--text-to-json"
    Enable the conversion operation: Netscape text format to JSON

"--in <filepath>"
    Specify path to input file.

"--out <filepath>"
    Specify path to output file.
`

module.exports = help
