/** @param {NS} ns **/
import { findConnectionPath, runConsoleCommand } from 'lib.js'

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
  runConsoleCommand(command)
}
