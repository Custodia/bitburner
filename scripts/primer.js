/** @param {NS} ns **/
import { getAllHostnames, getFullDataForHost } from 'lib.js'

export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('print')
  const currentHost = ns.getHostname()

  while (true) {
   const allHostnames = getAllHostnames(ns)

    const allHosts = allHostnames.map(getFullDataForHost(ns))
    const hostnamesBeingHacked = [primeTarget]

    const scriptCost = Math.max(ns.getScriptRam('hack.js'), ns.getScriptRam('grow.js'), ns.getScriptRam('weaken.js'))
    const ramBuffer = 100
    const [totalRam, usedRam] = ns.getServerRam(currentHost)
    const availableRam = totalRam - usedRam - ramBuffer

    const maximumThreads = Math.ceil(availableRam / scriptCost)
    let availableThreads = maximumThreads
    let scriptTimes = []
    ns.print('')
    ns.print(`availableThreads: ${availableThreads}`)

    let weakenableHosts = allHosts
      .filter(host => host.hasAdminRights && host.minDifficulty < host.hackDifficulty && host.moneyAvailable == host.moneyMax)
      .filter(host => !hostnamesBeingHacked.includes(host.hostname))
      .sort((a, b) => a.weakenTime - b.weakenTime)

    // Weaken hosts with available threads
    while (availableThreads > 0 && weakenableHosts.length > 0) {
      const hostToWeaken = weakenableHosts.shift()
      const { hostname, hackDifficulty, minDifficulty, weakenAmount, growTime } = hostToWeaken
      const requiredThreads = Math.max(Math.ceil((hackDifficulty - minDifficulty) / weakenAmount), 1)
      const usedThreads = Math.min(availableThreads, requiredThreads)
      ns.print(`Weakening ${hostname} with ${usedThreads}. It takes ${ns.tFormat(growTime)}`)
      availableThreads -= usedThreads
      scriptTimes.push(Math.ceil(growTime))
      ns.run('weaken.js', usedThreads, hostname, 'once')
    }

    let growableHosts = allHosts
      .filter(host => host.hasAdminRights && host.moneyAvailable < host.moneyMax)
      .filter(host => !hostnamesBeingHacked.includes(host.hostname))
      .sort((a, b) => a.growTime - b.growTime)

    // Grow hosts with available threads
    while(availableThreads > 0 && growableHosts.length > 0) {
      const hostToGrow = growableHosts.shift()
      const { hostname, moneyAvailable, moneyMax, growTime } = hostToGrow
      const multiplier = Math.ceil(moneyMax / moneyAvailable)
      const requiredThreads = ns.growthAnalyze(hostname, multiplier)
      const usedThreads = Math.min(availableThreads, requiredThreads)
      ns.print(`Growing ${hostname} with ${usedThreads}. It takes ${ns.tFormat(growTime)}`)
      availableThreads -= usedThreads
      scriptTimes.push(Math.ceil(growTime))
      ns.run('grow.js', usedThreads, hostname, 'once')
    }

    const timeToSleep = scriptTimes.length > 0 ? Math.min(...scriptTimes) : 1000
    await ns.sleep(timeToSleep)
  }
}
