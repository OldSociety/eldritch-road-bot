const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Read all filenames in the assets folder to create validCreatures set
const assetsPath = path.join(__dirname, '..', '..', 'assets');
const creatureFiles = fs.readdirSync(assetsPath);
const validCreatures = new Set(creatureFiles.map(filename => path.parse(filename).name)); // Strip file extensions


const monsterCacheByTier = { // Cache monsters by tier
  'Tier 1': [],
  'Tier 2': [],
  'Tier 3': [],
  'Tier 4': [],
  'Tier 5': []
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pulls a random monster card with tier-based rarity'),

  async execute(interaction) {
    await interaction.deferReply();

    const fetch = (await import('node-fetch')).default;

    const tiers = [
      { name: 'Common', crRange: [0.125, 4], color: 0x808080, chance: 0.5 }, // 50% Grey
      { name: 'Uncommon', crRange: [5, 10], color: 0x00ff00, chance: 0.3 },   // 30% Green
      { name: 'Rare', crRange: [11, 15], color: 0x0000ff, chance: 0.17 }, // 17% Blue
      { name: 'Very Rare', crRange: [16, 19], color: 0x800080, chance: 0.05 }, // 5% Purple
      { name: 'Legendary', crRange: [20, Infinity], color: 0xffd700, chance: 0.02 } // 2% Gold
    ];

    async function cacheMonstersByTier() {
      if (Object.values(monsterCacheByTier).every(tierList => tierList.length > 0)) {
        console.log('Using cached monsters by tier.');
        return;
      }

      console.log('Fetching monster list from API and categorizing by tier...');
      const response = await fetch('https://www.dnd5eapi.co/api/monsters');
      const data = await response.json();

      for (const monster of data.results) {
        try {
          // Check if the monster is in the valid creatures list before proceeding
          if (!validCreatures.has(monster.index)) {
            continue;
          }

          const detailResponse = await fetch(`https://www.dnd5eapi.co/api/monsters/${monster.index}`);
          const monsterDetails = await detailResponse.json();

          let cr = monsterDetails.challenge_rating;
          if (typeof cr === 'string' && cr.includes('/')) {
            const [numerator, denominator] = cr.split('/').map(Number);
            cr = numerator / denominator;
          }

          const imageUrl = `https://raw.githubusercontent.com/theoperatore/dnd-monster-api/master/src/db/assets/${monster.index}.jpg`;

          const matchingTier = tiers.find(tier => cr >= tier.crRange[0] && cr <= tier.crRange[1]);
          if (matchingTier) {
            monsterCacheByTier[matchingTier.name].push({
              name: monsterDetails.name,
              cr,
              imageUrl,
              color: matchingTier.color
            });
          }
        } catch (error) {
          console.log(`Error processing monster ${monster.name}:`, error);
        }
      }
      console.log('Monsters categorized by tier and cached.');
    }

    function selectTier() {
      const roll = Math.random();
      let cumulative = 0;

      for (const tier of tiers) {
        cumulative += tier.chance;
        if (roll < cumulative) {
          console.log(`Selected Tier: ${tier.name} with CR range ${tier.crRange[0]} - ${tier.crRange[1]}`);
          return tier;
        }
      }
      console.log(`Defaulted to Tier 1`);
      return tiers[0];
    }

    async function pullMonster(tier) {
      const eligibleMonsters = monsterCacheByTier[tier.name];
      let monster;
      let attempts = 0;

      do {
        monster = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
        attempts++;
        if (!monster || !monster.imageUrl.includes('githubusercontent.com')) {
          console.log('Selected monster without a valid image, retrying...');
        }
      } while ((!monster || !monster.imageUrl.includes('githubusercontent.com')) && attempts < 10);

      if (attempts >= 10) console.log('Max reroll attempts reached.');

      return monster;
    }

    await cacheMonstersByTier();
    const selectedTier = selectTier();
    const monster = await pullMonster(selectedTier);

    if (monster) {
      const embed = new EmbedBuilder()
        .setColor(monster.color)
        .setTitle(monster.name)
        .setDescription(`**Challenge Rating:** ${monster.cr}`)
        .setThumbnail(monster.imageUrl)
        .setFooter({ text: `${selectedTier.name}` });

      await interaction.editReply({ embeds: [embed] });
      // console.log(`Displayed monster: ${monster.name} | Tier: ${selectedTier.name}`);
    } else {
      await interaction.editReply('No monster found for this tier. Please try again.');
      console.log('No monster found for the selected tier.');
    }
  },
};
