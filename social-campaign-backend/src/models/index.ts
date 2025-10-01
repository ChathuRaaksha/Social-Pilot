import { Sequelize, DataTypes } from 'sequelize';
import config from '../config';
import logger from '../utils/logger';

// Initialize Sequelize
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Define Models
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed'),
    defaultValue: 'draft',
  },
});

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Campaign,
      key: 'id',
    },
  },
  platform: {
    type: DataTypes.ENUM('linkedin', 'twitter', 'instagram'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mediaUrls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  hashtags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  scheduledAt: {
    type: DataTypes.DATE,
  },
  publishedAt: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed'),
    defaultValue: 'draft',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
});

const Approval = sequelize.define('Approval', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Campaign,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  comments: {
    type: DataTypes.TEXT,
  },
  approvedAt: {
    type: DataTypes.DATE,
  },
  rejectedAt: {
    type: DataTypes.DATE,
  },
});

const EngagementMetrics = sequelize.define('EngagementMetrics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Post,
      key: 'id',
    },
  },
  platform: {
    type: DataTypes.ENUM('linkedin', 'twitter', 'instagram'),
    allowNull: false,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  shares: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reach: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  engagementRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  fetchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define Associations
User.hasMany(Campaign, { foreignKey: 'userId' });
Campaign.belongsTo(User, { foreignKey: 'userId' });

Campaign.hasMany(Post, { foreignKey: 'campaignId' });
Post.belongsTo(Campaign, { foreignKey: 'campaignId' });

Campaign.hasMany(Approval, { foreignKey: 'campaignId' });
Approval.belongsTo(Campaign, { foreignKey: 'campaignId' });

User.hasMany(Approval, { foreignKey: 'userId' });
Approval.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(EngagementMetrics, { foreignKey: 'postId' });
EngagementMetrics.belongsTo(Post, { foreignKey: 'postId' });

// Database connection and sync
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync all models with database
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Campaign,
  Post,
  Approval,
  EngagementMetrics,
};
