/** @param {NS} ns **/
export async function main(ns) {
  // Update hostData not to include non existant servers
  for (const key in hostData) {
    if (!ns.serverExists(key)) {
      delete hostData[key]
    }
  }
  nodeClaims = {}

  const boughtServers = ns.getPurchasedServers()
  let hackableServers = Object.values(hostData)
    .filter(host => host.hasAdminRights && host.moneyMax > 0 && host !== 'home' && host !== primeTarget)

  for (const i in boughtServers) {
    const hostToBootstrap = boughtServers[i]

    const availableThreads = Math.ceil(ns.getServerMaxRam(hostToBootstrap) / 2)

    hackableServers = hackableServers
      .sort((a, b) => {
        const aFits = a.hackStats.totalThreads < availableThreads
        const bFits = b.hackStats.totalThreads < availableThreads
        if (aFits == bFits) {
          b.hackStats.earningPotential - a.hackStats.earningPotential
        } else {
          aFits ? 1 : -1
        }
      })
    const hostToHack = hackableServers.shift()

    ns.print(`Setting ${hostToBootstrap} to hack ${hostToHack.hostname}`)
    await ns.scp('bootstrap_advanced.js', 'home', hostToBootstrap);
    await ns.sleep(1000)
    ns.killall(hostToBootstrap)
    ns.exec('bootstrap_advanced.js', hostToBootstrap, 1)
  }
}
