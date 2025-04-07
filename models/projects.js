const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    feature_img_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    summary_short: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    intro_short: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    impact: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    original_source_url: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: false  // Disable automatic timestamps
});


const Sector = sequelize.define('Sector', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    sector_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false  // Disable automatic timestamps
});

Project.belongsTo(Sector, { foreignKey: 'sector_id' });
Sector.hasMany(Project, { foreignKey: 'sector_id' });

module.exports = { Project, Sector, sequelize };
