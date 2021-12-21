/** @param {NS} ns **/
export async function main(ns) {
  const iterations = ns.args[1] || Number.MAX_SAFE_INTEGER
  for (let i = 1; i < iterations; i++) {
    const target = ns.args[0] || primeTarget || 'joesguns'
		await ns.hack(target)
  }
}
