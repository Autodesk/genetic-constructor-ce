SSH into Genetic Constructor to access logs, data, etc.

**Note**: You must be on the Autodesk Network / VPN to access these instances, and must have a valid SSH key registered with each instance.

#### Format

`ssh -i <ssh_key_path> <user>@<IP>`

#### Example

To SSH into QA with SSH key at `~/.ssh/git.autodesk.com_rsa`

`ssh -i ~/.ssh/git.autodesk.com_rsa admin@54.209.191.157`

#### IP Addresses

| instance | IP             |
|----------|----------------|
| dev      | 52.40.8.220    |
| qa       | 54.209.191.157 |
| prod     | 107.23.117.20  |
