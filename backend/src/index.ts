import type { Core } from '@strapi/strapi';
import { recomputeUserAchievements } from './services/gamification';

const USER_UID = 'plugin::users-permissions.user';

const normalizeXp = (value: unknown) => {
  const xp = Number(value);

  return Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
};

const calculateLevel = (value: unknown) => Math.floor(normalizeXp(value) / 50) + 1;

const formatMoscowDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const toMonthKey = (day: string) => String(day || '').slice(0, 7);

const SBER_PHOTO_BASE = '/assets/sber-landing-photo';
const SPLINE_URLS = {
  untitled: 'https://my.spline.design/untitled-a699554b53e21001220fbc3a49b07646/',
  retroGlass: 'https://my.spline.design/retroglassmaterial-MwiXOWY2ReQlEWpU4E2VEB97/',
};

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const findOne = (strapi: Core.Strapi, uid: string, where: Record<string, unknown>, populate?: any) =>
  strapi.db.query(uid as any).findOne({
    where,
    ...(populate ? { populate } : {}),
  });

const updateOrCreate = async (
  strapi: Core.Strapi,
  uid: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
) => {
  const existing = await findOne(strapi, uid, where);

  if (existing) {
    return strapi.db.query(uid as any).update({
      where: { id: existing.id },
      data,
    });
  }

  return strapi.db.query(uid as any).create({ data });
};

const ensureSeedUser = async (
  strapi: Core.Strapi,
  data: {
    username: string;
    email: string;
    globalRole: 'project_manager' | 'worker';
    xp: number;
    statusText: string;
  },
) => {
  const existing = await findOne(strapi, USER_UID, { email: data.email });

  if (existing) {
    return strapi.db.query(USER_UID).update({
      where: { id: existing.id },
      data: {
        username: data.username,
        globalRole: data.globalRole,
        xp: data.xp,
        lvl: calculateLevel(data.xp),
        statusEmoji: '😁',
        statusText: data.statusText,
        confirmed: true,
        blocked: false,
      },
    });
  }

  const authenticatedRole = await findOne(strapi, 'plugin::users-permissions.role', {
    type: 'authenticated',
  });

  return strapi.plugin('users-permissions').service('user').add({
    username: data.username,
    email: data.email,
    password: 'Password123!',
    provider: 'local',
    confirmed: true,
    blocked: false,
    role: authenticatedRole?.id,
    globalRole: data.globalRole,
    xp: data.xp,
    lvl: calculateLevel(data.xp),
    statusEmoji: '😁',
    statusText: data.statusText,
  });
};

const ensureTeamUser = async (
  strapi: Core.Strapi,
  userId: number,
  teamId: number,
  teamRoleId: number,
) => {
  const existing = await strapi.db.query('api::team-user.team-user').findOne({
    where: {
      user: { id: userId },
      team: { id: teamId },
    },
  });

  if (existing) {
    return strapi.db.query('api::team-user.team-user').update({
      where: { id: existing.id },
      data: {
        teamRole: teamRoleId,
      },
    });
  }

  return strapi.db.query('api::team-user.team-user').create({
    data: {
      user: userId,
      team: teamId,
      teamRole: teamRoleId,
    },
  });
};

const ensureUserChallenge = async (strapi: Core.Strapi, userId: number, challengeId: number) => {
  const existing = await strapi.db.query('api::user-challenge.user-challenge').findOne({
    where: {
      user: { id: userId },
      challenge: { id: challengeId },
    },
  });

  if (existing) {
    return existing;
  }

  return strapi.db.query('api::user-challenge.user-challenge').create({
    data: {
      user: userId,
      challenge: challengeId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    },
  });
};

