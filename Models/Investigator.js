const { DataTypes } = require('sequelize')
const sequelize = require('../config/database') // assuming you have a configured Sequelize instance

const Investigator = sequelize.define(
  'Investigator',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure the investigator has a name
    },
    prowess: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Default prowess starts at 0
    },
    knowledge: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Default knowledge starts at 0
    },
    specialty: {
      type: DataTypes.ENUM('Relic', 'Cult', 'Lore'), // Investigators specialize in one of these three categories
      allowNull: false,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Experience points for leveling up
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Default level starts at 1
    },
    resolve: {
      type: DataTypes.INTEGER,
      defaultValue: 100, // Default resolve starts at 100
    },
    sanity: {
      type: DataTypes.INTEGER,
      defaultValue: 100, // Default sanity starts at 100
    },
    userId: {
      type: DataTypes.STRING, // To associate the investigator with a user (e.g., Discord user ID)
      allowNull: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
)

module.exports = Investigator
