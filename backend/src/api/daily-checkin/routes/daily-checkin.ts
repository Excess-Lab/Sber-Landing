export default {
  routes: [
    {
      method: 'POST',
      path: '/daily-checkins/checkin',
      handler: 'daily-checkin.checkin',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/daily-checkins/pending',
      handler: 'daily-checkin.pending',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/daily-checkins/:id/approve',
      handler: 'daily-checkin.approve',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/daily-checkins/:id/reject',
      handler: 'daily-checkin.reject',
      config: {
        auth: false,
      },
    },
  ],
};

