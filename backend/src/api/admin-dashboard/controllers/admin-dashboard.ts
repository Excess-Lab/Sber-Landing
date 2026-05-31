const USER_UID = 'plugin::users-permissions.user';

const normalizeString = (value: unknown) => String(value || '').trim();

const normalizeInteger = (value: unknown, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
};

const makeSlug = (value: string) =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

const serializeMedia = (media: any) => {
  if (!media) {
    return null;
  }

  return {
    id: media.id,
    url: media.url,
    formats: media.formats || null,
  };
};

const buildRule = (body: any) => {
  const ruleType = normalizeString(body.ruleType || body.rule?.type);
  const count = normalizeInteger(body.count ?? body.target ?? body.rule?.count ?? body.rule?.days, 1);
  const difficulty = normalizeString(body.difficulty || body.rule?.difficulty || 'Light');

  if (ruleType === 'daily_streak') {
    return { type: 'daily_streak', days: count };
  }

  if (ruleType === 'challenge_difficulty_approved_count') {
    return { type: 'challenge_difficulty_approved_count', difficulty, count };
  }

  return { type: 'daily_approved_count', count };
};

const findCurrentAdmin = async (ctx: any) => {
  let token: any = null;

  try {
    token = await strapi.plugin('users-permissions').service('jwt').getToken(ctx);
  } catch {
    token = null;
  }

  if (!token?.id) {
    ctx.unauthorized('Нужен токен входа');
    return null;
  }

  const user = await strapi.db.query(USER_UID).findOne({
    where: { id: token.id },
    populate: { role: true, avatar: true },
  });

  if (!user || user.globalRole !== 'admin') {
    ctx.forbidden('Доступ только для администратора');
    return null;
  }

  return user;
};

const ensureTeamRole = async (teamId: number, name: string) => {
  const existing = await strapi.db.query('api::team-role.team-role').findOne({
    where: {
      team: { id: teamId },
      name,
    },
  });

  if (existing) {
    return existing;
  }

  return strapi.db.query('api::team-role.team-role').create({
    data: {
      team: teamId,
      name,
    },
  });
};

const serializeAchievement = (achievement: any) => ({
  id: achievement.id,
  code: achievement.code,
  title: achievement.title,
  description: achievement.description || '',
  scope: achievement.scope || 'monthly',
  rule: achievement.rule || null,
  sort: Number(achievement.sort || 0),
  icon: serializeMedia(achievement.icon),
});

