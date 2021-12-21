/** @param {NS} ns **/
function runPortScript(ns, fileName, host) {
  switch (fileName) {
    case 'BruteSSH.exe':
      return ns.brutessh(host)
    case 'FTPCrack.exe':
      return ns.ftpcrack(host)
    case 'relaySMTP.exe':
      return ns.relaysmtp(host)
    case 'HTTPWorm.exe':
      return ns.httpworm(host)
    case 'SQLInject.exe':
      return ns.sqlinject(host)
  }
}

function getAllConnectedHosts(ns) {
  let _connectedHosts = ns.scan()
  const purchasedServers = ns.getPurchasedServers()

  let depth = 0
  let previousScan = _connectedHosts
  while (previousScan.length > 0) {
    const currentScan = previousScan
      .flatMap(host => ns.scan(host))
      .filter(host => !_connectedHosts.includes(host))
    previousScan = currentScan
    _connectedHosts = _connectedHosts.concat(currentScan)
    depth++
  }

  _connectedHosts = _connectedHosts.filter(host => host !== 'home').filter(host => !purchasedServers.includes(host))
  ns.print(`Scanned at depth ${depth} and found ${_connectedHosts.length} hosts`)
  return _connectedHosts
}

export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('sleep')
  ns.enableLog('print')
  ns.enableLog('tprint')

  let _reachedHosts = []
  let _hackedHosts = []
  let _connectedHosts = getAllConnectedHosts(ns)
  while (_reachedHosts.length < _connectedHosts.length) {
    _reachedHosts = []
    _hackedHosts = []
    let nextHostAtSKill = Number.MAX_SAFE_INTEGER

    _connectedHosts = getAllConnectedHosts(ns)
    let portHackScripts = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe']
    portHackScripts = portHackScripts.filter(fileName => ns.fileExists(fileName))

    for (const i in _connectedHosts) {
      const host = _connectedHosts[i]
      // ns.print(`Penetrating ${host}...`)

      const hackingLevel = ns.getHackingLevel()
      const requiredHackingLevel = ns.getServerRequiredHackingLevel(host)
      if (hackingLevel < requiredHackingLevel) {
        // ns.print(`Not big enough hacking level for ${host} (${hackingLevel}/${requiredHackingLevel})`)
        nextHostAtSKill = Math.min(nextHostAtSKill, requiredHackingLevel)
        continue
      }

      const portsRequired = ns.getServerNumPortsRequired(host)
      if (portsRequired <= portHackScripts.length) {
        portHackScripts.forEach(fileName => runPortScript(ns, fileName, host))
      } else {
        // ns.print(`${host} requires ${portsRequired} ports to be hacked but only ${portHackScripts.length} port scripts exist.`)
        continue
      }

      if (!ns.hasRootAccess(host)) {
        ns.nuke(host)
      }

      _reachedHosts.push(host)
      const serverAvailableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host)
      if (serverAvailableRam < ns.getScriptRam('basic_hack.js') || serverAvailableRam < ns.getScriptRam('bootstrap.js')) {
        // ns.print(`${host} does not have enough ram to run script`)
      } else {
        await ns.scp('bootstrap.js', host)
        ns.exec('bootstrap.js', host)
        _hackedHosts.push(host)
      }
    }

    connectedHosts = _connectedHosts
    reachedHosts = _reachedHosts
    latestHackedHosts = _hackedHosts

    ns.print(`Hacked ${_hackedHosts.length} new hosts out of ${_connectedHosts.length}`)
    ns.print(`Currently hacking ${_reachedHosts.length} out of ${_connectedHosts.length}`)
    ns.print(`Next host unlocks at ${nextHostAtSKill}`)
    if (_hackedHosts.length > 0) {
      ns.tprint('Results on latest successfull penetration:')
      ns.tprint(`Hacked ${_hackedHosts.length} new hosts out of ${_connectedHosts.length}`)
      ns.tprint(`Currently hacking ${_reachedHosts.length} out of ${_connectedHosts.length}`)
      ns.tprint(`Next host unlocks at ${nextHostAtSKill}`)
    }

    await ns.sleep(60000)
  }
}
