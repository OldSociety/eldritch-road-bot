// Start.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Participate in the spooky event!'),

  async execute(interaction) {
    try {
      // Create an embed for the starting prompt
      const startEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Welcome to the Paranormal Investigation Firm')
        .setDescription(
          'Today is your first day as the leader of a paranormal investigation firm. Choose a specialty to begin your journey.'
        )
        .addFields({
          name: 'Choose your specialty:',
          value: 'Relic Hunter, Cult Breaker, Mythos Investigator',
        })

      // Create buttons for the three options
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('relic_hunter')
          .setLabel('Relic Hunter')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('cult_breaker')
          .setLabel('Cult Breaker')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('mythos_investigator')
          .setLabel('Mythos Investigator')
          .setStyle(ButtonStyle.Secondary)
      )

      // Send the embed and buttons
      await interaction.reply({ embeds: [startEmbed], components: [row] })
    } catch (error) {
      console.error('❌ Error:', error)
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true,
      })
    }
  },
}