const seedEmployeeDashboard = async (strapi: Core.Strapi) => {
  const currentUser = await findOne(strapi, USER_UID, {
    email: 'kabanov.makap@yandex.ru',
  });

  if (!currentUser) {
    strapi.log.warn('[seed] User kabanov.makap@yandex.ru not found, employee dashboard seed skipped');
    return;
  }

  const team = await updateOrCreate(
    strapi,
    'api::team.team',
    { name: 'НеВарлики' },
    { name: 'НеВарлики', color: '#b559f3' },
  );
  const managerRole = await updateOrCreate(
    strapi,
    'api::team-role.team-role',
    { name: 'Проектный менеджер', team: { id: team.id } },
    { name: 'Проектный менеджер', team: team.id },
  );
  const memberRole = await updateOrCreate(
    strapi,
    'api::team-role.team-role',
    { name: 'Участник', team: { id: team.id } },
    { name: 'Участник', team: team.id },
  );

  const timur = await ensureSeedUser(strapi, {
    username: 'Тимур',
    email: 'timur.nevarliki@example.local',
    globalRole: 'project_manager',
    xp: 180,
    statusText: 'Веду команду',
  });
  const boris = await ensureSeedUser(strapi, {
    username: 'Борис',
    email: 'boris.nevarliki@example.local',
    globalRole: 'worker',
    xp: 105,
    statusText: 'Делаю красиво',
  });
  const benten = await ensureSeedUser(strapi, {
    username: 'БенТен',
    email: 'benten.nevarliki@example.local',
    globalRole: 'worker',
    xp: 75,
    statusText: 'На связи',
  });

  await ensureTeamUser(strapi, currentUser.id, team.id, memberRole.id);
  await ensureTeamUser(strapi, timur.id, team.id, managerRole.id);
  await ensureTeamUser(strapi, boris.id, team.id, memberRole.id);
  await ensureTeamUser(strapi, benten.id, team.id, memberRole.id);

  const designTeam = await updateOrCreate(
    strapi,
    'api::team.team',
    { name: 'Sber Design Lab' },
    { name: 'Sber Design Lab', color: '#69d8ff' },
  );
  await updateOrCreate(
    strapi,
    'api::team-role.team-role',
    { name: 'Проектный менеджер', team: { id: designTeam.id } },
    { name: 'Проектный менеджер', team: designTeam.id },
  );
  const designMemberRole = await updateOrCreate(
    strapi,
    'api::team-role.team-role',
    { name: 'Участник', team: { id: designTeam.id } },
    { name: 'Участник', team: designTeam.id },
  );
  await ensureTeamUser(strapi, currentUser.id, designTeam.id, designMemberRole.id);

  const seededChallenges = await Promise.all([
    updateOrCreate(strapi, 'api::challenge.challenge', { title: 'Онбординг в геймификацию' }, {
      title: 'Онбординг в геймификацию',
      description: 'Разбери правила, выбери первый челлендж и отметь прогресс.',
      type: 'open',
      difficulty: 'Light',
      xpReward: 50,
      deadline: addDays(7),
      visibility: 'public',
    }),
    updateOrCreate(strapi, 'api::challenge.challenge', { title: 'Поддержи команду НеВарлики' }, {
      title: 'Поддержи команду НеВарлики',
      description: 'Помоги участнику команды закрыть небольшую рабочую задачу.',
      type: 'team',
      difficulty: 'Medium',
      xpReward: 100,
      deadline: addDays(4),
      visibility: 'public',
    }),
    updateOrCreate(strapi, 'api::challenge.challenge', { title: 'Подготовь демо для PM' }, {
      title: 'Подготовь демо для PM',
      description: 'Собери короткую демонстрацию результата и передай проектному менеджеру.',
      type: 'private',
      difficulty: 'Hard',
      xpReward: 150,
      deadline: addDays(2),
      visibility: 'private',
      mentionedUsers: [currentUser.id],
    }),
    updateOrCreate(strapi, 'api::challenge.challenge', { title: 'Разбор пользовательского пути' }, {
      title: 'Разбор пользовательского пути',
      description: 'Найди одно узкое место в сценарии и предложи улучшение.',
      type: 'private',
      difficulty: 'Medium',
      xpReward: 80,
      deadline: addDays(14),
      visibility: 'private',
      mentionedUsers: [currentUser.id],
    }),
  ]);

  await ensureUserChallenge(strapi, currentUser.id, seededChallenges[2].id);

  const shopCards = [
    {
      name: 'Брелок',
      description: 'Выбери один из двух 3D-брелков и обменяй XP на мерч.',
      price: 150,
      gallery: [`${SBER_PHOTO_BASE}/rectangle-27.png`, `${SBER_PHOTO_BASE}/image-7.png`],
      splineUrl: SPLINE_URLS.retroGlass,
      variants: [
        {
          key: 'type_1',
          title: 'Тип 1',
          splineUrl: SPLINE_URLS.retroGlass,
          gallery: [`${SBER_PHOTO_BASE}/rectangle-27.png`, `${SBER_PHOTO_BASE}/image-7.png`],
        },
        {
          key: 'type_2',
          title: 'Тип 2',
          splineUrl: SPLINE_URLS.untitled,
          gallery: [`${SBER_PHOTO_BASE}/image-8.png`, `${SBER_PHOTO_BASE}/image-9.png`],
        },
      ],
      stock: 12,
      status: 'available',
    },
    {
      name: 'Стикеры',
      description: 'Стикерпак для ноутбука, ежедневника и рабочего места.',
      price: 90,
      gallery: [`${SBER_PHOTO_BASE}/image-10.png`, `${SBER_PHOTO_BASE}/rectangle-27.png`],
      splineUrl: '',
      variants: [],
      stock: 30,
      status: 'available',
    },
  ];

  for (const card of shopCards) {
    await updateOrCreate(strapi, 'api::shop-card.shop-card', { name: card.name }, card);
  }

  for (const name of ['Retro Glass', 'Giga Boost', 'Sber Kit']) {
    const legacyCard = await findOne(strapi, 'api::shop-card.shop-card', { name });
    if (legacyCard) {
      await strapi.db.query('api::shop-card.shop-card').update({
        where: { id: legacyCard.id },
        data: { status: 'not_available', stock: 0 },
      });
    }
  }

  const milestoneRewards = [
    {
      code: 'milestone_light',
      title: 'Стикерпак',
      description: 'Награда за закрытие Light-челленджей.',
      requiredDifficulties: ['Light'],
      scope: 'monthly',
      sort: 0,
    },
    {
      code: 'milestone_light_medium',
      title: 'Брелок',
      description: 'Награда за закрытие Light и Medium челленджей.',
      requiredDifficulties: ['Light', 'Medium'],
      scope: 'monthly',
      sort: 1,
    },
    {
      code: 'milestone_light_medium_hard',
      title: 'Встреча с экспертом',
      description: 'Награда за закрытие Light, Medium и Hard челленджей.',
      requiredDifficulties: ['Light', 'Medium', 'Hard'],
      scope: 'monthly',
      sort: 2,
    },
  ];

  for (const reward of milestoneRewards) {
    await updateOrCreate(strapi, 'api::milestone-reward.milestone-reward', { code: reward.code }, reward);
  }

  const achievements = [
    {
      code: 'daily_first',
      title: 'Первый Wordy',
      description: 'Пройти Wordy 1 раз за месяц.',
      scope: 'monthly',
      sort: 0,
      rule: { type: 'daily_approved_count', count: 1 },
    },
    {
      code: 'daily_streak_5',
      title: 'Wordy серия 5',
      description: 'Пройти Wordy 5 дней подряд.',
      scope: 'monthly',
      sort: 1,
      rule: { type: 'daily_streak', days: 5 },
    },
    {
      code: 'light_done',
      title: 'Light закрыт',
      description: 'Закрыть 1 Light-челлендж за месяц.',
      scope: 'monthly',
      sort: 10,
      rule: { type: 'challenge_difficulty_approved_count', difficulty: 'Light', count: 1 },
    },
    {
      code: 'medium_done',
      title: 'Medium закрыт',
      description: 'Закрыть 1 Medium-челлендж за месяц.',
      scope: 'monthly',
      sort: 11,
      rule: { type: 'challenge_difficulty_approved_count', difficulty: 'Medium', count: 1 },
    },
    {
      code: 'hard_done',
      title: 'Hard закрыт',
      description: 'Закрыть 1 Hard-челлендж за месяц.',
      scope: 'monthly',
      sort: 12,
      rule: { type: 'challenge_difficulty_approved_count', difficulty: 'Hard', count: 1 },
    },
  ];

  for (const achievement of achievements) {
    await updateOrCreate(strapi, 'api::achievement.achievement', { code: achievement.code }, achievement);
  }

  const today = formatMoscowDay(new Date());
  await updateOrCreate(
    strapi,
    'api::daily-checkin.daily-checkin',
    { dayKey: `${boris.id}:${today}` },
    {
      user: boris.id,
      day: today,
      dayKey: `${boris.id}:${today}`,
      status: 'pending',
      points: 10,
      pointsApplied: false,
    },
  );
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    strapi.db.lifecycles.subscribe({
      models: [USER_UID],
      beforeCreate(event) {
        event.params.data = event.params.data || {};
        const data = event.params.data;
        const xp = normalizeXp(data.xp);

        data.xp = xp;
        data.lvl = calculateLevel(xp);
      },
      async beforeUpdate(event) {
        event.params.data = event.params.data || {};
        const data = event.params.data;
        const hasXp = Object.prototype.hasOwnProperty.call(data, 'xp');
        const hasLevel = Object.prototype.hasOwnProperty.call(data, 'lvl');

        if (!hasXp && !hasLevel) {
          return;
        }

        if (hasXp) {
          const xp = normalizeXp(data.xp);

          data.xp = xp;
          data.lvl = calculateLevel(xp);
          return;
        }

        const currentUser = await strapi.db.query(USER_UID).findOne({
          where: event.params.where,
          select: ['xp'],
        });

        data.lvl = calculateLevel(currentUser?.xp);
      },
    });

    const applyUserChallengeRewards = async (userChallengeId: number) => {
      if (!Number.isFinite(userChallengeId) || userChallengeId <= 0) {
        return;
      }

      const entry = await strapi.db.query('api::user-challenge.user-challenge').findOne({
        where: { id: userChallengeId },
        populate: { challenge: true, user: true },
      });

      if (!entry?.id || !entry.user?.id) {
        return;
      }

      if (entry.status !== 'approved') {
        return;
      }

      if (entry.xpApplied) {
        return;
      }

      const nowIso = new Date().toISOString();
      const completedAt = entry.completedAt || nowIso;
      const rewardXp = normalizeXp(entry.challenge?.xpReward ?? entry.challenge?.xp_reward ?? entry.challenge?.xp ?? 0);

      const currentUser = await strapi.db.query(USER_UID).findOne({
        where: { id: entry.user.id },
        select: ['xp'],
      });
      const nextXp = normalizeXp(currentUser?.xp) + rewardXp;

      await strapi.db.query(USER_UID).update({
        where: { id: entry.user.id },
        data: {
          xp: nextXp,
          lvl: calculateLevel(nextXp),
        },
      });

      await strapi.db.query('api::user-challenge.user-challenge').update({
        where: { id: entry.id },
        data: {
          completedAt,
          xpApplied: true,
        },
      });

      await recomputeUserAchievements(entry.user.id, toMonthKey(formatMoscowDay(new Date(completedAt))));
    };

    const applyDailyCheckinRewards = async (dailyCheckinId: number) => {
      if (!Number.isFinite(dailyCheckinId) || dailyCheckinId <= 0) {
        return;
      }

      const entry = await strapi.db.query('api::daily-checkin.daily-checkin').findOne({
        where: { id: dailyCheckinId },
        populate: { user: true },
      });

      if (!entry?.id || !entry.user?.id) {
        return;
      }

      if (entry.status !== 'approved') {
        return;
      }

      if (entry.pointsApplied) {
        return;
      }

      const points = normalizeXp(entry.points);
      const currentUser = await strapi.db.query(USER_UID).findOne({
        where: { id: entry.user.id },
        select: ['xp'],
      });
      const nextXp = normalizeXp(currentUser?.xp) + points;

      await strapi.db.query(USER_UID).update({
        where: { id: entry.user.id },
        data: {
          xp: nextXp,
          lvl: calculateLevel(nextXp),
        },
      });

      await strapi.db.query('api::daily-checkin.daily-checkin').update({
        where: { id: entry.id },
        data: {
          pointsApplied: true,
          approvedAt: entry.approvedAt || new Date().toISOString(),
        },
      });

      await recomputeUserAchievements(entry.user.id, toMonthKey(String(entry.day)));
    };

    strapi.db.lifecycles.subscribe({
      models: ['api::user-challenge.user-challenge'],
      async afterCreate(event) {
        const { result } = event as any;
        await applyUserChallengeRewards(result?.id);
      },
      async afterUpdate(event) {
        const { result } = event as any;
        await applyUserChallengeRewards(result?.id);
      },
    });

    strapi.db.lifecycles.subscribe({
      models: ['api::daily-checkin.daily-checkin'],
      async afterCreate(event) {
        const { result } = event as any;
        await applyDailyCheckinRewards(result?.id);
      },
      async afterUpdate(event) {
        const { result } = event as any;
        await applyDailyCheckinRewards(result?.id);
      },
    });

    try {
      await seedEmployeeDashboard(strapi);
    } catch (error) {
      strapi.log.error('[seed] Failed to seed employee dashboard data', error);
    }
  },
};
