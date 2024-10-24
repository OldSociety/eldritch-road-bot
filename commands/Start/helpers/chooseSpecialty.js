const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require('discord.js')
  const { User, Investigator } = require('../../../Models/model') // Assuming Investigator is defined here
  
  // Function to handle specialty selection
  async function chooseSpecialty(interaction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true })
    }
  
    // Embed to prompt the user to choose a specialty
    const specialtyEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Choose Your Specialty')
      .setDescription(
        'Now it’s time to choose your path. Each specialty has its own benefits: \n\n' +
          '**Relic Hunter**: Gain wealth faster \n' +
          '**Cult Breaker**: Increase your prowess faster \n' +
          '**Mythos Investigator**: Gain experience quicker \n\n' +
          'Once you choose a specialty, you can change it later, but it will cost you.'
      )
  
    const specialtyRow = new ActionRowBuilder().addComponents(
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
  
    // Send the specialty selection prompt
    await interaction.followUp({
      embeds: [specialtyEmbed],
      components: [specialtyRow],
      ephemeral: true,
    })
  
    // Filter to handle the player's specialty selection
    const filter = (i) =>
      ['relic', 'cult', 'mythos'].includes(i.customId) &&
      i.user.id === interaction.user.id
  
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    })
  
    collector.on('collect', async (i) => {
      try {
        // Defer the interaction update to prevent interaction expiration
        if (!i.deferred && !i.replied) {
          await i.deferUpdate()
        }
  
        let selectedSpecialty = ''
        let startingWealth = 0
  
        // Determine selected specialty and assign starting wealth
        if (i.customId === 'relic') {
          selectedSpecialty = 'relic'
          startingWealth = 1000 // Example wealth for relic hunters
        } else if (i.customId === 'cult') {
          selectedSpecialty = 'cult'
          startingWealth = 800 // Example wealth for cult breakers
        } else if (i.customId === 'mythos') {
          selectedSpecialty = 'mythos'
          startingWealth = 1200 // Example wealth for mythos investigators
        }
  
        // Fetch the user and update their specialty and wealth
        let user = await User.findOne({ where: { user_id: interaction.user.id } })
  
        if (user) {
          // Update the user with the selected specialty and starting wealth
          await user.update({
            specialty: selectedSpecialty,
            wealth: startingWealth,
          })
  
          // Check if the user has zero investigators
          const investigatorCount = await Investigator.count({
            where: { userId: interaction.user.id },
          })
  
          if (investigatorCount === 0) {
            // Randomly assign a specialty to Hattie Warne
            const specialties = ['relic', 'cult', 'mythos']
            const randomSpecialty =
              specialties[Math.floor(Math.random() * specialties.length)]
  
            // Create the first investigator: Hattie Warne
            await Investigator.create({
              name: 'Hattie Warne',
              prowess: 0,
              knowledge: 0,
              specialty: randomSpecialty,
              experience: 0,
              level: 1,
              resolve: 100,
              sanity: 100,
              userId: interaction.user.id,
            })
  
            console.log(
              `Investigator Hattie Warne created with specialty: ${randomSpecialty}`
            )
          }
  
          // Create a confirmation embed to show updated specialty and wealth
          const confirmationEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('Specialty Selected')
            .setDescription(
              `You selected **${
                selectedSpecialty.charAt(0).toUpperCase() +
                selectedSpecialty.slice(1)
              }** and have been assigned a starting wealth of ${startingWealth}.`
            )
            .addFields({
              name: 'New Investigator',
              value:
                'Your first investigator, **Hattie Warne**, has been assigned a random specialty.',
            })
  
          // Send the confirmation message
          await i.update({
            embeds: [confirmationEmbed],
            components: [],
            ephemeral: true,
          })
        }
      } catch (error) {
        console.error('Error during specialty selection:', error)
        if (error.code === 10062) {
          console.error('Interaction expired before it could be updated.')
        } else {
          await i.followUp({
            content:
              'An error occurred while processing your specialty selection. Please try again.',
            ephemeral: true,
          })
        }
      }
    })
  
    collector.on('end', async (collected) => {
      if (!collected.size) {
        try {
          await interaction.followUp({
            content:
              'You didn’t select a specialty in time. Please run the command again to continue.',
            ephemeral: true,
          })
        } catch (error) {
          if (error.code === 10062) {
            console.error('Interaction expired before follow-up.')
          }
        }
      }
    })
  }
  
  module.exports = { chooseSpecialty }
  