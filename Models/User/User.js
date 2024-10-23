module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('Users', {
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wealth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    org_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    lead_investigator: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    specialty: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    library_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  })

  // Association definition for Users
  User.associate = (models) => {
    User.hasMany(models.Investigator, {
      foreignKey: 'userId',
      as: 'investigators',
    })
  }

  return User
}
