const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { User } = require('../../Models/model');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Let the hunt begin!'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const userName = interaction.user.username;

      // Check if the user already has an account
      let userData = await User.findOne({ where: { user_id: userId } });

      // If user doesn't exist, create a new entry
      if (!userData) {
        console.log(`User not found: ${userName}, creating new user...`);
        userData = await User.create({
          user_id: userId,
          user_name: userName,
          wealth: 0,
          org_size: 1,
          library_size: 0,
          specialty: null, // Will be set after they choose a specialty
        });
      }

      if (userData.specialty) {
        // If user already has an account and a specialty, show their stats
        const userStatsEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`Welcome back, ${userData.user_name}!`)
          .setDescription('Here are your current stats:')
          .addFields(
            { name: 'Specialty', value: userData.specialty },
            { name: 'Wealth', value: userData.wealth.toString() },
            { name: 'Organization Size', value: userData.orgSize.toString() },
            { name: 'Library Size', value: userData.library_size.toString() }
          );

        return interaction.reply({ embeds: [userStatsEmbed], ephemeral: true });
      }

      // New player setup, ask if they want instructions
      const instructionsEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Welcome to the Paranormal Investigation Firm')
        .setDescription(
          'You’re about to start your journey into the unknown. Want a quick rundown on how things work so far?'
        )
        .addFields({
          name: 'Do you need instructions?',
          value: 'Select "Yes" if you want a quick overview of what’s implemented right now.',
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('yes_instructions')
          .setLabel('Yes')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('no_instructions')
          .setLabel('No')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [instructionsEmbed], components: [row], ephemeral: true });

      // Wait for user's response for instructions
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'yes_instructions') {
          // Defer the interaction first
          await i.deferUpdate();

          // Display instructions with specialties included
          const instructionsDetailEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('Game Instructions')
            .setDescription('Here’s what you need to know so far:')
            .addFields(
              {
                name: 'Occult Knowledge',
                value: 'You can read books to increase your knowledge in different paranormal fields. More knowledge unlocks new abilities.',
              },
              {
                name: 'Investigators',
                value: 'Hire investigators to help you retrieve relics, study cults, or dive deep into the mythos. They will assist you, but they start slow and need training.',
              },
              {
                name: 'Specialties',
                value: 'Each player has a specialty that impacts how they progress. Relic Hunters gain wealth faster, Cult Breakers have increased prowess, and Mythos Investigators gain experience quicker. You can change your specialty later, but it will cost you.',
              }
            )
            .setFooter({
              text: 'That’s what we’ve got for now! Let’s move on to choosing your specialty.',
            });

          // Add a Continue button to choose specialty
          const continueRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('continue_choose_specialty')
              .setLabel('Continue')
              .setStyle(ButtonStyle.Primary)
          );

          await i.editReply({
            embeds: [instructionsDetailEmbed],
            components: [continueRow], // Replace the previous buttons with the "Continue" button
          });

          // Collector for the "Continue" button
          const continueFilter = (i) => i.user.id === interaction.user.id && i.customId === 'continue_choose_specialty';
          const continueCollector = interaction.channel.createMessageComponentCollector({
            filter: continueFilter,
            time: 15000,
          });

          continueCollector.on('collect', async (i) => {
            await chooseSpecialty(i); // Proceed to specialty selection
          });

          continueCollector.on('end', (collected) => {
            if (!collected.size) {
              interaction.followUp({
                content: 'You didn’t select an option in time. Please run the command again to continue.',
                ephemeral: true,
              });
            }
          });

        } else if (i.customId === 'no_instructions') {
          // Defer interaction and proceed to choose specialty
          await i.deferUpdate();
          await chooseSpecialty(i); // Proceed to specialty selection directly
        }
      });

      collector.on('end', (collected) => {
        if (!collected.size) {
          interaction.followUp({
            content: 'You didn’t select an option in time. Let’s move forward!',
            ephemeral: true,
          });

          chooseSpecialty(interaction);
        }
      });
    } catch (error) {
      console.error('❌ Error:', error);
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true,
      });
    }
  },
};

// Function to handle specialty selection
async function chooseSpecialty(interaction) {
  // Ensure interaction is deferred or replied
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  const specialtyEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Choose Your Specialty')
    .setDescription(
      'Now it’s time to choose your path. Each specialty has its own benefits: \n\n' +
        '**Relic Hunter**: Gain wealth faster \n' +
        '**Cult Breaker**: Increase your prowess faster \n' +
        '**Mythos Investigator**: Gain experience quicker \n\n' +
        'Once you choose a specialty, you can change it later, but it will cost you.'
    );

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
  );

  // Only follow-up if interaction is still active
  if (!interaction.replied) {
    await interaction.followUp({
      embeds: [specialtyEmbed],
      components: [specialtyRow],
      ephemeral: true,
    });
  }

  // Wait for the player's specialty selection
  const filter = (i) =>
    ['relic', 'cult', 'mythos'].includes(i.customId) &&
    i.user.id === interaction.user.id;

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 15000,
  });

  collector.on('collect', async (i) => {
    let selectedSpecialty = '';

    if (i.customId === 'relic') {
      selectedSpecialty = 'relic';
    } else if (i.customId === 'cult') {
      selectedSpecialty = 'cult';
    } else if (i.customId === 'mythos') {
      selectedSpecialty = 'mythos';
    }

    let user = await User.findOne({ where: { user_id: interaction.user.id } });
    if (user) {
      await user.update({ specialty: selectedSpecialty });
    }

    const confirmationEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Specialty Selected')
      .setDescription(`You selected **${selectedSpecialty}**. Let the hunt begin!`);

  //   // Handle unknown interaction errors gracefully
  //   try {
  //     if (!i.deferred && !i.replied) {
  //       await i.update({
  //         embeds: [confirmationEmbed],
  //         components: [],
  //         ephemeral: true,
  //       });
  //     }
  //   } catch (error) {
  //     if (error.code === 10062) {
  //       console.error('Interaction expired before it could be updated.');
  //     } else {
  //       console.error('❌ Error updating interaction:', error);
  //     }
  //   }
  });

  collector.on('end', (collected) => {
    if (!collected.size) {
      // Only send follow-up if interaction is still valid
      try {
        if (!interaction.replied) {
          interaction.followUp({
            content: 'You didn’t select a specialty in time. Please run the command again to continue.',
            ephemeral: true,
          });
        }
      } catch (error) {
        if (error.code === 10062) {
          console.error('Interaction expired before it could be followed up.');
        } else {
          console.error('❌ Error sending follow-up:', error);
        }
      }
    }
  });
}