export default {
  async dashboard(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const [users, teams, challenges, achievements, shopCards] = await Promise.all([
      strapi.db.query(USER_UID).findMany({
        select: ['id', 'username', 'email', 'globalRole', 'xp', 'lvl', 'blocked'],
        populate: { avatar: true },
        orderBy: [{ id: 'asc' }],
        limit: 100,
      }),
      strapi.db.query('api::team.team').findMany({
        orderBy: [{ id: 'asc' }],
        limit: 100,
      }),
      strapi.db.query('api::challenge.challenge').findMany({
        orderBy: [{ createdAt: 'desc' }],
        limit: 100,
      }),
      strapi.db.query('api::achievement.achievement').findMany({
        populate: { icon: true },
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        limit: 100,
      }),
      strapi.db.query('api::shop-card.shop-card').findMany({
        populate: { photo: true },
        orderBy: [{ id: 'asc' }],
        limit: 100,
      }),
    ]);

    const teamUsers = await strapi.db.query('api::team-user.team-user').findMany({
      populate: {
        team: true,
        user: true,
        teamRole: true,
      },
      limit: 500,
    });
    const memberCountByTeam = new Map<number, number>();

    teamUsers.forEach((entry: any) => {
      if (entry.team?.id) {
        memberCountByTeam.set(entry.team.id, (memberCountByTeam.get(entry.team.id) || 0) + 1);
      }
    });

    ctx.body = {
      users: users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        globalRole: user.globalRole || 'worker',
        xp: Number(user.xp || 0),
        lvl: Number(user.lvl || 1),
        blocked: Boolean(user.blocked),
        avatar: serializeMedia(user.avatar),
      })),
      teams: teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        color: team.color || '',
        memberCount: memberCountByTeam.get(team.id) || 0,
      })),
      teamUsers: teamUsers.map((entry: any) => ({
        id: entry.id,
        teamId: entry.team?.id || null,
        teamName: entry.team?.name || '',
        userId: entry.user?.id || null,
        username: entry.user?.username || entry.user?.email || '',
        roleName: entry.teamRole?.name || '',
      })),
      challenges: challenges.map((challenge: any) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description || '',
        difficulty: challenge.difficulty || 'Light',
        xpReward: Number(challenge.xpReward || 0),
        deadline: challenge.deadline || '',
        visibility: challenge.visibility || 'public',
      })),
      achievements: achievements.map(serializeAchievement),
      shopCards: shopCards.map((card: any) => ({
        id: card.id,
        name: card.name,
        description: card.description || '',
        price: Number(card.price || 0),
        status: card.status || 'available',
        photo: serializeMedia(card.photo),
      })),
    };
  },

  async updateUser(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);
    const role = normalizeString(ctx.request.body?.globalRole);
    const data: any = {};

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверный пользователь');
    }

    if (['admin', 'project_manager', 'worker'].includes(role)) {
      data.globalRole = role;
    }

    if (Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'blocked')) {
      data.blocked = Boolean(ctx.request.body.blocked);
    }

    if (Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'xp')) {
      data.xp = normalizeInteger(ctx.request.body.xp, 0);
    }

    if (!Object.keys(data).length) {
      return ctx.badRequest('Нет данных для обновления');
    }

    const user = await strapi.db.query(USER_UID).update({
      where: { id },
      data,
    });

    ctx.body = { user };
  },

  async createTeam(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const name = normalizeString(ctx.request.body?.name);
    const color = normalizeString(ctx.request.body?.color || '#b559f3');

    if (!name) {
      return ctx.badRequest('Нужно название команды');
    }

    const existing = await strapi.db.query('api::team.team').findOne({ where: { name } });
    const team = existing
      ? await strapi.db.query('api::team.team').update({ where: { id: existing.id }, data: { name, color } })
      : await strapi.db.query('api::team.team').create({ data: { name, color } });

    await ensureTeamRole(team.id, 'Проектный менеджер');
    await ensureTeamRole(team.id, 'Участник');

    ctx.body = { team };
  },

  async assignTeamUser(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const userId = Number(ctx.request.body?.userId);
    const teamId = Number(ctx.request.body?.teamId);
    const roleName = normalizeString(ctx.request.body?.roleName || 'Участник');

    if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(teamId) || teamId <= 0) {
      return ctx.badRequest('Нужно выбрать пользователя и команду');
    }

    const role = await ensureTeamRole(teamId, roleName);
    const existing = await strapi.db.query('api::team-user.team-user').findOne({
      where: {
        user: { id: userId },
        team: { id: teamId },
      },
    });
    const entry = existing
      ? await strapi.db.query('api::team-user.team-user').update({
          where: { id: existing.id },
          data: { teamRole: role.id },
        })
      : await strapi.db.query('api::team-user.team-user').create({
          data: {
            user: userId,
            team: teamId,
            teamRole: role.id,
          },
        });

    ctx.body = { teamUser: entry };
  },

  async createChallenge(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const title = normalizeString(ctx.request.body?.title);

    if (!title) {
      return ctx.badRequest('Нужно название челленджа');
    }

    const challenge = await strapi.db.query('api::challenge.challenge').create({
      data: {
        title,
        description: normalizeString(ctx.request.body?.description),
        difficulty: normalizeString(ctx.request.body?.difficulty || 'Light'),
        xpReward: normalizeInteger(ctx.request.body?.xpReward, 50),
        deadline: normalizeString(ctx.request.body?.deadline) || null,
        visibility: normalizeString(ctx.request.body?.visibility || 'public'),
      },
    });

    ctx.body = { challenge };
  },

  async createAchievement(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const title = normalizeString(ctx.request.body?.title);
    const code = makeSlug(normalizeString(ctx.request.body?.code) || title);

    if (!title || !code) {
      return ctx.badRequest('Нужны code и title');
    }

    const existing = await strapi.db.query('api::achievement.achievement').findOne({ where: { code } });
    const data = {
      code,
      title,
      description: normalizeString(ctx.request.body?.description),
      scope: normalizeString(ctx.request.body?.scope || 'monthly'),
      sort: normalizeInteger(ctx.request.body?.sort, 0),
      rule: buildRule(ctx.request.body || {}),
    };
    const achievement = existing
      ? await strapi.db.query('api::achievement.achievement').update({ where: { id: existing.id }, data })
      : await strapi.db.query('api::achievement.achievement').create({ data });

    ctx.body = { achievement: serializeAchievement(achievement) };
  },

  async generateAchievement(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const idea = normalizeString(ctx.request.body?.idea);

    if (!idea) {
      return ctx.badRequest('Опиши идею достижения');
    }

    const endpoint = process.env.LANGFLOW_ACHIEVEMENT_ENDPOINT;

    if (!endpoint) {
      return ctx.badRequest('LANGFLOW_ACHIEVEMENT_ENDPOINT не настроен');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.LANGFLOW_API_KEY) {
      headers.Authorization = `Bearer ${process.env.LANGFLOW_API_KEY}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input_value: idea }),
    });
    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      return ctx.badRequest(data.error || data.message || 'Langflow не ответил');
    }

    const raw =
      data.output ||
      data.answer ||
      data.result ||
      data.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
      data;
    let draft: any = raw;

    if (typeof raw === 'string') {
      try {
        draft = JSON.parse(raw);
      } catch {
        draft = { title: raw };
      }
    }

    const title = normalizeString(draft.title || idea);
    const rule = draft.rule || buildRule(draft);

    ctx.body = {
      draft: {
        code: makeSlug(draft.code || title),
        title,
        description: normalizeString(draft.description || `Достижение по теме: ${idea}`),
        scope: normalizeString(draft.scope || 'monthly'),
        sort: normalizeInteger(draft.sort, 0),
        ruleType: normalizeString(rule.type || 'daily_approved_count'),
        count: normalizeInteger(rule.count ?? rule.days, 1),
        difficulty: normalizeString(rule.difficulty || 'Light'),
      },
    };
  },
};
