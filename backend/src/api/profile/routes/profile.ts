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
      path: '/profile/primary-team',
      handler: 'profile.updatePrimaryTeam',
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
      path: '/profile/shop-exchanges',
      handler: 'profile.createShopExchange',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/profile/wordly',
      handler: 'profile.currentWordy',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/profile/wordy',
      handler: 'profile.currentWordy',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/profile/wordly/attempt',
      handler: 'profile.completeWordy',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/profile/wordy/complete',
      handler: 'profile.completeWordy',
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
    {
      method: 'POST',
      path: '/profile/challenges/:id/accept',
      handler: 'profile.acceptChallenge',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/profile/review-queue',
      handler: 'profile.reviewQueue',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/profile/review-queue/:id/approve',
      handler: 'profile.approveReview',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/profile/review-queue/:id/reject',
      handler: 'profile.rejectReview',
      config: {
        auth: false,
      },
    },
  ],
};
