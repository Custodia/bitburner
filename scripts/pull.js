/** @param {NS} ns **/
export async function main(ns) {
  const filenames = [
    'basic_hack',
    'penetrator',
    'script_updater',
    'bootstrap',
    'purchase_8gb_server',
    'server_upgrader',
    'hacknet_purchaser',
    'scanner',
    'pull'
  ]

  const branch = 'master'
  for (let i in filenames) {
    const filename = filenames[i]
    const url = `https://raw.githubusercontent.com/Custodia/bitburner/${branch}/scripts/${filename}.js`
    await ns.wget(url, `${filename}.ns`)
  }
}
