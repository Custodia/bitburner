/** @param {NS} ns **/
import { getAllHostnames, getFullDataForHostWithFormulas, runPortScript } from 'lib.js'

export async function main(ns) {
  ns.disableLog('ALL')

  let firstRun = true
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

    if (firstRun || hackableHosts.length > 0) {
      ns.print('')
      if (hackableHosts.length > 0) {
        ns.tprint('Results on latest successful penetration:')
        ns.print('Results on latest successful penetration:')
        ns.tprint(`Hacked ${hackableHosts.length} new hosts`)
        ns.print(`Hacked ${hackableHosts.length} new hosts`)
      }
      ns.tprint(`Currently can access ${rootableHosts.length} out of ${allHosts.length} hosts`)
      ns.print(`Currently can access ${rootableHosts.length} out of ${allHosts.length} hosts`)
      if (nextHostAtSKill !== Infinity) {
        ns.tprint(`Next host unlocks at ${nextHostAtSKill} hacking skill`)
        ns.print(`Next host unlocks at ${nextHostAtSKill} hacking skill`)
      } else if (portHackScripts.length < 5) {
        ns.tprint(`More port tools are needed to unlock next host`)
        ns.print(`More port tools are needed to unlock next host`)
      }
    }

    /***************************************************/
    /* Start utilizing hosts that have no activity yet */
    /***************************************************/

    allHosts = allHostnames.map(getFullDataForHostWithFormulas(ns))
    const utilizableHosts = allHosts.filter(host => host.hasAdminRights && host.ramUsed === 0)

    for (const i in utilizableHosts) {
      const host = utilizableHosts[i]
      if (host.maxRam > ns.getScriptRam('bootstrap.js')) {
        ns.print(`Bootstrapping ${host.hostname}`)
        await ns.scp('bootstrap.js', host.hostname)
        ns.exec('bootstrap.js', host.hostname)
      } else {
        const threads = Math.floor(host.maxRam / ns.getScriptRam('basic_hack.js'))
        if (threads > 0) {
          ns.print(`Running basic hack on ${host.hostname}`)
          await ns.scp('basic_hack.js', host.hostname)
          ns.exec('basic_hack.js', host.hostname)
        }
      }
    }

    /*************************************/
    /* Utilize extra ram on home machine */
    /*************************************/

    const runningScripts = ['main.js', 'purchase_8gb_server.js', 'server_upgrader.js', 'hacknet_purchaser.js']
    const oneOffScripts = ['connect.js', 'pull.js', 'scanner.js']

    const usedRam = ns.getServerUsedRam('home')
    const maxRam = ns.getServerMaxRam('home')
    let availableRam = maxRam - usedRam
    const runningProcesses = ns.ps('home')


    for (const i in runningScripts) {
      const script = runningScripts[i]
      if (!runningProcesses.some(processInfo => processInfo.filename === script)) {
        availableRam -= ns.getScriptRam(script, 'home')
      }
    }
    const oneOffScriptMaxCost = oneOffScripts.reduce((acc, script) => {
      return ns.fileExists(script, 'home') ? Math.max(acc, ns.getScriptRam(script, 'home')) : acc
    }, 0)
    availableRam -= oneOffScriptMaxCost
    const runningHackProcess = runningProcesses.find(runningProcess => runningProcess.filename == 'basic_hack.js')
    const currentThreads = runningHackProcess ? runningHackProcess.threads : 0
    availableRam += currentThreads * ns.getScriptRam('basic_hack.js')

    const availableThreads = Math.floor(availableRam / ns.getScriptRam('basic_hack.js'))
    if (availableThreads > currentThreads) {
      if (runningHackProcess) {
        ns.kill(runningHackProcess.filename, 'home', ...runningHackProcess.args)
      }
      const sortedHosts = [...allHosts]
        .filter(host => host.hackStats.earningPotential > 0)
        .sort((a, b) => b.hackStats.earningPotential - a.hackStats.earningPotential)

      if (sortedHosts.length == 1) {
        ns.print(`Spawning ${availableThreads} threads running basic_hack with no target`)
        ns.run('basic_hack.js', availableThreads)
      } else if (sortedHosts.length > 1) {
        const targetHostname = sortedHosts[1].hostname
        ns.print(`Spawning ${availableThreads} threads running basic_hack targeting ${targetHostname}`)
        ns.run('basic_hack.js', availableThreads, targetHostname)
      }
    }

    firstRun = false
    await ns.sleep(25000)
  }
}
