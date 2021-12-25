/** @param {NS} ns **/
export async function main(ns) {
  const currentHost = ns.getHostname()

  // Initialize global variables
  window.primeTarget = 'n00dles'
  window.nodeClaims = {}
  window.hostData = {}

  const url = `https://raw.githubusercontent.com/Custodia/bitburner/master/scripts/pull.js`
  const result = await ns.wget(url, `pull.js`)
  if (result) {
    ns.tprint(`Succesfully downloaded pull.js`)
  } else {
    ns.tprint(`Failed to download pull.js`)
    return
  }

  ns.run('pull.js')
  while (ns.isRunning('pull.js', currentHost)) {
    await ns.sleep(100)
  }

  ns.tprint('')
  ns.tprint('Starting main.js')
  ns.spawn('main.js')
}
