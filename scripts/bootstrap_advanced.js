/** @param {NS} ns **/
export async function main(ns) {
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

  // Sleep random amount of time to avoid collisions
  await ns.sleep(Math.floor(Math.random() * 80))
  const currentHost = ns.getHostname()

  nodeClaims[currentHost] = []
  const claimedHosts = Object.values(nodeClaims).flat()
  let hackableHosts = Object.values(hostData)
    .filter(host => host.hasAdminRights && host.moneyMax > 0)
    .filter(host => !claimedHosts.includes(host.hostname))
    .sort((a, b) => b.hackStats.earningPotential - a.hackStats.earningPotential)

  await ns.scp(['grow.js', 'weaken.js', 'hack.js'], 'home', currentHost)
  const scriptCost = Math.max(ns.getScriptRam('grow.js'), ns.getScriptRam('weaken.js'), ns.getScriptRam('hack.js'))
  const maxRam = ns.getServerMaxRam(currentHost) - ns.getScriptRam('bootstrap_advanced.js')
  const maxAvailableThreads = Math.floor(maxRam / scriptCost)
  let availableThreads = maxAvailableThreads
  let pickedHosts = []

  while (availableThreads > 10) {
    if (hackableHosts.length === 0) {
      ns.toast(`No hackable hosts left, running on ${currentHost}, adding used hosts`)
      hackableHosts = Object.values(hostData)
        .filter(host => host.hasAdminRights && host.moneyMax > 0)
        .sort((a, b) => b.hackStats.earningPotential - a.hackStats.earningPotential)
    }
    const hostsThatFit = hackableHosts.filter(host => availableThreads > host.hackStats.totalThreads)
    const hostFits = hostsThatFit.length > 0
    const bestHost = hostFits ? hostsThatFit[0] : hackableHosts[0]

    const { weakenPortion, growPortion, hackPortion } = bestHost.hackStats
    const weakenThreads = hostFits ? bestHost.hackStats.weakenThreads : Math.floor(weakenPortion * availableThreads)
    const growThreads = hostFits ? bestHost.hackStats.growThreads : Math.floor(growPortion * availableThreads)
    const hackThreads = hostFits ? bestHost.hackStats.hackThreads : Math.floor(hackPortion * availableThreads)

    if (hostFits) {
      hackableHosts = hackableHosts.filter(host => host.hostname !== bestHost.hostname)
      pickedHosts.push(bestHost.hostname)
      nodeClaims[currentHost] = pickedHosts
    }
    availableThreads -= weakenThreads + growThreads + hackThreads

    if (weakenThreads > 0 && growThreads > 0 && hackThreads > 0) {
      ns.run('weaken.js', weakenThreads, bestHost.hostname)
      ns.run('grow.js', growThreads, bestHost.hostname)
      ns.run('hack.js', hackThreads, bestHost.hostname)
    } else {
      ns.print(`Not enough available threads to hack ${bestHost.hostname}, there were ${availableThreads} left over.`)
    }
  }
}
