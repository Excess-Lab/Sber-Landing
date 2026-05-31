export default {
  routes: [
    {
      method: 'GET',
      path: '/profile/me',
      handler: 'profile.me',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/profile/status',
      handler: 'profile.updateStatus',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/profile/avatar',
      handler: 'profile.updateAvatar',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/profile/password',
      handler: 'profile.updatePassword',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/profile/challenge-submission',
      handler: 'profile.submitChallenge',
      config: {
        auth: false,
      },
    },
  ],
};
