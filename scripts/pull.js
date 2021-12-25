/** @param {NS} ns **/
export async function main(ns) {
  const filenames = [
    'basic_hack',
    'script_updater',
    'bootstrap',
    'bootstrap_all_purchased',
    'purchase_8gb_server',
    'server_upgrader',
    'hacknet_purchaser',
    'scanner',
    'pull',
    'hack',
    'weaken',
    'grow',
    'lib',
    'connect',
    'main',
    'init'
  ]

  const branch = 'master'
  for (let i in filenames) {
    const filename = filenames[i]
    const url = `https://raw.githubusercontent.com/Custodia/bitburner/${branch}/scripts/${filename}.js`
    const result = await ns.wget(url, `${filename}.js`)
    if (result) {
      ns.tprint(`Succesfully downloaded ${filename}.js`)
    } else {
      ns.tprint(`Failed to download ${filename}.js`)
    }
  }
}
