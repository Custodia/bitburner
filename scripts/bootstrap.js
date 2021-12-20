/** @param {NS} ns **/
export async function main(ns) {
  const currentHost = ns.getHostname()
  if (currentHost === 'home')
    return

  // Copy script from home
  await ns.scp('basic_hack.js', 'home', currentHost);

  // Kill any existing tasks
  const processes = ns.ps(currentHost);
  const uniqScripts = processes
        .map(process => process.filename)
        .filter(filename => filename !== 'bootstrap.js')
        .filter((item, i, arr) => arr.indexOf(item) === i)
  uniqScripts.forEach(fileName => ns.scriptKill(fileName, currentHost))

  const scriptRam = ns.getScriptRam('basic_hack.js');
  const maxRam = ns.getServerMaxRam(currentHost);
  const threads = Math.floor(maxRam / scriptRam);

  if (threads < 1) {
    ns.alert(`Not enough ram on #{currentHost} to bootstrap!!`);
    return
  }

  // Stop current script and start hacking script
  ns.spawn('basic_hack.js', threads, 'joesguns');
}
