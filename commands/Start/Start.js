const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js')
const { User } = require('../../Models/model')
const {chooseSpecialty} = require('./helpers/chooseSpecialty')

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

      // If user doesn't exist, create a new entry
      if (!userData) {
        console.log(`User not found: ${userName}, creating new user...`)
        userData = await User.create({
          user_id: userId,
          user_name: userName,
          wealth: 0,
          org_size: 1,
          library_size: 0,
          specialty: null, // Will be set after they choose a specialty
        })
      }

      // If user already has a specialty, show their stats
      if (userData.specialty) {
        const userStatsEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`Welcome back, ${userData.user_name}!`)
          .setDescription('Here are your current stats:')
          .addFields(
            { name: 'Specialty', value: userData.specialty },
            { name: 'Wealth', value: userData.wealth.toString() },
            { name: 'Organization Size', value: userData.org_size.toString() },
            { name: 'Library Size', value: userData.library_size.toString() }
          )

        return interaction.reply({ embeds: [userStatsEmbed], ephemeral: true })
      }

      // New player setup: Ask if they want instructions
      const instructionsEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Welcome to the Paranormal Investigation Firm')
        .setDescription(
          'You’re about to start your journey into the unknown. Want a quick rundown on how things work so far?'
        )
        .addFields({
          name: 'Do you need instructions?',
          value:
            'Select "Yes" if you want a quick overview of what’s implemented right now.',
        })

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('yes_instructions')
          .setLabel('Yes')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('no_instructions')
          .setLabel('No')
          .setStyle(ButtonStyle.Secondary)
      )

      // Send the initial instructions embed with buttons
      await interaction.reply({
        embeds: [instructionsEmbed],
        components: [row],
        ephemeral: true,
      })

      // Wait for user's response for instructions (Collector)
      const filter = (i) => i.user.id === interaction.user.id
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 15000,
      })

      collector.on('collect', async (i) => {
        if (i.customId === 'yes_instructions') {
          // Defer the interaction first and send detailed instructions
          await i.deferUpdate()

          const instructionsDetailEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('Game Instructions')
            .setDescription('Here’s what you need to know so far:')
            .addFields(
              {
                name: 'Occult Knowledge',
                value:
                  'You can read books to increase your knowledge in different paranormal fields. More knowledge unlocks new abilities.',
              },
              {
                name: 'Investigators',
                value:
                  'Hire investigators to help you retrieve relics, study cults, or dive deep into the mythos. They will assist you, but they start slow and need training.',
              },
              {
                name: 'Specialties',
                value:
                  'Each player has a specialty that impacts how they progress. Relic Hunters gain wealth faster, Cult Breakers have increased prowess, and Mythos Investigators gain experience quicker. You can change your specialty later, but it will cost you.',
              }
            )
            .setFooter({
              text: 'That’s what we’ve got for now! Let’s move on to choosing your specialty.',
            })

          const continueRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('continue_choose_specialty')
              .setLabel('Continue')
              .setStyle(ButtonStyle.Primary)
          )

          await i.editReply({
            embeds: [instructionsDetailEmbed],
            components: [continueRow],
          })

          // Set up the collector for "Continue" button
          const continueCollector =
            interaction.channel.createMessageComponentCollector({
              filter: (i) =>
                i.user.id === interaction.user.id &&
                i.customId === 'continue_choose_specialty',
              time: 15000,
            })

          continueCollector.on('collect', async (i) => {
            await chooseSpecialty(i) // Proceed to specialty selection
          })
        } else if (i.customId === 'no_instructions') {
          // Proceed without instructions
          await i.deferUpdate()
          await chooseSpecialty(i)
        }
      })

      collector.on('end', (collected) => {
        if (!collected.size) {
          interaction.followUp({
            content: 'You didn’t select an option in time. Let’s move forward!',
            ephemeral: true,
          })

          chooseSpecialty(interaction)
        }
      })
    } catch (error) {
      console.error('❌ Error:', error)
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true,
      })
    }
  },
}
