/** @param {NS} ns **/
function findConnectionPath(ns, toFind, toScan = 'home', path = []) {
  const newPath = path.concat(toScan)
  const currentScan = ns.scan(toScan)
  if (currentScan.includes(toFind)) {
    return newPath.concat(toFind)
  }
  return currentScan
    .filter(host => !path.includes(host))
    .flatMap(host => findConnectionPath(ns, toFind, host, newPath))
}

export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('print')
  ns.enableLog('tprint')

  if (ns.args.length === 1) {
    const serverData = ns.getServer(ns.args[0])
    const fullData = {
      ...serverData,
      connectionPath: findConnectionPath(ns, ns.args[0]).join(' -> ')
    }
    ns.tprint(JSON.stringify(fullData, null, 2))
    return
  }

  let connectedHosts = ns.scan()
  const purchasedServers = ns.getPurchasedServers()

  let depth = 0
  let previousScan = connectedHosts
  while (previousScan.length > 0) {
    const currentScan = previousScan
      .flatMap(host => ns.scan(host))
      .filter(host => !connectedHosts.includes(host))
    previousScan = currentScan
    connectedHosts = connectedHosts.concat(currentScan)
    depth++
  }

  connectedHosts = connectedHosts.filter((e, i, arr) => arr.indexOf(e) === i).filter(host => !purchasedServers.includes(host))

  ns.tprint(`Scanned at depth ${depth} and found ${connectedHosts.length} hosts`)
  ns.tprint(connectedHosts.sort().join('\n'))
}
