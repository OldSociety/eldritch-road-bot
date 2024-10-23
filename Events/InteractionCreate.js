const { Events, EmbedBuilder } = require('discord.js')
const { User } = require('../Models/model')

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        )
        return
      }

      try {
        await command.execute(interaction)
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`)
        console.error(error)
      }
    }
    // Handle Button Interactions
    else if (interaction.isButton()) {
      const customId = interaction.customId

      if (
        customId === 'relic' ||
        customId === 'cult' ||
        customId === 'mythos'
      ) {
        const selectedSpecialty = customId

        try {
          // Fetch user by their Discord user_id (interaction.user.id)
          let user = await User.findOne({
            where: { user_id: interaction.user.id },
          })

          if (user) {
            await user.update({ specialty: selectedSpecialty })

            console.log(
              `Updated user ${interaction.user.username}'s specialty to: ${selectedSpecialty}`
            )
          } else {
            console.error(`User not found: ${interaction.user.username}`)
          }
        } catch (error) {
          console.error('Error updating user specialty:', error)
        }

        // Create a confirmation embed
        const confirmEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Specialty Selected')
          .setDescription(
            `You selected **${
              selectedSpecialty.charAt(0).toUpperCase() +
              selectedSpecialty.slice(1)
            }**. Let the hunt begin!`
          )

        await interaction.update({ embeds: [confirmEmbed], components: [] })

        console.log(`User selected: ${selectedSpecialty}`)
      }
    }
  },
}
