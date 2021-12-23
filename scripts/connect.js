/** @param {NS} ns **/
import { findConnectionPath } from 'lib.js'

export function autocomplete(data, _args) {
  return [...data.servers]
}

export async function main(ns) {
  if (!ns.serverExists(ns.args[0])) {
    ns.tprint(`Server ${ns.args[0]} does not exist!`)
    return
  }
  const path = findConnectionPath(ns, ns.args[0])
  path.shift()
  const command = path.map(server => `connect ${server}`).join("; ")

  // Acquire a reference to the terminal text field
  const terminalInput = document.getElementById("terminal-input");

  // Set the value to the command you want to run.
  terminalInput.value=command;

  // Get a reference to the React event handler.
  const handler = Object.keys(terminalInput)[1];

  // Perform an onChange event to set some internal values.
  terminalInput[handler].onChange({target:terminalInput});

  // Simulate an enter press
  terminalInput[handler].onKeyDown({keyCode:13,preventDefault:()=>null});
}
