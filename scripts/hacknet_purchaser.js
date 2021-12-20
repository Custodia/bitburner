/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL')

  const maxNodes = ns.hacknet.maxNumNodes()

  while (true) {
    const spendLimit = ns.getServerMoneyAvailable('home') * 0.01
    const currentNodes = ns.hacknet.numNodes()
    let skip = false

    if (maxNodes > currentNodes && spendLimit > ns.hacknet.getPurchaseNodeCost()) {
      ns.print('Purchasing new node')
      ns.hacknet.purchaseNode()
      skip = true
    }

    for (let i = 0; i < currentNodes; i++) {
      if (!skip && spendLimit > ns.hacknet.getLevelUpgradeCost(i, 1)) {
        let level = 1
        while (spendLimit > ns.hacknet.getLevelUpgradeCost(i, level + 1)) {
          level++
        }
        ns.print(`Upgrade node ${i} level by ${level}`)
        ns.hacknet.upgradeLevel(i, 1)
        skip = true
      }
    }

    for (let i = 0; i < currentNodes; i++) {
      if (!skip && spendLimit > ns.hacknet.getRamUpgradeCost(i, 1)) {
        let level = 1
        while (spendLimit > ns.hacknet.getRamUpgradeCost(i, level + 1)) {
          level++
        }
        ns.print(`Upgrade node ${i} ram by ${level} levels`)
        ns.hacknet.upgradeRam(i, 1)
        skip = true
      }
    }

    for (let i = 0; i < currentNodes; i++) {
      if (!skip && spendLimit > ns.hacknet.getCoreUpgradeCost(i, 1)) {
        let level = 1
        while (spendLimit > ns.hacknet.getCoreUpgradeCost(i, level + 1)) {
          level++
        }
        ns.print(`Upgrade node ${i} core count by ${level}`)
        ns.hacknet.upgradeCore(i, 1)
        skip = true
      }
    }

    if (skip)
      continue

    await ns.sleep(60000)
  }
}
