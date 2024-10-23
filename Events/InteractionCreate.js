const { Events, EmbedBuilder } = require('discord.js')

module.exports.run = async (client, message, args) => {
  const { cooldowns } = client

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection())
  }

  const now = Date.now()
  const timestamps = cooldowns.get(command.data.name)
  const defaultCooldownDuration = 3
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000)
      return interaction.reply({
        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
        ephemeral: true,
      })
    }
  }

  timestamps.set(interaction.user.id, now)
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)
}

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
        customId === 'relic_hunter' ||
        customId === 'cult_breaker' ||
        customId === 'mythos_investigator'
      ) {
        let selectedSpecialty = ''

        if (customId === 'relic_hunter') {
          selectedSpecialty = 'Relic Hunter'
        } else if (customId === 'cult_breaker') {
          selectedSpecialty = 'Cult Breaker'
        } else if (customId === 'mythos_investigator') {
          selectedSpecialty = 'Mythos Investigator'
        }

        // Create a confirmation embed
        const confirmEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Specialty Selected')
          .setDescription(
            `You selected **${selectedSpecialty}**. Let the hunt begin!`
          )

        // Update the interaction with the confirmation embed and remove buttons
        await interaction.update({ embeds: [confirmEmbed], components: [] })

        // Log the selection to the console
        console.log(`User selected: ${selectedSpecialty}`)
      }
    }
  },
}
