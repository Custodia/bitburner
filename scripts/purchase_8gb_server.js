/** @param {NS} ns **/
const ram = 8
let i = 0

export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('spawn')
  ns.enableLog('exec')
  ns.enableLog('toast')

  i = ns.getPurchasedServers().length
  while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
      const hostname = ns.purchaseServer(`pserv-${ram}GB-${i}`, ram)
      ns.toast(`Purchased server ${hostname}`, 'success')
	    await ns.scp('bootstrap.js', hostname)
      ns.exec('bootstrap.js', hostname)
      i = ns.getPurchasedServers().length
	  } else {
      await ns.sleep(10000)
    }
  }

  ns.toast('All servers bought, starting server upgrade process.', 'success')
  ns.spawn('server_upgrader.js')
}
