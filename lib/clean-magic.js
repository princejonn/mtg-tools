const rxNotCard = [
  /(.+board\s{0,})/,
  /((Commander)(\s{0,})(\(\d+\)))/,
  /((Creature)(\s{0,})(\(\d+\)))/,
  /((Land)(\s{0,})(\(\d+\)))/,
  /((Instant)(\s{0,})(\(\d+\)))/,
  /((Planeswalker)(\s{0,})(\(\d+\)))/,
  /((Enchantment)(\s{0,})(\(\d+\)))/,
  /((Sorcery)(\s{0,})(\(\d+\)))/,
  /((Artifact)(\s{0,})(\(\d+\)))/,
];

const rxBasicLand = [
  /((.{0,})(Plains)(.{0,}))/,
  /((.{0,})(Swamp)(.{0,}))/,
  /((.{0,})(Mountain)(.{0,}))/,
  /((.{0,})(Island)(.{0,}))/,
  /((.{0,})(Forest)(.{0,}))/,
];

const rxClean = [
  /(\s+\/\/.+)/,
  /((.{0,})(\s+(Flip)))/,
  /((\d{1,})(x)(\s{0,}))/,
  /((.{0,})(New Cards)(\s{0,}))/,
  /((.{0,})(Signature Cards)(\s{0,}))/,
  /((.{0,})(Top Cards)(\s{0,}))/,
  /((.{0,})(Creatures)(\s{0,}))/,
  /((.{0,})(Instants)(\s{0,}))/,
  /((.{0,})(Sorceries)(\s{0,}))/,
  /((.{0,})(Artifacts)(\s{0,}))/,
  /((.{0,})(Enchantments)(\s{0,}))/,
  /((.{0,})(Planeswalkers)(\s{0,}))/,
  /((.{0,})(Lands)(\s{0,}))/,
];

/**
 * @param {string} input
 */
module.exports = input => {
  let output = input.toString();

  for (let regex of rxNotCard) {
    if (output.match(regex)) return;
  }

  for (let regex of rxBasicLand) {
    if (output.match(regex)) return;
  }

  for (let regex of rxClean) {
    if (!output.match(regex)) continue;
    output = output.replace(regex, "");
  }

  if (output.length < 2) return;
  return output;
};
