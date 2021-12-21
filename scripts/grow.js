/** @param {NS} ns **/
export async function main(ns) {
  while(true) {
    const target = ns.args[0] || window.ns.primeTarget || 'joesguns'
    await ns.grow(target)
  }
}
