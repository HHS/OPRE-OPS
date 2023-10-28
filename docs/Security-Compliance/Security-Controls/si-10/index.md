# System and Information Integrity
## SI-10 - Information Input Validation

Check the validity of the following information inputs:

i. Type checks – Checks to ensure that the input is, in fact, a valid data string and not any other type of object.<br />
* This includes validating that input strings contain no inserted executable content or active content that can be mistakenly interpreted as instructions to the system, including, but not limited to. Trojan horses, malicious code, metacode, metadata, or metacharacters, Hypertext Markup Language (HTML), Extensible Markup Language (XML), JavaScript, Structured Query Language (SQL) statements, shell script, and streaming media.<br />
* Inputs passed to interpreters must be prescreened to prevent the content from being unintentionally interpreted as commands.

ii. Format and syntax checks – Checks to verify that data strings conform to defined formatting and syntax requirements for that type of input.

iii. Parameter and character validity checks – Checks to verify that any parameters or other characters entered, including format parameters for routines that have formatting capabilities, have recognized valid values.<br />
* Any parameters that have invalid values must be rejected and discarded.<br />
* Web server applications must be configured to prohibit invalid data from web clients in order to mitigate web application vulnerabilities including, but not limited to, buffer overflow, cross-site scripting, null byte attacks, SQL injection attacks, and HTTP header manipulation.

## OPS Implementation

TODO: need some text around Vest, SQL Alchemy, and other input sanitization techniques, front end served from static files, do not operate a separate web server. See any inherited text

### Control Origination

Hybrid with IaaS provider and OPS

### Related Content
