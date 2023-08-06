import React, { Component } from 'react';

const cmds = new Map([
  ["userInfo", {"desc": "see someones info", "req": 2, "max": 2}], 
  ["connect", {"desc": "Connect to another player/npc IP", "help": "Type 'connect (ip)' (requires pass to already be known use crack command on ip if unknown)", "req": 2, "max": 2}], 
  ["bye", {"desc": "Disconnect from a player/npc IP", "help": "Type 'bye' to leave a connection", "req": 1, "max": 1}], 
  ["ls", {"desc": "List the files of yours or others systems", "help": "Type 'ls' to list current connections files, 'local ls' to list your own no matter where your connected, 'ls (ip)' to list anothers files if you own there root password", "req": 1, "max": 2}], 
  ["rm", {"desc": "Remove a file from yours or others systems", "help": "Type 'rm (file name) or rmid (file ID) to remove a file from your system and complete task in TaskManager window (local rm to remove files on your own system no matter your current connection)", "req": 2, "max": 10}],
  ["ul", {"desc": "Upload a file from yours system to others systems", "help": "Type 'ul (file name)' or 'ulid (file ID)' to give another system a file (you must own the file first on your system) then complete the task in TaskManager window", "req": 2, "max": 10}],
  ["dl", {"desc": "Download a file from others system to your systems", "help": "Type 'dl (file name)' or 'dlid (file ID)' to take a file from others systems and complete the task in the TaskManager window", "req": 2, "max": 10}],
  ["install", {"desc": "Install a file on yours or others systems to activate and use the software", "help": "Type 'install (file name)' or installid (file ID) to install either software or viruses on yours or others systems and complete the task in the TaskManager window", "req": 2, "max": 10}],
  ["recovery", {"desc": "Recover the basic files on your system to get you going again (firewall, cracker,netDefence,etc) this does not recover previously lost files nor the levels of recovered files just remember to back up on nas ('nas -help' for more)", "help": "Type 'recovery' to restore basic files on your system", "req": 1, "max": 1}], 
  ["mine", {"desc": "Collect cash from a miner virus after it has been mining for some time", "help": "Connect to the IP the miner is located at and type 'mine' then after this the cash will be wired to your primary account automatically", "req": 1, "max": 2}],
  ["whois", {"desc": "Search up personal and criminal information of a player/npc (seaching by name or by ip may give different types of info)", "help": "Type 'whois (name or ip)' to search up information about a npc or player. (whois name/ip ?) to get even more details", "req": 2, "max": 3}],
  ["format", {"desc": "Delete all of the contents of a HardDrive, Nas, or owned remote servers", "help": "Type 'format (harddrive/nas name/server name)' to remove ALL files contained on the server'", "req": 2, "max": 10}],
  ["grep", {"desc": "Search for a file by name/key words/extention to find info within a file by searching up what you think the file may contain", "help": "Type 'grep (name,word,ext) (term)' Ex. 'grep name Fire' finds Firewall.fw, firearms.stock, etc.", "req": 3, "max": 10}],
  ["rename", {"desc": "Change the name of a file", "help": "Type 'rename (old name) (new name). You can not change the file extention", "req": 3, "max": 3}],
  ["touch", {"desc": "Create a txt file to write in", "help": "touch (file name)", "req": 2, "max": 2}]
]);

class Terminal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      input: '',
      output: [],
    };
  }

  handleChange = (e) => {
    this.setState({ input: e.target.value });
  };

  handleEnter = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      let rules = this.state.input.trim().replace(/ +(?= )/g, '').split(";");
      this.setState({ input: '' });
      if (rules) {
        for (let i = 0; i < rules.length; i++) {
          let args = rules[i].split(" ");
          let c = args[0];
          let len = args.length;
          if (c === "clear") {
            this.setState({ output: [] });
          } else if (cmds.has(c)) {
            const cmdInfo = cmds.get(c);
            if (args[1] === "help" || args[1] === "desc") {
              this.print(cmdInfo[args[1]]);
            } else if (len >= cmdInfo.req && len <= cmdInfo.max) {
              // Process the command and add it to the output
              const response = this.processCommand(args);
              this.print(rules[i]);
              this.print(response);
            } else {
              this.print("Invalid amount of args (" + cmdInfo.req + " required)");
            }
          } else {
            this.print("Invalid Command");
          }
        }
      } else {
        this.print("Bruh");
      }
    }
  };

  print = (text) => {
    this.setState((prevState) => ({
      output: [...prevState.output, { type: 'output', text }],
    }));
  };

  processCommand = (args) => {
    // Implement the command processing logic here
    // Return the appropriate response based on the command
    // This function is the same as before

    // For demonstration purposes, we'll return a simple response
    return `Command: ${args[0]}, Arguments: ${args.slice(1).join(', ')}`;
  };

  render() {
    const { input, output } = this.state;

    return (
      <div>
        <div>
          {output.map((item, index) => (
            <div key={index} className={item.type}>
              {item.text}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={this.handleChange}
          onKeyDown={this.handleEnter}
        />
      </div>
    );
  }
}

export default Terminal;
