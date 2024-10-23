const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js')
const { User } = require('../../Models/model') // Ensure you're destructuring User

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Let the hunt begin!'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id
      const userName = interaction.user.username

      // Check if the user already has an account
      let userData = await User.findOne({ where: { user_id: userId } })

      if (userData) {
        // If user already has an account, show their stats
        const userStatsEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`Welcome back, ${userData.user_name}!`)
          .setDescription('Here are your current stats:')
          .addFields(
            { name: 'Specialty', value: userData.specialty || 'None' },
            { name: 'Wealth', value: userData.wealth.toString() },
            { name: 'Organization Size', value: userData.orgSize.toString() },
            { name: 'Library Size', value: userData.library_size.toString() }
          )

        return interaction.reply({ embeds: [userStatsEmbed] })
      }

      // If no account exists, create a new user
      userData = await User.create({
        user_id: userId,
        user_name: userName,
      })

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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('relic')
          .setLabel('Relic Hunter')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('cult')
          .setLabel('Cult Breaker')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('mythos')
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
