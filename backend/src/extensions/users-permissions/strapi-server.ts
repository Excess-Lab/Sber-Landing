export default (plugin: any) => {
  const userAttributes = plugin.contentTypes.user.schema.attributes;

  userAttributes.globalRole = {
    type: 'enumeration',
    enum: ['admin', 'project_manager', 'worker'],
    default: 'worker',
    required: true,
  };

  userAttributes.avatar = {
    type: 'media',
    multiple: false,
    allowedTypes: ['images'],
  };

  userAttributes.statusEmoji = {
    type: 'string',
    default: '😁',
    maxLength: 12,
  };

  userAttributes.statusText = {
    type: 'string',
    default: 'Кайфую',
    maxLength: 48,
  };

  userAttributes.xp = {
    type: 'integer',
    default: 0,
    min: 0,
  };

  userAttributes.lvl = {
    type: 'integer',
    default: 1,
    min: 1,
  };

  userAttributes.mustChangePassword = {
    type: 'boolean',
    default: false,
    required: true,
  };

  userAttributes.temporaryPasswordIssuedAt = {
    type: 'datetime',
  };

  return plugin;
};
