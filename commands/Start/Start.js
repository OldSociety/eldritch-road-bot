// Start.js
const { SlashCommandBuilder } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Participate in the spooky event!'),
    async execute(interaction) {
        try {
          console.log('this is a test.')
        } catch (error) {
          console.error('❌ Error:', error)
        }
      },
}
