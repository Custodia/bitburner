/** @param {NS} ns **/
import { getAllHostnames, getFullDataForHostWithFormulas, runPortScript } from 'lib.js'

export async function main(ns) {
  ns.disableLog('ALL')

  while (true) {
    // Cleanup deleted hosts
    for (const key in hostData) {
      if (!ns.serverExists(key)) {
        delete hostData[key]
      }
    }
    for (const key in nodeClaims) {
      if (!ns.serverExists(key)) {
        delete nodeClaims[key]
      }
    }

    // Get all hosts and host information
    const player = ns.getPlayer()
    const allHostnames = getAllHostnames(ns)
    const allHosts = allHostnames.map(getFullDataForHostWithFormulas(ns))

    const portHackScripts = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'].filter(fileName => ns.fileExists(fileName))

    const hackableHosts = Object.values(hostData)
      .filter(host => !host.hasAdminRights)
      .filter(host => player.hacking >= host.requiredHackingSkill && portHackScripts.length >= host.numOpenPortsRequired)

    hackableHosts.forEach(host => {
      portHackScripts.forEach(script => runPortScript(ns, script, host.hostname))
      ns.nuke(host.hostname)
    })
    const rootableHosts = Object.values(hostData).filter(host => host.hasAdminRights)
    const nextHostAtSKill = Object.values(hostData)
       .filter(host => player.hacking < host.requiredHackingSkill && portHackScripts.length >= host.numOpenPortsRequired)
      .reduce((acc, host) => Math.min(acc, host.requiredHackingSkill), Infinity)

    if (hackableHosts.length > 0) {
      ns.tprint('Results on latest successfull penetration:')
      ns.tprint(`Hacked ${hackableHosts.length} new hosts`)
      ns.tprint(`Currently can access ${rootableHosts.length} out of ${allHosts.length}`)
      if (nextHostAtSKill !== Infinity) {
        ns.tprint(`Next host unlocks at ${nextHostAtSKill}`)
      } else if (portHackScripts.length < 5) {
        ns.tprint(`More port tools are needed to unlock next host`)
      }
    }

    await ns.sleep(10000)
  }
}
