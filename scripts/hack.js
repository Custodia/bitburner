/** @param {NS} ns **/
export async function main(ns) {
  while(true) {
    const target = ns.args[0] || primeTarget || 'joesguns'
		await ns.hack(target)
  }
}
