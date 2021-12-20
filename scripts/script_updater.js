/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('print')
  ns.enableLog('toast')

  let connectedHosts = ns.scan()

  // Scan all servers
  let previousScan = connectedHosts
  let depth = 0
  while (previousScan.length > 0) {
    const currentScan = previousScan
      .flatMap(host => ns.scan(host))
      .filter(host => host !== 'home')
      .filter(host => !connectedHosts.includes(host))
    previousScan = currentScan
    connectedHosts = connectedHosts.concat(currentScan)
    depth++
  }
  ns.print(`Scanned at depth ${depth} and found ${connectedHosts.length} hosts`)

  let updatedHosts = 0
  for (const i in connectedHosts) {
    const host = connectedHosts[i]
    ns.print(`Penetrating ${host}...`)

    if (!ns.hasRootAccess(host))  {
      continue
    }

    updatedHosts++
    ns.killall(host)

    if (ns.getServerMaxRam(host) < ns.getScriptRam('basic_hack.js') || ns.getServerMaxRam(host) < ns.getScriptRam('bootstrap.js')) {
      ns.print(`${host} does not have enough ram to run script`)
    } else {
      await ns.scp('bootstrap.js', host)
      ns.exec('bootstrap.js', host)
    }
  }

  ns.print(`Updated scripts on ${updatedHosts} out of ${connectedHosts.length}`)
  ns.toast(`Updated scripts on ${updatedHosts} out of ${connectedHosts.length}`, 'success')
}
