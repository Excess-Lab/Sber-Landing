const USER_UID = 'plugin::users-permissions.user';

const normalizeString = (value: unknown) => String(value || '').trim();

const normalizeInteger = (value: unknown, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
};

const calculateLevel = (value: unknown) => Math.floor(normalizeInteger(value, 0) / 50) + 1;

const makeSlug = (value: string) =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

const normalizeIdList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
};

const makeTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let suffix = '';

  for (let index = 0; index < 10; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `Sber-${suffix}!`;
};

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

const getAuthenticatedRoleId = async () => {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });

  return role?.id;
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

const isProjectManagerRoleName = (roleName: unknown) =>
  normalizeString(roleName).toLowerCase() === 'проектный менеджер';

const getTeamManagerLinks = async (teamId: number) =>
  strapi.db.query('api::team-user.team-user').findMany({
    where: {
      team: { id: teamId },
      teamRole: { name: 'Проектный менеджер' },
    },
    populate: { user: true, team: true, teamRole: true },
    limit: 100,
  });

const getSoleManagerTeamNamesForUser = async (userId: number) => {
  const managerLinks = await strapi.db.query('api::team-user.team-user').findMany({
    where: {
      user: { id: userId },
      teamRole: { name: 'Проектный менеджер' },
    },
    populate: { team: true, teamRole: true },
    limit: 100,
  });
  const blockedTeams: string[] = [];

  for (const link of managerLinks) {
    const teamId = link.team?.id;

    if (!teamId) {
      continue;
    }

    const managers = await getTeamManagerLinks(teamId);

    if (managers.length <= 1) {
      blockedTeams.push(link.team?.name || `#${teamId}`);
    }
  }

  return blockedTeams;
};

const getUsersFromTeams = async (teamIds: number[]) => {
  if (!teamIds.length) {
    return [];
  }

  const links = await strapi.db.query('api::team-user.team-user').findMany({
    where: {
      team: {
        id: { $in: teamIds },
      },
    },
    populate: { user: true },
    limit: 1000,
  });

  return links.map((link: any) => link.user?.id).filter(Boolean);
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

const serializeWordyWord = (word: any) => ({
  id: word.id,
  documentId: word.documentId || null,
  word: normalizeString(word.word).toLowerCase(),
  hint: normalizeString(word.hint),
  isActive: word.isActive !== false,
  sort: normalizeInteger(word.sort, 0),
});

const normalizeWordyPayload = (body: any) => ({
  word: normalizeString(body.word).toLowerCase(),
  hint: normalizeString(body.hint),
  isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  sort: normalizeInteger(body.sort, 0),
});

const shopExchangeStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  with_pm: 'У PM',
  issued: 'Выдано',
};

const serializeShopExchange = (exchange: any) => ({
  id: exchange.id,
  itemName: exchange.itemName || exchange.shopCard?.name || 'Товар',
  variantKey: exchange.variantKey || '',
  variantTitle: exchange.variantTitle || '',
  price: normalizeInteger(exchange.price, 0),
  status: exchange.status || 'pending',
  statusLabel: shopExchangeStatusLabels[exchange.status] || 'Ожидает',
  statusUpdatedAt: exchange.statusUpdatedAt || exchange.updatedAt || '',
  createdAt: exchange.createdAt || '',
  teamName: exchange.team?.name || '',
  user: exchange.user
    ? {
        id: exchange.user.id,
        username: exchange.user.username,
        email: exchange.user.email,
      }
    : null,
});

const normalizeShopStatus = (value: unknown) => {
  const status = normalizeString(value || 'available');

  return status === 'not_available' ? 'not_available' : 'available';
};

const normalizeShopVariants = (value: unknown) => {
  const source =
    typeof value === 'string'
      ? value
          .split('\n')
          .map((line) => {
            const [key, title, splineUrl = ''] = line.split('|').map((part) => normalizeString(part));

            return { key, title, splineUrl, gallery: [] };
          })
          .filter((variant) => variant.key || variant.title || variant.splineUrl)
      : Array.isArray(value)
        ? value
        : [];

  return source
    .map((variant: any, index: number) => {
      const key = makeSlug(variant.key || variant.title || `variant_${index + 1}`);
      const title = normalizeString(variant.title || variant.key || `Тип ${index + 1}`);
      const splineUrl = normalizeString(variant.splineUrl);
      const gallery = Array.isArray(variant.gallery)
        ? variant.gallery.map((item: unknown) => normalizeString(item)).filter(Boolean)
        : [];

      return key && title ? { key, title, splineUrl, gallery } : null;
    })
    .filter(Boolean);
};

