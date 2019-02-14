const help = `
usage:
======
nget <options>

options:
========
"-h"
"--help"
    Print a help message describing all of Nget's command-line options.

"-V"
"--version"
    Display the version of Nget.

"-u <URL>"
"--url <URL>"
    Specify the URL to download.

"-i <filepath>"
"--input-file <filepath>"
    Read URLs from a local text file. Format is one URL per line.

"--headers <filepath>"
    Read request headers from a local text file. Format is JSON. Data structure is an Object. Keys contain header name. Values contain header value.

"--referer <value>"
    Specify request header: "Referer: <value>"
    Takes priority over value read by "--headers" for the specific header name.

"-U <value>"
"--user-agent <value>"
    Specify request header: "User-Agent: <value>"
    Takes priority over value read by "--headers" for the specific header name.

"--header <name=value>"
"--header <name:value>"
    Specify request header: "<name>: <value>"
    Takes priority over value read by "--headers" for the specific header name.

"--method <value>"
    HTTP verb. Value must be one of: "GET","HEAD","POST","PUT","DELETE","CONNECT","OPTIONS","TRACE","PATCH"

"--post-data <data>"
    Specifies a string to send as POST data.
    By default, the 'Content-Type' request header will contain: 'application/x-www-form-urlencoded'

"--post-file <filepath>"
    Read a string to send as POST data from a local text file.
    By default, the 'Content-Type' request header will contain: 'application/x-www-form-urlencoded'

"--max-redirect <number>"
    Specifies the maximum number of redirections to follow for a resource. The default is 10.

"--no-follow-redirect"
    Do not follow any redirections.

"--no-validate-status-code"
    Do not throw an Error when the status code of the response for the final request is not 200.
    This option pairs well with: "--no-follow-redirect"

"--load-cookies <filepath>"
    Specifies the text file used to store cookies. Format is JSON.

"--load-cookies true"
    Indicates that cookies should be stored in memory for the lifespan of a single Nget session.

"--no-cookies"
    Indicates that cookies must not be used during the current Nget session.
    Takes priority over: "--load-cookies"

"-P <dirpath>"
"--directory-prefix <dirpath>"
    Specifies the directory where all file downloads will be saved to. The default is "." (the current directory).

"-O <filepath>"
"--output-document <filepath>"
    Specifies where all file downloads will be saved to.
    This option pairs poorly with: "--input-file"
      * Wget would concatenate all file downloads together.
      * Nget will overwrite each file download, and only store the last.

"--content-disposition"
    Indicates that the file download should be saved with the filename obtained from the 'Content-Disposition' response header.
    The default behavior is to obtain a filename from the requested URL.
    This option pairs well with: "--directory-prefix"
    This option is nullified by: "--output-document"

"-nc"
"--no-clobber"
    Indicates that a file download should not occur when the filepath to where it would be saved already exists.
    The default behavior is to delete the existing file and download the new file in its place.

"--save-headers"
    Save the headers sent by the HTTP server to the file, preceding the actual contents, with an empty line as the separator.

"-S"
"--server-response"
    Print the headers sent by the HTTP server.
`

module.exports = help
