export default {
  routes: [
    {
      method: 'GET',
      path: '/admin/dashboard',
      handler: 'admin-dashboard.dashboard',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/users',
      handler: 'admin-dashboard.createUser',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/admin/users/:id',
      handler: 'admin-dashboard.updateUser',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/users/:id/reset-temporary-password',
      handler: 'admin-dashboard.resetTemporaryPassword',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/teams',
      handler: 'admin-dashboard.createTeam',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/admin/teams/:id',
      handler: 'admin-dashboard.updateTeam',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/team-users',
      handler: 'admin-dashboard.assignTeamUser',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/admin/team-users/:id',
      handler: 'admin-dashboard.deleteTeamUser',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/challenges',
      handler: 'admin-dashboard.createChallenge',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/admin/challenges/:id',
      handler: 'admin-dashboard.updateChallenge',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/challenges/generate',
      handler: 'admin-dashboard.generateChallenge',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/achievements',
      handler: 'admin-dashboard.createAchievement',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/admin/achievements/generate',
      handler: 'admin-dashboard.generateAchievement',
      config: { auth: false },
    },
  ],
};