const difficultyXpRewards: Record<string, number> = {
  None: 0,
  Light: 50,
  Medium: 100,
  Hard: 150,
};

const normalizeDifficulty = (value: unknown) => {
  const difficulty = normalizeString(value || 'Light');

  return difficultyXpRewards[difficulty] ? difficulty : 'Light';
};

const normalizeRequiredDifficulties = (value: unknown) => {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\n]+/)
      : [];

  return Array.from(
    new Set(
      source
        .map((item) => normalizeDifficulty(item))
        .filter((item) => Boolean(difficultyXpRewards[item])),
    ),
  );
};

const buildShopCardData = (body: any, current?: any) => {
  const name = normalizeString(body.name ?? current?.name);
  const price = normalizeInteger(body.price ?? current?.price, 0);
  const stock = normalizeInteger(body.stock ?? current?.stock, 0);

  if (!name) {
    return { error: 'Нужно название товара' };
  }

  if (Number(body.price) < 0 || Number(body.stock) < 0) {
    return { error: 'Цена и остаток не могут быть отрицательными' };
  }

  return {
    data: {
      name,
      description: normalizeString(body.description ?? current?.description),
      price,
      stock,
      status: normalizeShopStatus(body.status ?? current?.status),
      splineUrl: normalizeString(body.splineUrl ?? current?.splineUrl),
      variants: normalizeShopVariants(body.variants ?? current?.variants),
      requiredDifficulties: normalizeRequiredDifficulties(
        body.requiredDifficulties ?? current?.requiredDifficulties,
      ),
    },
  };
};

const getShopExchanges = async () => {
  const exchanges = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').findMany({
    populate: {
      user: true,
      team: true,
      shopCard: true,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    limit: 200,
  });

  return exchanges.map(serializeShopExchange);
};

const serializeUser = (user: any) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  globalRole: user.globalRole || 'worker',
  xp: normalizeInteger(user.xp, 0),
  lvl: calculateLevel(user.xp),
  blocked: Boolean(user.blocked),
  mustChangePassword: Boolean(user.mustChangePassword),
  temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt || '',
  avatar: serializeMedia(user.avatar),
});

const parseLangflowDraft = (data: any) => {
  const raw =
    data.output ||
    data.answer ||
    data.result ||
    data.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
    data;

  if (typeof raw !== 'string') {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { title: raw };
  }
};

const callLangflow = async (endpoint: string | undefined, idea: string, missingMessage: string, ctx: any) => {
  if (!endpoint) {
    ctx.badRequest(missingMessage);
    return null;
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
    ctx.badRequest(data.error || data.message || 'Langflow не ответил');
    return null;
  }

  return parseLangflowDraft(data);
};

const createOrUpdateChallenge = async (body: any, id?: number) => {
  const mentionedUserIds = normalizeIdList(body.userIds || body.mentionedUserIds);
  const teamUserIds = await getUsersFromTeams(normalizeIdList(body.teamIds));
  const allMentionedUsers = Array.from(new Set([...mentionedUserIds, ...teamUserIds]));
  const data: any = {
    title: normalizeString(body.title),
    description: normalizeString(body.description),
    difficulty: normalizeDifficulty(body.difficulty),
    xpReward: difficultyXpRewards[normalizeDifficulty(body.difficulty)],
    deadline: normalizeString(body.deadline) || null,
    visibility: normalizeString(body.visibility || 'public'),
  };

  if (allMentionedUsers.length) {
    data.mentionedUsers = allMentionedUsers;
  }

  if (id) {
    return strapi.db.query('api::challenge.challenge').update({
      where: { id },
      data,
    });
  }

  return strapi.db.query('api::challenge.challenge').create({ data });
};

