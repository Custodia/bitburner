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
    let allHosts = allHostnames.map(getFullDataForHostWithFormulas(ns))

    const portHackScripts = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'].filter(fileName => ns.fileExists(fileName))

    /****************************/
    /* Hack new available hosts */
    /****************************/

    const hackableHosts = allHosts
      .filter(host => !host.hasAdminRights)
      .filter(host => player.hacking >= host.requiredHackingSkill && portHackScripts.length >= host.numOpenPortsRequired)

    hackableHosts.forEach(host => {
      portHackScripts.forEach(script => runPortScript(ns, script, host.hostname))
      ns.nuke(host.hostname)
    })
    const rootableHosts = allHosts.filter(host => host.hasAdminRights)
    const nextHostAtSKill = allHosts
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

    /***************************************************/
    /* Start utilizing hosts that have no activity yet */
    /***************************************************/

    allHosts = allHostnames.map(getFullDataForHostWithFormulas(ns))
    const utilizableHosts = allHosts.filter(host => host.hasAdminRights && host.ramUsed === 0)

    for (const i in utilizableHosts) {
      const host = utilizableHosts[i]
      if (host.maxRam > ns.getScriptRam('bootstrap_advanced.js')) {
        ns.print(`Bootstrapping ${host.hostname}`)
        await ns.scp('bootstrap_advanced.js', host.hostname)
        ns.exec('bootstrap_advanced.js', host.hostname)
      } else {
        const threads = Math.floor(host.maxRam / ns.getScriptRam('basic_hack.js'))
        if (threads > 0) {
          ns.print(`Running basic hack on ${host.hostname}`)
          await ns.scp('basic_hack.js', host.hostname)
          ns.exec('basic_hack.js', host.hostname)
        }
      }
    }

    await ns.sleep(10000)
  }
}
