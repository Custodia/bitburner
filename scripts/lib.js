/** @param {NS} ns **/
export function getAllHostnames(ns) {
  const currentHost = ns.getHostname()
  let _connectedHosts = [currentHost]

  let depth = -1
  let previousScan = _connectedHosts
  while (previousScan.length > 0) {
    const currentScan = previousScan
      .flatMap(host => ns.scan(host))
      .filter(host => !_connectedHosts.includes(host))
    previousScan = currentScan
    _connectedHosts = _connectedHosts.concat(currentScan)
    depth++
  }

  _connectedHosts = _connectedHosts.filter(host => host !== 'home')
  ns.print(`Scanned at depth ${depth} and found ${_connectedHosts.length} hosts`)
  return _connectedHosts
}

export function getFullDataForHost(ns) {
  return hostname => {
    const server = ns.getServer(hostname)

    const growthCallCount = ns.growthAnalyze(hostname, 2.2)
    const growthSecurityIncrease = ns.growthAnalyzeSecurity(growthCallCount)
    const growTime = ns.getGrowTime(hostname)

    const percentageOnHack = ns.hackAnalyze(hostname)
    const hackChance = ns.hackAnalyzeChance(hostname)
    const hackCallCount = 0.5 / (percentageOnHack * hackChance)
    const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackCallCount)
    const hackTime = ns.getHackTime(hostname)

    const weakenAmount = ns.weakenAnalyze(1)
    const weakenTime = ns.getWeakenTime(hostname)

    const scaledHackSecurityIncrease =
      hackSecurityIncrease * hackCallCount * (hackTime / weakenTime)
    const scaledGrowSecurityIncrease =
      growthSecurityIncrease * growthCallCount * (growTime / weakenTime)
    const securityIncrease = scaledHackSecurityIncrease + scaledGrowSecurityIncrease

    const weakenCallCount = (securityIncrease * 1.2) / weakenAmount

    const hackThreads = Math.ceil(hackCallCount * (hackTime / weakenTime))
    const growThreads = Math.ceil(growthCallCount * (growTime / weakenTime))
    const weakenThreads = Math.ceil(weakenCallCount)
    const totalThreads = hackThreads + growThreads + weakenThreads
    const hackPortion = hackThreads / totalThreads
    const growPortion = growThreads / totalThreads
    const weakenPortion = weakenThreads / totalThreads

    const earningPotential = server.moneyMax / weakenTime

    const result = {
      hostname,
      ...server,
      growthCallCount,
      growthSecurityIncrease,
      growTime,
      percentageOnHack,
      hackChance,
      hackCallCount,
      hackSecurityIncrease,
      hackTime,
      weakenAmount,
      weakenTime,
      hackStats: {
        hackThreads,
        growThreads,
        weakenThreads,
        totalThreads,
        hackPortion,
        growPortion,
        weakenPortion,
        earningPotential
      }
    }

    if (hostData) {
      hostData[hostname] = result
    }

    return result
  }
}
