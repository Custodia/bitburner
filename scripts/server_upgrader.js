/** @param {NS} ns **/
function getNextServerToUpgrade(ns) {
  return ns.getPurchasedServers()
    .map(host => ({ host, ram: ns.getServerMaxRam(host), i: parseInt(host.match(/(\d+)$/)[1]) }))
    .filter(({ ram }) => ram < ns.getPurchasedServerMaxRam())
    .sort(sortPurchasedServers)
    .at(0)
}

function sortPurchasedServers(server1, server2) {
  if (server1.ram != server2.ram) {
    return server1.ram - server2.ram
  }
  return server1.i - server2.i
}

export async function main(ns) {
  ns.disableLog('ALL')

  let purchasedServers = ns.getPurchasedServers()
  if (purchasedServers.length < ns.getPurchasedServerLimit()) {
    ns.spawn('purchase_8gb_server.js')
  }

  let nextServer = getNextServerToUpgrade(ns)
  while (nextServer !== undefined) {
    nextServer = getNextServerToUpgrade(ns)

    const availableMoney = ns.getServerMoneyAvailable("home")
    const maxRam = ns.getPurchasedServerMaxRam()
    if (availableMoney > ns.getPurchasedServerCost(nextServer.ram * 2)) {
      let nextRam = nextServer.ram * 2
      while (availableMoney > ns.getPurchasedServerCost(nextRam * 2) && maxRam >= nextServer.ram * 2) {
        nextRam = nextRam * 2
      }

      const newHostname = `pserv-${nextRam}GB-${nextServer.i}`
      ns.print(`Upgrading ${nextServer.host} to ${newHostname}`)
      ns.toast(`Upgrading ${nextServer.host} to ${newHostname}`, 'success')
      ns.killall(nextServer.host)
      ns.deleteServer(nextServer.host)
      ns.purchaseServer(newHostname, nextRam)

      await ns.scp('bootstrap_advanced.js', newHostname)
      ns.exec('bootstrap_advanced.js', newHostname)
	  } else {
      await ns.sleep(10000)
    }
  }
}
