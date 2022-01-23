/** @param {NS} ns **/
export function runConsoleCommand(command) {
  // Acquire a reference to the terminal text field
  const terminalInput = document.getElementById("terminal-input");

  // Set the value to the command you want to run.
  terminalInput.value=command;

  // Get a reference to the React event handler.
  const handler = Object.keys(terminalInput)[1];

  // Perform an onChange event to set some internal values.
  terminalInput[handler].onChange({target:terminalInput});

  // Simulate an enter press
  terminalInput[handler].onKeyDown({keyCode:13,preventDefault:()=>null});
}

export function runPortScript(ns, fileName, host) {
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

export function findConnectionPath(ns, toFind, toScan = 'home', path = []) {
  const newPath = path.concat(toScan)
  const currentScan = ns.scan(toScan)
  if (currentScan.includes(toFind)) {
    return newPath.concat(toFind)
  }
  return currentScan
    .filter(host => !path.includes(host))
    .flatMap(host => findConnectionPath(ns, toFind, host, newPath))
}

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
  return _connectedHosts
}

export function getFullDataForHostWithFormulas(ns) {
  return hostname => {
    const player = ns.getPlayer()
    const server = ns.getServer(hostname)
    const {
      purchasedByPlayer,
      hasAdminRights,
      backdoorInstalled,
      requiredHackingSkill,
      numOpenPortsRequired,
      moneyMax,
      maxRam,
      ramUsed
    } = server
    const optimalServer = {
      ...server,
      hackDifficulty: server.minDifficulty
    }

    const weakenTime = ns.formulas.hacking.weakenTime(optimalServer, player)
    const growTime = ns.formulas.hacking.growTime(optimalServer, player)
    const hackTime = ns.formulas.hacking.hackTime(optimalServer, player)

    const hackChance = ns.formulas.hacking.hackChance(optimalServer, player)
    const hackPercent = ns.formulas.hacking.hackPercent(optimalServer, player)
    const hackCalls = Math.ceil(0.5 / (hackPercent * hackChance))
    const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackCalls)

    let growCalls = 1
    let growPercent = ns.formulas.hacking.growPercent(optimalServer, growCalls, player)
    let previousPercent = -1
    while (growPercent < 3) {
      growCalls++
      growPercent = ns.formulas.hacking.growPercent(optimalServer, growCalls, player)
      if (growPercent == previousPercent) {
        growCalls = Infinity
        break;
      } else {
        previousPercent = growPercent
      }
    }
    const growSecurityIncrease = ns.growthAnalyzeSecurity(growCalls)

    const weakenAmount = ns.weakenAnalyze(1)
    const weakenCalls = Math.ceil(((hackSecurityIncrease + growSecurityIncrease) / weakenAmount) * 1.2)

    const hackThreads = Math.ceil(hackCalls / (weakenTime / hackTime))
    const growThreads = Math.ceil(growCalls / (weakenTime / growTime))
    const weakenThreads = Math.ceil(weakenCalls / (weakenTime / weakenTime))
    const totalThreads = hackThreads + growThreads + weakenThreads

    const hackPortion = hackThreads / totalThreads
    const growPortion = growThreads / totalThreads
    const weakenPortion = weakenThreads / totalThreads

    const earningPotential = server.moneyMax / (weakenTime * totalThreads)
    const earningPotentialPerMinute = earningPotential * 600

    const result = {
      hostname,
      purchasedByPlayer,
      hasAdminRights,
      backdoorInstalled,
      requiredHackingSkill,
      numOpenPortsRequired,
      moneyMax,
      maxRam,
      ramUsed,
      server,
      hackInfoStats: {
        hackChance,
        hackPercent,
        hackSecurityIncrease,

        growSecurityIncrease,
        weakenAmount,

        earningPotentialPerMinute
      },
      hackStats: {
        // Threads
        hackThreads,
        growThreads,
        weakenThreads,
        totalThreads,
        // Thread portions
        hackPortion,
        growPortion,
        weakenPortion,
        // Times
        growTime,
        weakenTime,
        hackTime,
        // Stats
        earningPotential
      }
    }

    if (hostData) {
      hostData[hostname] = result
    }

    return result
  }
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

    const earningPotential = server.moneyMax / (weakenTime * totalThreads)

    const result = {
      hostname,
      ...server,
      server,
      weakenAmount,
      hackStats: {
        // Threads
        hackThreads,
        growThreads,
        weakenThreads,
        totalThreads,
        // Thread portions
        hackPortion,
        growPortion,
        weakenPortion,
        // Times
        growTime,
        weakenTime,
        hackTime,
        // Stats
        earningPotential
      }
    }

    if (hostData) {
      hostData[hostname] = result
    }

    return result
  }
}

export function getPrimeThreadCounts(ns, targetHost) {
  const player = ns.getPlayer()
  const currentHost = ns.getHostname()
  const currentServer = ns.getServer(currentHost)
  const { cpuCores } = currentServer
  const targetServer = ns.getServer(targetHost)

  let initialWeakenCalls = 0
  while (ns.weakenAnalyze(initialWeakenCalls, cpuCores) < targetServer.hackDifficulty - targetServer.minDifficulty) {
    initialWeakenCalls++
  }

  let growCalls = 0
  let growPercent = ns.formulas.hacking.growPercent(targetServer, growCalls, player, cpuCores)
  const targetPercent = (targetServer.moneyMax / targetServer.moneyAvailable) * 100 * 1.01
  let previousPercent = -1
  while (growPercent < targetPercent) {
    growCalls++
    growPercent = ns.formulas.hacking.growPercent(targetServer, growCalls, player, cpuCores)
    if (growPercent == previousPercent) {
      throw('growPercent == previousPercent')
    } else {
      previousPercent = growPercent
    }
  }
  const growthSecurityIncrease = ns.growthAnalyzeSecurity(growCalls)

  let growWeakenCalls = 1
  while (ns.weakenAnalyze(growWeakenCalls, cpuCores) < growthSecurityIncrease) {
    growWeakenCalls++
  }

  return {
    initialWeakenCalls,
    growCalls,
    growWeakenCalls
  }
}

export async function primeTarget(ns, targetHost) {
  const player = ns.getPlayer()
  const currentHost = ns.getHostname()
  const targetServer = ns.getServer(targetHost)

  const {
    initialWeakenCalls,
    growCalls,
    growWeakenCalls
  } = getPrimeThreadCounts(ns, targetHost)

  const weakenTime = ns.formulas.hacking.weakenTime(targetServer, player)
  const growTime = ns.formulas.hacking.growTime(targetServer, player)

  const maxTime = Math.max(weakenTime, growTime)

  await ns.scp(['hack.js', 'weaken.js', 'grow.js'], 'home', currentHost)

  if (initialWeakenCalls > 0) {
    ns.exec('weaken.js', currentHost, initialWeakenCalls, targetHost, 1, maxTime - weakenTime)
  }
  if (growCalls > 0) {
    ns.exec('grow.js',   currentHost, growCalls,          targetHost, 1, maxTime - growTime + 100)
  }
  if (growWeakenCalls > 0) {
    ns.exec('weaken.js', currentHost, growWeakenCalls,    targetHost, 1, maxTime - weakenTime + 200)
  }

  if (initialWeakenCalls > 0 || growCalls > 0 || growWeakenCalls > 0) {
    await sleep(ns, maxTime + 500)
  }
}