export default {
  async dashboard(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const [users, teams, challenges, achievements, shopCards, wordyWords] = await Promise.all([
      strapi.db.query(USER_UID).findMany({
        select: [
          'id',
          'username',
          'email',
          'globalRole',
          'xp',
          'lvl',
          'blocked',
          'mustChangePassword',
          'temporaryPasswordIssuedAt',
        ],
        populate: { avatar: true },
        orderBy: [{ id: 'asc' }],
        limit: 200,
      }),
      strapi.db.query('api::team.team').findMany({
        orderBy: [{ id: 'asc' }],
        limit: 200,
      }),
      strapi.db.query('api::challenge.challenge').findMany({
        populate: { mentionedUsers: true },
        orderBy: [{ createdAt: 'desc' }],
        limit: 200,
      }),
      strapi.db.query('api::achievement.achievement').findMany({
        populate: { icon: true },
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        limit: 200,
      }),
      strapi.db.query('api::shop-card.shop-card').findMany({
        populate: { photo: true },
        orderBy: [{ id: 'asc' }],
        limit: 100,
      }),
      strapi.db.query('api::wordy-word.wordy-word').findMany({
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        limit: 200,
      }),
    ]);

    const teamUsers = await strapi.db.query('api::team-user.team-user').findMany({
      populate: {
        team: true,
        user: true,
        teamRole: true,
      },
      limit: 1000,
    });
    const memberCountByTeam = new Map<number, number>();
    const managersByTeam = new Map<number, string[]>();

    teamUsers.forEach((entry: any) => {
      if (!entry.team?.id) {
        return;
      }

      memberCountByTeam.set(entry.team.id, (memberCountByTeam.get(entry.team.id) || 0) + 1);

      if (entry.teamRole?.name === 'Проектный менеджер') {
        managersByTeam.set(entry.team.id, [
          ...(managersByTeam.get(entry.team.id) || []),
          entry.user?.username || entry.user?.email || 'PM',
        ]);
      }
    });

    ctx.body = {
      users: users.map(serializeUser),
      teams: teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        color: team.color || '',
        memberCount: memberCountByTeam.get(team.id) || 0,
        managers: managersByTeam.get(team.id) || [],
      })),
      teamUsers: teamUsers.map((entry: any) => ({
        id: entry.id,
        teamId: entry.team?.id || null,
        teamName: entry.team?.name || '',
        userId: entry.user?.id || null,
        username: entry.user?.username || entry.user?.email || '',
        userEmail: entry.user?.email || '',
        userGlobalRole: entry.user?.globalRole || 'worker',
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
        mentionedUserIds: (challenge.mentionedUsers || []).map((user: any) => user.id),
      })),
      achievements: achievements.map(serializeAchievement),
      wordyWords: wordyWords.map(serializeWordyWord),
      shopCards: shopCards.map((card: any) => ({
        id: card.id,
        name: card.name,
        description: card.description || '',
        price: Number(card.price || 0),
        stock: Number(card.stock || 0),
        status: card.status || 'available',
        splineUrl: card.splineUrl || '',
        gallery: Array.isArray(card.gallery) ? card.gallery : [],
        variants: Array.isArray(card.variants) ? card.variants : [],
        requiredDifficulties: Array.isArray(card.requiredDifficulties) ? card.requiredDifficulties : [],
        photo: serializeMedia(card.photo),
      })),
      shopExchanges: await getShopExchanges(),
    };
  },

  async createUser(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const username = normalizeString(ctx.request.body?.username);
    const email = normalizeString(ctx.request.body?.email).toLowerCase();
    const teamRoleName = normalizeString(ctx.request.body?.teamRoleName || 'Участник');
    const requestedGlobalRole = normalizeString(ctx.request.body?.globalRole || 'worker');
    const globalRole = teamRoleName === 'Проектный менеджер' ? 'project_manager' : requestedGlobalRole;

    if (!username || !email) {
      return ctx.badRequest('Нужны имя и email');
    }

    if (!['admin', 'project_manager', 'worker'].includes(globalRole)) {
      return ctx.badRequest('Неверная роль');
    }

    const existing = await strapi.db.query(USER_UID).findOne({ where: { email } });

    if (existing) {
      return ctx.badRequest('Пользователь с такой почтой уже есть');
    }

    const password = makeTemporaryPassword();
    const roleId = await getAuthenticatedRoleId();
    const user = await strapi.plugin('users-permissions').service('user').add({
      username,
      email,
      password,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: roleId,
      globalRole,
      xp: normalizeInteger(ctx.request.body?.xp, 0),
      lvl: calculateLevel(ctx.request.body?.xp),
      statusEmoji: '😁',
      statusText: 'Кайфую',
      mustChangePassword: true,
      temporaryPasswordIssuedAt: new Date().toISOString(),
    });

    const teamId = Number(ctx.request.body?.teamId);
    if (Number.isFinite(teamId) && teamId > 0) {
      const teamRole = await ensureTeamRole(teamId, teamRoleName);
      await strapi.db.query('api::team-user.team-user').create({
        data: {
          user: user.id,
          team: teamId,
          teamRole: teamRole.id,
        },
      });
    }

    ctx.body = {
      user: serializeUser(user),
      temporaryPassword: password,
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

    if (Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'username')) {
      data.username = normalizeString(ctx.request.body.username);
    }

    if (Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'email')) {
      data.email = normalizeString(ctx.request.body.email).toLowerCase();
    }

    if (['admin', 'project_manager', 'worker'].includes(role)) {
      if (role !== 'project_manager') {
        const blockedTeams = await getSoleManagerTeamNamesForUser(id);

        if (blockedTeams.length) {
          return ctx.badRequest(`Нельзя убрать последнего PM в командах: ${blockedTeams.join(', ')}`);
        }
      }

      data.globalRole = role;
    }

    if (Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'blocked')) {
      data.blocked = Boolean(ctx.request.body.blocked);
    }

    if (Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'xp')) {
      data.xp = normalizeInteger(ctx.request.body.xp, 0);
      data.lvl = calculateLevel(data.xp);
    }

    if (!Object.keys(data).length) {
      return ctx.badRequest('Нет данных для обновления');
    }

    const user = await strapi.db.query(USER_UID).update({
      where: { id },
      data,
      populate: { avatar: true },
    });

    ctx.body = { user: serializeUser(user) };
  },

  async resetTemporaryPassword(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверный пользователь');
    }

    const password = makeTemporaryPassword();

    await strapi.plugin('users-permissions').service('user').edit(id, {
      password,
      mustChangePassword: true,
      temporaryPasswordIssuedAt: new Date().toISOString(),
    });

    ctx.body = { temporaryPassword: password };
  },

  async createTeam(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const name = normalizeString(ctx.request.body?.name);
    const color = normalizeString(ctx.request.body?.color || '#b559f3');
    const managerUserId = Number(ctx.request.body?.managerUserId);

    if (!name) {
      return ctx.badRequest('Нужно название команды');
    }

    if (!Number.isFinite(managerUserId) || managerUserId <= 0) {
      return ctx.badRequest('Нужно выбрать PM команды');
    }

    const manager = await strapi.db.query(USER_UID).findOne({
      where: { id: managerUserId },
      populate: { primaryTeam: true },
    });

    if (!manager) {
      return ctx.badRequest('PM не найден');
    }

    const existing = await strapi.db.query('api::team.team').findOne({ where: { name } });
    const team = existing
      ? await strapi.db.query('api::team.team').update({ where: { id: existing.id }, data: { name, color } })
      : await strapi.db.query('api::team.team').create({ data: { name, color } });

    const managerRole = await ensureTeamRole(team.id, 'Проектный менеджер');
    await ensureTeamRole(team.id, 'Участник');
    const existingManagerLink = await strapi.db.query('api::team-user.team-user').findOne({
      where: {
        user: { id: managerUserId },
        team: { id: team.id },
      },
    });

    if (existingManagerLink) {
      await strapi.db.query('api::team-user.team-user').update({
        where: { id: existingManagerLink.id },
        data: { teamRole: managerRole.id },
      });
    } else {
      await strapi.db.query('api::team-user.team-user').create({
        data: {
          user: managerUserId,
          team: team.id,
          teamRole: managerRole.id,
        },
      });
    }

    await strapi.db.query(USER_UID).update({
      where: { id: managerUserId },
      data: {
        globalRole: 'project_manager',
        primaryTeam: manager.primaryTeam?.id || team.id,
      },
    });

    ctx.body = { team };
  },

  async updateTeam(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);
    const name = normalizeString(ctx.request.body?.name);
    const color = normalizeString(ctx.request.body?.color || '#b559f3');

    if (!Number.isFinite(id) || id <= 0 || !name) {
      return ctx.badRequest('Нужно выбрать команду и название');
    }

    const team = await strapi.db.query('api::team.team').update({
      where: { id },
      data: { name, color },
    });

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
      populate: { teamRole: true },
    });

    if (existing && isProjectManagerRoleName(existing.teamRole?.name) && !isProjectManagerRoleName(roleName)) {
      const managers = await getTeamManagerLinks(teamId);

      if (managers.length <= 1) {
        return ctx.badRequest('Нельзя убрать последнего PM команды');
      }
    }

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

    if (roleName === 'Проектный менеджер') {
      await strapi.db.query(USER_UID).update({
        where: { id: userId },
        data: { globalRole: 'project_manager' },
      });
    }

    ctx.body = { teamUser: entry };
  },

  async deleteTeamUser(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверная связь команды');
    }

    const entry = await strapi.db.query('api::team-user.team-user').findOne({
      where: { id },
      populate: { team: true, teamRole: true },
    });

    if (!entry) {
      return ctx.notFound('Связь команды не найдена');
    }

    if (isProjectManagerRoleName(entry.teamRole?.name)) {
      const managers = await getTeamManagerLinks(entry.team?.id);

      if (managers.length <= 1) {
        return ctx.badRequest('Нельзя удалить последнего PM команды');
      }
    }

    await strapi.db.query('api::team-user.team-user').delete({ where: { id } });

    ctx.body = { ok: true };
  },

  async createShopCard(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const result = buildShopCardData(ctx.request.body || {});

    if (result.error) {
      return ctx.badRequest(result.error);
    }

    const shopCard = await strapi.db.query('api::shop-card.shop-card').create({
      data: result.data,
    });

    ctx.body = { shopCard };
  },

  async updateShopCard(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверный товар');
    }

    const current = await strapi.db.query('api::shop-card.shop-card').findOne({ where: { id } });

    if (!current) {
      return ctx.notFound('Товар не найден');
    }

    const result = buildShopCardData(ctx.request.body || {}, current);

    if (result.error) {
      return ctx.badRequest(result.error);
    }

    const shopCard = await strapi.db.query('api::shop-card.shop-card').update({
      where: { id },
      data: result.data,
    });

    ctx.body = { shopCard };
  },

  async deleteShopCard(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверный товар');
    }

    const current = await strapi.db.query('api::shop-card.shop-card').findOne({ where: { id } });

    if (!current) {
      return ctx.notFound('Товар не найден');
    }

    const exchanges = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').findMany({
      where: { shopCard: { id } },
      limit: 1,
    });

    if (exchanges.length) {
      return ctx.badRequest('Нельзя удалить товар с заявками обмена. Переведи его в статус “Недоступен”.');
    }

    await strapi.db.query('api::shop-card.shop-card').delete({ where: { id } });

    ctx.body = { ok: true };
  },

  async updateShopExchangeStatus(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);
    const nextStatus = normalizeString(ctx.request.body?.status);
    const allowedNext: Record<string, string[]> = {
      pending: ['with_pm'],
      with_pm: ['issued'],
      issued: [],
    };

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверная заявка обмена');
    }

    if (!['with_pm', 'issued'].includes(nextStatus)) {
      return ctx.badRequest('Неверный статус обмена');
    }

    const exchange = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').findOne({
      where: { id },
    });

    if (!exchange) {
      return ctx.notFound('Заявка обмена не найдена');
    }

    if (!allowedNext[exchange.status || 'pending']?.includes(nextStatus)) {
      return ctx.badRequest('Нельзя установить этот статус из текущего состояния');
    }

    const updated = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').update({
      where: { id },
      data: {
        status: nextStatus,
        statusUpdatedAt: new Date().toISOString(),
      },
      populate: {
        user: true,
        team: true,
        shopCard: true,
      },
    });

    ctx.body = { exchange: serializeShopExchange(updated) };
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

    const challenge = await createOrUpdateChallenge(ctx.request.body || {});

    ctx.body = { challenge };
  },

  async updateChallenge(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);
    const title = normalizeString(ctx.request.body?.title);

    if (!Number.isFinite(id) || id <= 0 || !title) {
      return ctx.badRequest('Нужно выбрать челлендж и название');
    }

    const challenge = await createOrUpdateChallenge(ctx.request.body || {}, id);

    ctx.body = { challenge };
  },

  async generateChallenge(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const idea = normalizeString(ctx.request.body?.idea);

    if (!idea) {
      return ctx.badRequest('Опиши идею челленджа');
    }

    const draft = await callLangflow(
      process.env.LANGFLOW_CHALLENGE_ENDPOINT,
      idea,
      'LANGFLOW_CHALLENGE_ENDPOINT не настроен',
      ctx,
    );

    if (!draft) {
      return;
    }

    ctx.body = {
      draft: {
        title: normalizeString(draft.title || idea),
        description: normalizeString(draft.description || `Челлендж по теме: ${idea}`),
        difficulty: normalizeDifficulty(draft.difficulty || 'Medium'),
        xpReward: difficultyXpRewards[normalizeDifficulty(draft.difficulty || 'Medium')],
        deadline: normalizeString(draft.deadline || ''),
        visibility: normalizeString(draft.visibility || 'public'),
      },
    };
  },

  async createWordyWord(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const data = normalizeWordyPayload(ctx.request.body || {});

    if (!data.word || !data.hint) {
      return ctx.badRequest('Нужны слово и подсказка');
    }

    const existing = await strapi.db.query('api::wordy-word.wordy-word').findOne({
      where: { word: data.word },
    });
    const wordyWord = existing
      ? await strapi.db.query('api::wordy-word.wordy-word').update({ where: { id: existing.id }, data })
      : await strapi.db.query('api::wordy-word.wordy-word').create({ data });

    ctx.body = { wordyWord: serializeWordyWord(wordyWord) };
  },

  async updateWordyWord(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);
    const data = normalizeWordyPayload(ctx.request.body || {});

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверное слово Wordly');
    }

    if (!data.word || !data.hint) {
      return ctx.badRequest('Нужны слово и подсказка');
    }

    const wordyWord = await strapi.db.query('api::wordy-word.wordy-word').update({
      where: { id },
      data,
    });

    ctx.body = { wordyWord: serializeWordyWord(wordyWord) };
  },

  async deleteWordyWord(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверное слово Wordly');
    }

    await strapi.db.query('api::wordy-word.wordy-word').delete({ where: { id } });

    ctx.body = { ok: true };
  },

  async generateWordyWord(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const idea = normalizeString(ctx.request.body?.idea || 'простое технологическое слово');
    const draft = await callLangflow(
      process.env.LANGFLOW_WORDY_ENDPOINT,
      idea,
      'LANGFLOW_WORDY_ENDPOINT не настроен',
      ctx,
    );

    if (!draft) {
      return;
    }

    ctx.body = {
      draft: {
        word: normalizeString(draft.word || draft.title || idea).toLowerCase().replace(/\s+/g, ''),
        hint: normalizeString(draft.hint || draft.description || `Подсказка по теме: ${idea}`),
        isActive: draft.isActive === undefined ? true : Boolean(draft.isActive),
        sort: normalizeInteger(draft.sort, 0),
      },
    };
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

  async deleteAchievement(ctx: any) {
    const admin = await findCurrentAdmin(ctx);

    if (!admin) {
      return;
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверное достижение');
    }

    const current = await strapi.db.query('api::achievement.achievement').findOne({ where: { id } });

    if (!current) {
      return ctx.notFound('Достижение не найдено');
    }

    await strapi.db.query('api::achievement.achievement').delete({ where: { id } });

    ctx.body = { ok: true };
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

    const draft = await callLangflow(
      process.env.LANGFLOW_ACHIEVEMENT_ENDPOINT,
      idea,
      'LANGFLOW_ACHIEVEMENT_ENDPOINT не настроен',
      ctx,
    );

    if (!draft) {
      return;
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
