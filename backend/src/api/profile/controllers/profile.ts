import { recomputeUserAchievements } from '../../../services/gamification';

const USER_UID = 'plugin::users-permissions.user';

const getSingleFile = (files: any, fieldName: string) => {
  const file = files?.[fieldName];

  if (Array.isArray(file)) {
    return file[0];
  }

  return file;
};

const serializeMedia = (file: any) => {
  if (!file) {
    return null;
  }

  return {
    id: file.id,
    documentId: file.documentId,
    name: file.name,
    alternativeText: file.alternativeText,
    caption: file.caption,
    width: file.width,
    height: file.height,
    formats: file.formats,
    hash: file.hash,
    ext: file.ext,
    mime: file.mime,
    size: file.size,
    url: file.url,
    previewUrl: file.previewUrl,
    provider: file.provider,
  };
};

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

const toMonthRange = (monthKey: string) => {
  if (monthKey === 'lifetime') {
    return null;
  }

  const [yearRaw, monthRaw] = String(monthKey || '').split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  const startMoscow = new Date(`${start.toISOString().slice(0, 10)}T00:00:00+03:00`);
  const endMoscow = new Date(`${end.toISOString().slice(0, 10)}T00:00:00+03:00`);

  return {
    startDay: start.toISOString().slice(0, 10),
    endDay: end.toISOString().slice(0, 10),
    startIso: startMoscow.toISOString(),
    endIso: endMoscow.toISOString(),
  };
};

const serializeUser = (user: any) => ({
  id: user.id,
  documentId: user.documentId,
  username: user.username,
  email: user.email,
  provider: user.provider,
  confirmed: user.confirmed,
  blocked: user.blocked,
  globalRole: user.globalRole,
  xp: normalizeXp(user.xp),
  lvl: calculateLevel(user.xp),
  statusEmoji: user.statusEmoji || '😁',
  statusText: user.statusText || 'Кайфую',
  primaryTeamId: user.primaryTeam?.id || null,
  mustChangePassword: Boolean(user.mustChangePassword),
  temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt || null,
  avatar: serializeMedia(user.avatar),
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  publishedAt: user.publishedAt,
});

const serializeParticipant = (user: any) => ({
  id: user.id,
  username: user.username,
  xp: normalizeXp(user.xp),
  lvl: calculateLevel(user.xp),
  avatar: serializeMedia(user.avatar),
});

const serializeChallenge = (challenge: any) => ({
  id: challenge.id,
  documentId: challenge.documentId,
  title: challenge.title,
  description: challenge.description,
  type: challenge.type,
  difficulty: challenge.difficulty,
  xpReward: normalizeXp(challenge.xpReward ?? challenge.xp_reward),
  deadline: challenge.deadline,
  visibility: challenge.visibility || 'private',
});

const serializeShopCard = (card: any) => ({
  id: card.id,
  documentId: card.documentId,
  name: card.name || 'Товар',
  description: card.description || '',
  price: normalizeXp(card.price),
  stock: normalizeXp(card.stock),
  status: card.status || 'available',
  photo: serializeMedia(card.photo),
  gallery: Array.isArray(card.gallery) ? card.gallery : [],
  variants: Array.isArray(card.variants) ? card.variants : [],
  splineUrl: card.splineUrl || '',
  requiredDifficulties: Array.isArray(card.requiredDifficulties) ? card.requiredDifficulties : [],
  requirementsLabel: Array.isArray(card.requiredDifficulties) && card.requiredDifficulties.length
    ? card.requiredDifficulties.join(' + ')
    : '',
  eligible: card.eligible ?? true,
  missingDifficulties: Array.isArray(card.missingDifficulties) ? card.missingDifficulties : [],
});

const shopExchangeStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  with_pm: 'У PM',
  issued: 'Выдано',
};

const fallbackWordyWords = [
  { id: 0, word: 'сервер', hint: 'Где живёт backend', sort: 1, isActive: true },
  { id: 0, word: 'токен', hint: 'Ключ авторизации', sort: 2, isActive: true },
  { id: 0, word: 'релиз', hint: 'Выход новой версии', sort: 3, isActive: true },
  { id: 0, word: 'макет', hint: 'Первый вид интерфейса', sort: 4, isActive: true },
];

const WORDLY_MAX_ATTEMPTS = 5;
const WORDLY_REWARD_XP = 50;

const serializeShopExchange = (exchange: any) => ({
  id: exchange.id,
  itemName: exchange.itemName || exchange.shopCard?.name || 'Товар',
  variantKey: exchange.variantKey || '',
  variantTitle: exchange.variantTitle || '',
  price: normalizeXp(exchange.price),
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

const serializeWordyWord = (word: any) => ({
  id: word.id || 0,
  documentId: word.documentId || null,
  word: String(word.word || '').trim().toLowerCase(),
  hint: String(word.hint || '').trim(),
  isActive: word.isActive !== false,
  sort: Number(word.sort || 0),
});

const getActiveWordyWords = async () => {
  try {
    const words = await strapi.db.query('api::wordy-word.wordy-word').findMany({
      where: { isActive: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      limit: 200,
    });
    const serialized = words.map(serializeWordyWord).filter((item: any) => item.word && item.hint);

    return serialized.length ? serialized : fallbackWordyWords.map(serializeWordyWord);
  } catch {
    return fallbackWordyWords.map(serializeWordyWord);
  }
};

const getCurrentWordyWord = async () => {
  const words = await getActiveWordyWords();
  const dayKey = getWordlyPeriodKey(new Date());
  const seed = Array.from(dayKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return words[seed % words.length];
};

const getMoscowDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value || '';

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: Number(getPart('hour')),
  };
};

const getWordlyPeriodKey = (date: Date) => {
  const parts = getMoscowDateParts(date);

  if (parts.hour >= 9) {
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  const previous = new Date(date.getTime() - 86400000);
  const previousParts = getMoscowDateParts(previous);

  return `${previousParts.year}-${previousParts.month}-${previousParts.day}`;
};

const getWordlyResetIso = (periodKey: string) =>
  new Date(`${periodKey}T09:00:00+03:00`).getTime() + 86400000;

const normalizeWordlyGuess = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/gi, '');

const evaluateWordlyGuess = (guess: string, answer: string) => {
  const guessLetters = Array.from(guess);
  const answerLetters = Array.from(answer);
  const result = guessLetters.map((letter) => ({ letter, state: 'absent' }));
  const remaining: Record<string, number> = {};

  answerLetters.forEach((letter, index) => {
    if (guessLetters[index] === letter) {
      result[index].state = 'correct';
      return;
    }

    remaining[letter] = (remaining[letter] || 0) + 1;
  });

  guessLetters.forEach((letter, index) => {
    if (result[index].state === 'correct') {
      return;
    }

    if (remaining[letter] > 0) {
      result[index].state = 'present';
      remaining[letter] -= 1;
    }
  });

  return result;
};

const serializeWordlyPlay = (play: any) => ({
  id: play?.id || null,
  status: play?.status || 'in_progress',
  attempts: Array.isArray(play?.attempts) ? play.attempts : [],
  completed: play?.status === 'won' || play?.status === 'lost',
  won: play?.status === 'won',
});

const getWordlyStats = async (wordId: number | null) => {
  const where: any = {
    status: {
      $in: ['won', 'lost'],
    },
  };

  if (wordId) {
    where.word = { id: wordId };
  }

  const plays = await strapi.db.query('api::wordly-play.wordly-play').findMany({
    where,
    select: ['status', 'attempts'],
    limit: 10000,
  });
  const total = plays.length;
  const won = plays.filter((play: any) => play.status === 'won').length;
  const guessRate = total ? Math.round((won / total) * 100) : 0;
  const averageAttempts = won
    ? Math.round(
        (plays
          .filter((play: any) => play.status === 'won')
          .reduce((sum: number, play: any) => sum + (Array.isArray(play.attempts) ? play.attempts.length : 0), 0) /
          won) *
          10,
      ) / 10
    : 0;

  return {
    total,
    won,
    lost: total - won,
    guessRate,
    averageAttempts,
  };
};

const getGraphemes = (value: string) => {
  const Segmenter = (Intl as any).Segmenter;
  const segmenter =
    typeof Intl !== 'undefined' && Segmenter
      ? new Segmenter('ru', { granularity: 'grapheme' })
      : null;

  if (!segmenter) {
    return Array.from(value);
  }

  return Array.from(segmenter.segment(value), (part: any) => part.segment);
};

const isSingleEmoji = (value: string) => {
  const trimmed = value.trim();
  const graphemes = getGraphemes(trimmed);

  return (
    graphemes.length === 1 &&
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(trimmed)
  );
};

const findCurrentUser = async (ctx: any) => {
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
    populate: {
      avatar: true,
      role: true,
      primaryTeam: true,
    },
  });

  if (!user) {
    ctx.unauthorized('Пользователь не найден');
    return null;
  }

  return user;
};

const getUserChallenges = async (userId: number) => {
  try {
    const entries = await strapi.db.query('api::user-challenge.user-challenge').findMany({
      where: {
        user: {
          id: userId,
        },
      },
      populate: {
        challenge: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      limit: 8,
    });

    return entries.map((entry: any) => ({
      id: entry.id,
      status: entry.status,
      submittedAt: entry.submittedAt,
      submissionText: entry.submissionText || '',
      submissionLinks: entry.submissionLinks || '',
      completedAt: entry.completedAt,
      challenge: entry.challenge ? serializeChallenge(entry.challenge) : null,
    }));
  } catch {
    return [];
  }
};

const getAvailableChallenges = async (userId: number) => {
  try {
    const entries = await strapi.db.query('api::challenge.challenge').findMany({
      populate: {
        mentionedUsers: true,
      },
      orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
      limit: 50,
    });

    return entries
      .filter((challenge: any) => {
        if (challenge.visibility === 'public') {
          return true;
        }

        return (challenge.mentionedUsers || []).some((mentionedUser: any) => mentionedUser.id === userId);
      })
      .map(serializeChallenge);
  } catch {
    return [];
  }
};

const getUserTeams = async (userId: number) => {
  try {
    const entries = await strapi.db.query('api::team-user.team-user').findMany({
      where: {
        user: {
          id: userId,
        },
      },
      populate: {
        team: true,
        teamRole: true,
      },
      limit: 12,
    });

    const teams = [];

    for (const entry of entries) {
      if (!entry.team?.id || !entry.team?.name) {
        continue;
      }

      const memberEntries = await strapi.db.query('api::team-user.team-user').findMany({
        where: {
          team: {
            id: entry.team.id,
          },
        },
        populate: {
          user: {
            populate: {
              avatar: true,
            },
          },
          teamRole: true,
        },
        limit: 24,
      });

      teams.push({
        id: entry.team.id,
        documentId: entry.team.documentId || null,
        name: entry.team.name,
        color: entry.team.color || '',
        roleName: entry.teamRole?.name || '',
        members: memberEntries
          .map((memberEntry: any) => {
            const member = memberEntry.user;

            if (!member) {
              return null;
            }

            return {
              id: member.id,
              username: member.username,
              globalRole: member.globalRole,
              xp: normalizeXp(member.xp),
              lvl: calculateLevel(member.xp),
              avatar: serializeMedia(member.avatar),
              roleName: memberEntry.teamRole?.name || '',
            };
          })
          .filter(Boolean),
      });
    }

    return teams;
  } catch {
    return [];
  }
};

const getPrimaryTeamForUser = async (user: any) => {
  const primaryTeamId = Number(user?.primaryTeam?.id);

  if (!Number.isFinite(primaryTeamId) || primaryTeamId <= 0) {
    return null;
  }

  const membership = await strapi.db.query('api::team-user.team-user').findOne({
    where: {
      user: { id: user.id },
      team: { id: primaryTeamId },
    },
    populate: { team: true },
  });

  return membership?.team || null;
};

const requirePrimaryTeamForUser = async (user: any, ctx: any) => {
  const primaryTeam = await getPrimaryTeamForUser(user);

  if (primaryTeam?.id) {
    return primaryTeam;
  }

  ctx.badRequest('Нужен выбор команды перед отправкой');
  return null;
};

const getManagedTeamIds = async (user: any) => {
  const role = String(user?.globalRole || '').toLowerCase();

  if (role === 'admin') {
    return null;
  }

  if (role !== 'project_manager') {
    return [];
  }

  const teamLinks = await strapi.db.query('api::team-user.team-user').findMany({
    where: { user: { id: user.id } },
    populate: { team: true },
    limit: 50,
  });

  return Array.from(
    new Set(
      teamLinks
        .map((link: any) => link.team?.id)
        .filter((id: any) => typeof id === 'number'),
    ),
  );
};

const getUserRoles = async (userId: number) => {
  try {
    const entries = await strapi.db.query('api::team-user.team-user').findMany({
      where: {
        user: {
          id: userId,
        },
      },
      populate: {
        team: true,
        teamRole: true,
      },
      limit: 24,
    });

    return entries
      .map((entry: any) => ({
        id: entry.teamRole?.id || entry.id,
        documentId: entry.teamRole?.documentId || null,
        name: entry.teamRole?.name || '',
        teamName: entry.team?.name || '',
      }))
      .filter((role: any) => role.name);
  } catch {
    return [];
  }
};

const getParticipantRating = async () => {
  try {
    const users = await strapi.db.query(USER_UID).findMany({
      where: {
        globalRole: {
          $ne: 'admin',
        },
        blocked: false,
      },
      populate: {
        avatar: true,
      },
      orderBy: [{ xp: 'desc' }, { id: 'asc' }],
      limit: 10,
    });

    return users.map(serializeParticipant);
  } catch {
    return [];
  }
};

const getShopCardRequirementStatus = async (userId: number, card: any) => {
  const required = Array.isArray(card.requiredDifficulties)
    ? card.requiredDifficulties.map((value: any) => String(value || '').trim()).filter(Boolean)
    : [];

  if (!required.length) {
    return { eligible: true, missingDifficulties: [] };
  }

  const counts = await getChallengeApprovedCountsByDifficulty(userId, 'lifetime');
  const missingDifficulties = required.filter((difficulty) => normalizeXp(counts[difficulty]) <= 0);

  return {
    eligible: missingDifficulties.length === 0,
    missingDifficulties,
  };
};

const getShopCards = async (userId?: number) => {
  try {
    const cards = await strapi.db.query('api::shop-card.shop-card').findMany({
      where: {
        status: 'available',
      },
      populate: {
        photo: true,
      },
      orderBy: [{ id: 'asc' }],
      limit: 20,
    });

    if (!userId) {
      return cards.map(serializeShopCard);
    }

    return Promise.all(
      cards.map(async (card: any) =>
        serializeShopCard({
          ...card,
          ...(await getShopCardRequirementStatus(userId, card)),
        }),
      ),
    );
  } catch {
    return [];
  }
};

const getUserShopExchanges = async (userId: number) => {
  try {
    const exchanges = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').findMany({
      where: {
        user: { id: userId },
      },
      populate: {
        user: true,
        team: true,
        shopCard: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      limit: 50,
    });

    return exchanges.map(serializeShopExchange);
  } catch {
    return [];
  }
};

const getDailyToday = async (userId: number, today: string) => {
  const dayKey = `${userId}:${today}`;

  try {
    const entry = await strapi.db.query('api::daily-checkin.daily-checkin').findOne({
      where: { dayKey },
      select: ['id', 'day', 'status', 'points', 'approvedAt', 'pointsApplied'],
    });

    if (!entry) {
      return null;
    }

    return {
      id: entry.id,
      day: entry.day,
      status: entry.status,
      points: normalizeXp(entry.points),
      approvedAt: entry.approvedAt,
      pointsApplied: Boolean(entry.pointsApplied),
    };
  } catch {
    return null;
  }
};

const getDailyMonthStats = async (userId: number, monthKey: string) => {
  const range = toMonthRange(monthKey);

  const where: any = {
    user: { id: userId },
    status: 'approved',
  };

  if (range) {
    where.day = {
      $gte: range.startDay,
      $lt: range.endDay,
    };
  }

  try {
    const entries = await strapi.db.query('api::daily-checkin.daily-checkin').findMany({
      where,
      select: ['day', 'points'],
      orderBy: [{ day: 'desc' }],
      limit: 1000,
    });

    const approvedCount = entries.length;
    const xpFromDailies = entries.reduce((sum: number, entry: any) => sum + normalizeXp(entry.points), 0);

    const approvedDays = new Set(entries.map((entry: any) => String(entry.day)));
    let streak = 0;
    let cursor = new Date();

    while (true) {
      const day = formatMoscowDay(cursor);

      if (range && day < range.startDay) {
        break;
      }

      if (!approvedDays.has(day)) {
        break;
      }

      streak += 1;
      cursor = new Date(cursor.getTime() - 86400000);
    }

    return {
      approvedCount,
      streak,
      xpFromDailies,
    };
  } catch {
    return { approvedCount: 0, streak: 0, xpFromDailies: 0 };
  }
};

const getChallengeApprovedCountsByDifficulty = async (userId: number, monthKey: string) => {
  const range = toMonthRange(monthKey);

  const where: any = {
    user: { id: userId },
    status: 'approved',
  };

  if (range) {
    where.completedAt = {
      $gte: range.startIso,
      $lt: range.endIso,
    };
  }

  try {
    const entries = await strapi.db.query('api::user-challenge.user-challenge').findMany({
      where,
      populate: { challenge: true },
      orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
      limit: 1000,
    });

    const counts: Record<string, number> = {};

    entries.forEach((entry: any) => {
      const difficulty = String(entry.challenge?.difficulty || entry.difficulty || '').trim();
      if (!difficulty) {
        return;
      }
      counts[difficulty] = (counts[difficulty] || 0) + 1;
    });

    return counts;
  } catch {
    return {};
  }
};

const ruleProgress = (rule: any, stats: any) => {
  const type = String(rule?.type || '').trim();

  if (type === 'daily_approved_count') {
    const target = normalizeXp(rule?.count);
    return {
      current: normalizeXp(stats.dailyApprovedCount),
      target,
    };
  }

  if (type === 'daily_streak') {
    const target = normalizeXp(rule?.days);
    return {
      current: normalizeXp(stats.dailyStreak),
      target,
    };
  }

  if (type === 'challenge_difficulty_approved_count') {
    const difficulty = String(rule?.difficulty || '').trim();
    const target = normalizeXp(rule?.count);
    const current = normalizeXp(stats.challengeApprovedByDifficulty?.[difficulty]);
    return { current, target };
  }

  return null;
};

const getAchievementsForUser = async (userId: number, monthKey: string) => {
  const achievements = await strapi.db.query('api::achievement.achievement').findMany({
    populate: { icon: true },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    limit: 200,
  });

  const earned = await strapi.db.query('api::user-achievement.user-achievement').findMany({
    where: {
      user: { id: userId },
      periodKey: {
        $in: [monthKey, 'lifetime'],
      },
    },
    populate: {
      achievement: {
        populate: {
          icon: true,
        },
      },
    },
    orderBy: [{ earnedAt: 'desc' }],
    limit: 500,
  });

  const earnedByCode = new Map<string, any>();
  earned.forEach((entry: any) => {
    const code = String(entry.achievement?.code || '').trim();
    if (!code) {
      return;
    }
    if (!earnedByCode.has(code)) {
      earnedByCode.set(code, entry);
    }
  });

  const dailyStats = await getDailyMonthStats(userId, monthKey);
  const stats = {
    dailyApprovedCount: dailyStats.approvedCount,
    dailyStreak: dailyStats.streak,
    challengeApprovedByDifficulty: await getChallengeApprovedCountsByDifficulty(userId, monthKey),
  };

  return achievements.map((achievement: any) => {
    const scope = String(achievement.scope || 'monthly');
    const effectivePeriodKey = scope === 'lifetime' ? 'lifetime' : monthKey;
    const entry = earnedByCode.get(String(achievement.code || ''));
    const unlocked = Boolean(entry && String(entry.periodKey) === effectivePeriodKey);

    return {
      code: achievement.code,
      title: achievement.title,
      description: achievement.description || '',
      scope,
      icon: serializeMedia(achievement.icon),
      unlocked,
      earnedAt: unlocked ? entry.earnedAt : null,
      progress: unlocked ? null : ruleProgress(achievement.rule, stats),
    };
  });
};

const getMilestoneRewardsForUser = async (userId: number, monthKey: string) => {
  const rewards = await strapi.db.query('api::milestone-reward.milestone-reward').findMany({
    populate: { image: true },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    limit: 50,
  });

  if (!rewards.length) {
    return [];
  }

  const difficultyCounts = await getChallengeApprovedCountsByDifficulty(userId, monthKey);
  const hasDifficulty = (difficulty: string) => normalizeXp(difficultyCounts?.[difficulty]) > 0;

  const labelForDifficulties = (required: string[]) => required.filter(Boolean).join(' + ');

  return rewards.map((reward: any) => {
    const required = Array.isArray(reward.requiredDifficulties) ? reward.requiredDifficulties : [];
    const requiredList = required.map((value: any) => String(value || '').trim()).filter(Boolean);
    const unlocked = requiredList.length
      ? requiredList.every((difficulty) => hasDifficulty(difficulty))
      : false;

    return {
      code: reward.code,
      title: reward.title,
      description: reward.description || '',
      scope: reward.scope || 'monthly',
      image: serializeMedia(reward.image),
      unlocked,
      requirementsLabel: labelForDifficulties(requiredList),
      missing: unlocked ? [] : requiredList.filter((difficulty) => !hasDifficulty(difficulty)),
    };
  });
};

const getPendingDailyCheckinsForManager = async (user: any) => {
  const role = String(user?.globalRole || '').toLowerCase();

  if (role !== 'admin' && role !== 'project_manager') {
    return [];
  }

  let allowedUserIds: number[] | null = null;
  let managedTeamIds: number[] | null = null;

  if (role === 'project_manager') {
    managedTeamIds = await getManagedTeamIds(user);

    if (!managedTeamIds.length) {
      return [];
    }

    const memberLinks = await strapi.db.query('api::team-user.team-user').findMany({
      where: {
        team: {
          id: { $in: managedTeamIds },
        },
      },
      populate: { user: true },
      limit: 500,
    });

    allowedUserIds = Array.from(
      new Set(
        memberLinks
          .map((link: any) => link.user?.id)
          .filter((id: any) => typeof id === 'number'),
      ),
    );

    if (!allowedUserIds.length) {
      return [];
    }
  }

  const entries = await strapi.db.query('api::daily-checkin.daily-checkin').findMany({
    where: {
      status: 'pending',
      ...(allowedUserIds
        ? {
            user: {
              id: { $in: allowedUserIds },
            },
          }
        : {}),
    },
    populate: { user: true, team: true },
    orderBy: [{ day: 'desc' }, { id: 'desc' }],
    limit: 50,
  });

  return entries
    .filter((entry: any) => {
      if (!managedTeamIds) {
        return true;
      }

      if (entry.team?.id) {
        return managedTeamIds.includes(entry.team.id);
      }

      return allowedUserIds?.includes(entry.user?.id);
    })
    .map((entry: any) => ({
    id: entry.id,
    day: entry.day,
    status: entry.status,
    points: normalizeXp(entry.points),
    teamName: entry.team?.name || '',
    user: entry.user
      ? {
          id: entry.user.id,
          username: entry.user.username,
          email: entry.user.email,
        }
      : null,
  }));
};

const getManagedTeamUserIds = async (user: any) => {
  const role = String(user?.globalRole || '').toLowerCase();

  if (role === 'admin') {
    return null;
  }

  if (role !== 'project_manager') {
    return [];
  }

  const teamIds = await getManagedTeamIds(user);

  if (!teamIds.length) {
    return [];
  }

  const memberLinks = await strapi.db.query('api::team-user.team-user').findMany({
    where: {
      team: {
        id: { $in: teamIds },
      },
    },
    populate: { user: true },
    limit: 1000,
  });

  return Array.from(
    new Set(
      memberLinks
        .map((link: any) => link.user?.id)
        .filter((id: any) => typeof id === 'number'),
    ),
  );
};

const getTeamLabelsForEntries = async (entries: any[]) => {
  const labels = new Map<number, string>();

  entries.forEach((entry: any) => {
    if (entry.id && entry.team?.name) {
      labels.set(entry.id, entry.team.name);
    }
  });

  const userIds = entries
    .filter((entry: any) => entry.id && !labels.has(entry.id))
    .map((entry: any) => entry.user?.id)
    .filter(Boolean);

  if (!userIds.length) {
    return labels;
  }

  const links = await strapi.db.query('api::team-user.team-user').findMany({
    where: {
      user: {
        id: { $in: userIds },
      },
    },
    populate: {
      user: true,
      team: true,
      teamRole: true,
    },
    limit: 1000,
  });
  const userTeamLabels = new Map<number, string>();

  links.forEach((link: any) => {
    const userId = link.user?.id;

    if (!userId || userTeamLabels.has(userId)) {
      return;
    }

    userTeamLabels.set(userId, link.team?.name || '');
  });

  entries.forEach((entry: any) => {
    const userId = entry.user?.id;

    if (!entry.id || labels.has(entry.id) || !userId) {
      return;
    }

    labels.set(entry.id, userTeamLabels.get(userId) || '');
  });

  return labels;
};

const serializeReviewEntry = (entry: any, teamLabels: Map<number, string>) => ({
  id: entry.id,
  type: 'challenge',
  status: entry.status,
  submittedAt: entry.submittedAt,
  submissionText: entry.submissionText || '',
  submissionLinks: entry.submissionLinks || '',
  xpReward: normalizeXp(entry.challenge?.xpReward),
  user: entry.user
    ? {
        id: entry.user.id,
        username: entry.user.username,
        email: entry.user.email,
        avatar: serializeMedia(entry.user.avatar),
      }
    : null,
  teamName: teamLabels.get(entry.id) || '',
  challenge: entry.challenge ? serializeChallenge(entry.challenge) : null,
});

const canProjectManagerReviewEntry = async (manager: any, entry: any) => {
  const managedTeamIds = await getManagedTeamIds(manager);

  if (!Array.isArray(managedTeamIds) || !managedTeamIds.length) {
    return false;
  }

  if (entry.team?.id) {
    return managedTeamIds.includes(entry.team.id);
  }

  const managedUserIds = await getManagedTeamUserIds(manager);

  return (
    Array.isArray(managedUserIds) &&
    managedUserIds.includes(entry.user?.id) &&
    entry.user?.id !== manager.id
  );
};

const getShopExchangesForProjectManager = async (user: any) => {
  const managedTeamIds = await getManagedTeamIds(user);

  if (!Array.isArray(managedTeamIds) || !managedTeamIds.length) {
    return [];
  }

  const exchanges = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').findMany({
    where: {
      team: {
        id: { $in: managedTeamIds },
      },
    },
    populate: {
      user: true,
      team: true,
      shopCard: true,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    limit: 100,
  });

  return exchanges.map(serializeShopExchange);
};

const getShopCardVariant = (card: any, variantKey: string) => {
  const variants = Array.isArray(card?.variants) ? card.variants : [];

  if (!variants.length) {
    return null;
  }

  return variants.find((variant: any) => String(variant?.key || '') === variantKey) || null;
};

const applyChallengeApproval = async (entry: any, approverId: number) => {
  const reward = normalizeXp(entry.challenge?.xpReward);
  const nowIso = new Date().toISOString();

  if (reward > 0 && !entry.xpApplied && entry.user?.id) {
    const userXp = normalizeXp(entry.user.xp);
    await strapi.db.query(USER_UID).update({
      where: { id: entry.user.id },
      data: {
        xp: userXp + reward,
        lvl: calculateLevel(userXp + reward),
      },
    });
  }

  const updated = await strapi.db.query('api::user-challenge.user-challenge').update({
    where: { id: entry.id },
    data: {
      status: 'approved',
      approvedBy: approverId,
      completedAt: entry.completedAt || nowIso,
      xpApplied: true,
    },
    populate: {
      user: true,
      challenge: true,
    },
  });

  if (entry.user?.id) {
    await recomputeUserAchievements(entry.user.id, toMonthKey(formatMoscowDay(new Date())));
  }

  return updated;
};

export default {
  async currentWordy(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const wordy = await getCurrentWordyWord();
    const period = getWordlyPeriodKey(new Date());
    const periodKey = `${user.id}:${period}`;
    const existing = await strapi.db.query('api::wordly-play.wordly-play').findOne({
      where: { periodKey },
      populate: { word: true },
    });
    const play = serializeWordlyPlay(existing);
    const completed = play.completed;
    const stats = completed ? await getWordlyStats(wordy.id || null) : null;

    ctx.body = {
      wordy: {
        id: wordy.id,
        name: 'Wordly',
        length: Array.from(wordy.word).length,
        maxAttempts: WORDLY_MAX_ATTEMPTS,
        rewardXp: WORDLY_REWARD_XP,
        resetAt: new Date(getWordlyResetIso(period)).toISOString(),
      },
      play,
      completed,
      alreadyCompleted: completed,
      stats,
    };
  },

  async me(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    if (user.blocked) {
      ctx.body = {
        user: serializeUser(user),
        blockedMessage: 'Профиль заблокирован. Обратитесь к PM',
        primaryTeamId: user.primaryTeam?.id || null,
        requiresPrimaryTeam: false,
        primaryTeamMessage: '',
        teams: [],
        roles: [],
        availableChallenges: [],
        userChallenges: [],
        myChallenges: [],
        participantRating: [],
        shopCards: [],
        shopExchanges: [],
        shopExchangesForPm: [],
        daily: {
          today: null,
          monthStats: null,
          pendingForPm: [],
        },
        achievements: [],
        milestoneRewards: [],
      };
      return;
    }

    const today = formatMoscowDay(new Date());
    const monthKey = toMonthKey(today);
    const dailyToday = await getDailyToday(user.id, today);
    const monthStats = await getDailyMonthStats(user.id, monthKey);
    const teams = await getUserTeams(user.id);
    const primaryTeam = await getPrimaryTeamForUser(user);
    const primaryTeamId = primaryTeam?.id || null;

    ctx.body = {
      user: serializeUser(user),
      primaryTeamId,
      requiresPrimaryTeam: teams.length > 0 && !primaryTeamId,
      primaryTeamMessage: teams.length > 0 && !primaryTeamId ? 'Нужен выбор команды' : '',
      teams,
      roles: await getUserRoles(user.id),
      availableChallenges: await getAvailableChallenges(user.id),
      userChallenges: await getUserChallenges(user.id),
      myChallenges: await getUserChallenges(user.id),
      participantRating: await getParticipantRating(),
      shopCards: await getShopCards(user.id),
      shopExchanges: await getUserShopExchanges(user.id),
      shopExchangesForPm:
        String(user.globalRole || '').toLowerCase() === 'project_manager'
          ? await getShopExchangesForProjectManager(user)
          : [],
      daily: {
        today: dailyToday,
        monthStats,
        pendingForPm: await getPendingDailyCheckinsForManager(user),
      },
      achievements: await getAchievementsForUser(user.id, monthKey),
      milestoneRewards: await getMilestoneRewardsForUser(user.id, monthKey),
    };
  },

  async createShopExchange(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const primaryTeam = await requirePrimaryTeamForUser(user, ctx);

    if (!primaryTeam) {
      return;
    }

    const shopCardId = Number(ctx.request.body?.shopCardId);
    const variantKey = String(ctx.request.body?.variantKey || '').trim();

    if (!Number.isFinite(shopCardId) || shopCardId <= 0) {
      return ctx.badRequest('Нужно выбрать товар');
    }

    const card = await strapi.db.query('api::shop-card.shop-card').findOne({
      where: { id: shopCardId },
      populate: { photo: true },
    });

    if (!card) {
      return ctx.notFound('Товар не найден');
    }

    if (card.status !== 'available') {
      return ctx.badRequest('Товар недоступен');
    }

    const requirementStatus = await getShopCardRequirementStatus(user.id, card);

    if (!requirementStatus.eligible) {
      return ctx.badRequest(`Не выполнены условия: ${requirementStatus.missingDifficulties.join(', ')}`);
    }

    const variants = Array.isArray(card.variants) ? card.variants : [];
    const variant = variants.length ? getShopCardVariant(card, variantKey) : null;

    if (variants.length && !variant) {
      return ctx.badRequest('Нужно выбрать вариант товара');
    }

    const price = normalizeXp(card.price);
    const stock = normalizeXp(card.stock);
    const userXp = normalizeXp(user.xp);

    if (stock <= 0) {
      return ctx.badRequest('Товар закончился');
    }

    if (userXp < price) {
      return ctx.badRequest('Недостаточно XP для обмена');
    }

    await strapi.db.query(USER_UID).update({
      where: { id: user.id },
      data: {
        xp: userXp - price,
        lvl: calculateLevel(userXp - price),
      },
    });

    await strapi.db.query('api::shop-card.shop-card').update({
      where: { id: card.id },
      data: {
        stock: Math.max(0, stock - 1),
      },
    });

    const nowIso = new Date().toISOString();
    const exchange = await strapi.db.query('api::user-shop-exchange.user-shop-exchange').create({
      data: {
        user: user.id,
        team: primaryTeam.id,
        shopCard: card.id,
        itemName: card.name || 'Товар',
        variantKey: variant?.key || '',
        variantTitle: variant?.title || '',
        price,
        status: 'pending',
        statusUpdatedAt: nowIso,
      },
      populate: {
        user: true,
        team: true,
        shopCard: true,
      },
    });

    ctx.body = {
      exchange: serializeShopExchange(exchange),
      user: {
        xp: userXp - price,
        lvl: calculateLevel(userXp - price),
      },
    };
  },

  async completeWordy(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const answer = normalizeWordlyGuess(ctx.request.body?.answer);
    const wordy = await getCurrentWordyWord();
    const normalizedWord = normalizeWordlyGuess(wordy.word);
    const wordId = wordy.id || null;
    const period = getWordlyPeriodKey(new Date());
    const periodKey = `${user.id}:${period}`;

    if (!answer) {
      return ctx.badRequest('Введи слово');
    }

    if (Array.from(answer).length !== Array.from(normalizedWord).length) {
      return ctx.badRequest(`Нужно слово из ${Array.from(normalizedWord).length} букв`);
    }

    const existing = await strapi.db.query('api::wordly-play.wordly-play').findOne({
      where: { periodKey },
      populate: { word: true },
    });
    const currentAttempts = Array.isArray(existing?.attempts) ? existing.attempts : [];

    if (existing?.status === 'won' || existing?.status === 'lost') {
      ctx.body = {
        ok: true,
        alreadyCompleted: true,
        wordy: {
          name: 'Wordly',
          length: Array.from(normalizedWord).length,
          maxAttempts: WORDLY_MAX_ATTEMPTS,
          rewardXp: WORDLY_REWARD_XP,
          resetAt: new Date(getWordlyResetIso(period)).toISOString(),
        },
        play: serializeWordlyPlay(existing),
        stats: await getWordlyStats(wordId),
      };
      return;
    }

    if (currentAttempts.length >= WORDLY_MAX_ATTEMPTS) {
      ctx.body = {
        ok: true,
        alreadyCompleted: true,
        play: serializeWordlyPlay(existing),
        stats: await getWordlyStats(wordId),
      };
      return;
    }

    const evaluation = evaluateWordlyGuess(answer, normalizedWord);
    const attempt = {
      guess: answer,
      evaluation,
    };
    const nextAttempts = [...currentAttempts, attempt];
    const won = answer === normalizedWord;
    const lost = !won && nextAttempts.length >= WORDLY_MAX_ATTEMPTS;
    const status = won ? 'won' : lost ? 'lost' : 'in_progress';
    const nowIso = new Date().toISOString();
    const data = {
      user: user.id,
      word: wordId,
      periodKey,
      status,
      attempts: nextAttempts,
      completedAt: status === 'in_progress' ? null : nowIso,
      xpApplied: won,
    };

    const play = existing
      ? await strapi.db.query('api::wordly-play.wordly-play').update({
          where: { id: existing.id },
          data,
        })
      : await strapi.db.query('api::wordly-play.wordly-play').create({ data });
    let updatedUser = user;

    if (won) {
      const currentXp = normalizeXp(user.xp);
      const nextXp = currentXp + WORDLY_REWARD_XP;

      updatedUser = await strapi.db.query(USER_UID).update({
        where: { id: user.id },
        data: {
          xp: nextXp,
          lvl: calculateLevel(nextXp),
        },
        populate: {
          avatar: true,
          role: true,
          primaryTeam: true,
        },
      });

      await recomputeUserAchievements(user.id, toMonthKey(formatMoscowDay(new Date())));
    }

    const completed = status === 'won' || status === 'lost';

    ctx.body = {
      ok: true,
      wordy: {
        name: 'Wordly',
        length: Array.from(normalizedWord).length,
        maxAttempts: WORDLY_MAX_ATTEMPTS,
        rewardXp: WORDLY_REWARD_XP,
        resetAt: new Date(getWordlyResetIso(period)).toISOString(),
      },
      play: serializeWordlyPlay(play),
      completed,
      won,
      stats: completed ? await getWordlyStats(wordId) : null,
      user: serializeUser(updatedUser),
    };
  },

  async updatePrimaryTeam(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const teamId = Number(ctx.request.body?.teamId);

    if (!Number.isFinite(teamId) || teamId <= 0) {
      return ctx.badRequest('Нужно выбрать команду');
    }

    const membership = await strapi.db.query('api::team-user.team-user').findOne({
      where: {
        user: { id: user.id },
        team: { id: teamId },
      },
      populate: { team: true },
    });

    if (!membership?.team?.id) {
      return ctx.forbidden('Пользователь не состоит в этой команде');
    }

    await strapi.db.query(USER_UID).update({
      where: { id: user.id },
      data: { primaryTeam: teamId },
    });

    ctx.body = {
      ok: true,
      primaryTeamId: teamId,
    };
  },

  async updateStatus(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const statusEmoji = String(ctx.request.body?.statusEmoji || '').trim();
    const statusText = String(ctx.request.body?.statusText || '').trim();

    if (!isSingleEmoji(statusEmoji)) {
      return ctx.badRequest('Нужно указать ровно 1 смайл');
    }

    if (!statusText) {
      return ctx.badRequest('Нужно указать текст статуса');
    }

    if (statusText.length > 48) {
      return ctx.badRequest('Текст статуса должен быть не длиннее 48 символов');
    }

    await strapi.db.query(USER_UID).update({
      where: { id: user.id },
      data: {
        statusEmoji,
        statusText,
      },
    });

    const updatedUser = await strapi.db.query(USER_UID).findOne({
      where: { id: user.id },
      populate: {
        avatar: true,
        role: true,
      },
    });

    ctx.body = {
      user: serializeUser(updatedUser),
    };
  },

  async updateAvatar(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const avatarFile = getSingleFile(ctx.request.files, 'avatar');
    const mime = avatarFile?.mimetype || avatarFile?.type || avatarFile?.mime;

    if (!avatarFile) {
      return ctx.badRequest('Нужно загрузить аватарку');
    }

    if (!String(mime || '').startsWith('image/')) {
      return ctx.badRequest('Аватарка должна быть изображением');
    }

    await strapi.plugin('upload').service('upload').upload({
      data: {
        refId: user.id,
        ref: USER_UID,
        field: 'avatar',
      },
      files: avatarFile,
    });

    const updatedUser = await strapi.db.query(USER_UID).findOne({
      where: { id: user.id },
      populate: {
        avatar: true,
        role: true,
      },
    });

    ctx.body = {
      user: serializeUser(updatedUser),
    };
  },

  async updatePassword(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const password = String(ctx.request.body?.password || '');
    const passwordConfirmation = String(ctx.request.body?.passwordConfirmation || '');

    if (!password || !passwordConfirmation) {
      return ctx.badRequest('Заполни все поля');
    }

    if (password !== passwordConfirmation) {
      return ctx.badRequest('Новый пароль и повтор не совпадают');
    }

    if (password.length < 6) {
      return ctx.badRequest('Пароль должен быть не короче 6 символов');
    }

    await strapi.plugin('users-permissions').service('user').edit(user.id, {
      password,
      mustChangePassword: false,
      temporaryPasswordIssuedAt: null,
    });

    ctx.body = { ok: true };
  },

  async acceptChallenge(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const challengeId = Number(ctx.params.id || ctx.request.body?.challengeId);

    if (!Number.isFinite(challengeId) || challengeId <= 0) {
      return ctx.badRequest('Нужно указать челлендж');
    }

    const challenge = await strapi.db.query('api::challenge.challenge').findOne({
      where: { id: challengeId },
      populate: { mentionedUsers: true },
    });

    if (!challenge) {
      return ctx.notFound('Челлендж не найден');
    }

    const isAllowed =
      challenge.visibility === 'public' ||
      (challenge.mentionedUsers || []).some((mentionedUser: any) => mentionedUser.id === user.id);

    if (!isAllowed) {
      return ctx.forbidden('Этот челлендж не назначен пользователю');
    }

    const existing = await strapi.db.query('api::user-challenge.user-challenge').findOne({
      where: {
        user: { id: user.id },
        challenge: { id: challenge.id },
      },
      populate: { challenge: true, team: true },
    });
    const primaryTeam = await getPrimaryTeamForUser(user);

    const entry =
      existing ||
      (await strapi.db.query('api::user-challenge.user-challenge').create({
        data: {
          user: user.id,
          challenge: challenge.id,
          status: 'pending',
          ...(primaryTeam?.id ? { team: primaryTeam.id } : {}),
        },
        populate: { challenge: true, team: true },
      }));

    ctx.body = {
      userChallenge: {
        id: entry.id,
        status: entry.status,
        submittedAt: entry.submittedAt,
        submissionText: entry.submissionText || '',
        submissionLinks: entry.submissionLinks || '',
        completedAt: entry.completedAt,
        challenge: entry.challenge ? serializeChallenge(entry.challenge) : serializeChallenge(challenge),
      },
    };
  },

  async submitChallenge(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const userChallengeId = Number(ctx.request.body?.userChallengeId);
    const challengeId = Number(ctx.request.body?.challengeId);
    const submissionText = String(ctx.request.body?.submissionText || '').trim();
    const submissionLinks = String(ctx.request.body?.submissionLinks || '').trim();
    const primaryTeam = await requirePrimaryTeamForUser(user, ctx);

    if (!primaryTeam) {
      return;
    }

    if (
      (!Number.isFinite(userChallengeId) || userChallengeId <= 0) &&
      (!Number.isFinite(challengeId) || challengeId <= 0)
    ) {
      return ctx.badRequest('Нужно указать челлендж');
    }

    let entry = null;

    if (Number.isFinite(userChallengeId) && userChallengeId > 0) {
      entry = await strapi.db.query('api::user-challenge.user-challenge').findOne({
        where: {
          id: userChallengeId,
          user: {
            id: user.id,
          },
        },
        populate: {
          challenge: true,
          team: true,
        },
      });
    }

    if (!entry && Number.isFinite(challengeId) && challengeId > 0) {
      const challenge = await strapi.db.query('api::challenge.challenge').findOne({
        where: { id: challengeId },
        populate: { mentionedUsers: true },
      });

      if (!challenge) {
        return ctx.notFound('Челлендж не найден');
      }

      const isAllowed =
        challenge.visibility === 'public' ||
        (challenge.mentionedUsers || []).some((mentionedUser: any) => mentionedUser.id === user.id);

      if (!isAllowed) {
        return ctx.forbidden('Этот челлендж не назначен пользователю');
      }

      entry = await strapi.db.query('api::user-challenge.user-challenge').findOne({
        where: {
          user: { id: user.id },
          challenge: { id: challenge.id },
        },
        populate: { challenge: true, team: true },
      });

      if (!entry) {
        entry = await strapi.db.query('api::user-challenge.user-challenge').create({
          data: {
            user: user.id,
            challenge: challenge.id,
            status: 'pending',
            team: primaryTeam.id,
          },
          populate: { challenge: true, team: true },
        });
      }
    }

    if (!entry) {
      return ctx.notFound('Челлендж не найден');
    }

    const shouldAutoApprove = String(user.globalRole || '').toLowerCase() === 'project_manager';
    const updatedEntry = await strapi.db.query('api::user-challenge.user-challenge').update({
      where: { id: entry.id },
      data: {
        status: shouldAutoApprove ? 'approved' : 'pending',
        submittedAt: new Date().toISOString(),
        submissionText,
        submissionLinks,
        team: primaryTeam.id,
        ...(shouldAutoApprove
          ? {
              approvedBy: user.id,
              completedAt: new Date().toISOString(),
            }
          : {}),
      },
      populate: {
        user: true,
        challenge: true,
        team: true,
      },
    });

    if (shouldAutoApprove) {
      await applyChallengeApproval(updatedEntry, user.id);
    }

    ctx.body = {
      userChallenge: {
        id: updatedEntry.id,
        status: shouldAutoApprove ? 'approved' : updatedEntry.status,
        submittedAt: updatedEntry.submittedAt,
        submissionText: updatedEntry.submissionText || '',
        submissionLinks: updatedEntry.submissionLinks || '',
        completedAt: shouldAutoApprove ? new Date().toISOString() : updatedEntry.completedAt,
        challenge: updatedEntry.challenge ? serializeChallenge(updatedEntry.challenge) : null,
      },
    };
  },

  async reviewQueue(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const role = String(user.globalRole || '').toLowerCase();

    if (role !== 'admin' && role !== 'project_manager') {
      return ctx.forbidden('Нет прав');
    }

    const managedUserIds = await getManagedTeamUserIds(user);

    if (Array.isArray(managedUserIds) && !managedUserIds.length) {
      ctx.body = { items: [] };
      return;
    }

    const managedTeamIds = await getManagedTeamIds(user);
    const entries = await strapi.db.query('api::user-challenge.user-challenge').findMany({
      where: {
        status: 'pending',
        ...(Array.isArray(managedUserIds)
          ? {
              user: {
                id: { $in: managedUserIds.filter((id) => id !== user.id) },
              },
            }
          : {}),
      },
      populate: {
        user: {
          populate: {
            avatar: true,
          },
        },
        challenge: true,
        team: true,
      },
      orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
      limit: 100,
    });
    const submittedEntries = entries.filter((entry: any) => {
      if (!entry.submittedAt) {
        return false;
      }

      if (!Array.isArray(managedTeamIds)) {
        return true;
      }

      if (entry.team?.id) {
        return managedTeamIds.includes(entry.team.id);
      }

      return managedUserIds.includes(entry.user?.id);
    });
    const teamLabels = await getTeamLabelsForEntries(submittedEntries);

    ctx.body = {
      items: submittedEntries.map((entry: any) => serializeReviewEntry(entry, teamLabels)),
    };
  },

  async approveReview(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const role = String(user.globalRole || '').toLowerCase();

    if (role !== 'admin' && role !== 'project_manager') {
      return ctx.forbidden('Нет прав');
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверная проверка');
    }

    const entry = await strapi.db.query('api::user-challenge.user-challenge').findOne({
      where: { id },
      populate: {
        user: true,
        challenge: true,
        team: true,
      },
    });

    if (!entry) {
      return ctx.notFound('Проверка не найдена');
    }

    if (role === 'project_manager') {
      if (!(await canProjectManagerReviewEntry(user, entry))) {
        return ctx.forbidden('Нет прав');
      }
    }

    await applyChallengeApproval(entry, user.id);

    ctx.body = { ok: true };
  },

  async rejectReview(ctx: any) {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return;
    }

    const role = String(user.globalRole || '').toLowerCase();

    if (role !== 'admin' && role !== 'project_manager') {
      return ctx.forbidden('Нет прав');
    }

    const id = Number(ctx.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return ctx.badRequest('Неверная проверка');
    }

    const entry = await strapi.db.query('api::user-challenge.user-challenge').findOne({
      where: { id },
      populate: {
        user: true,
        team: true,
      },
    });

    if (!entry) {
      return ctx.notFound('Проверка не найдена');
    }

    if (role === 'project_manager') {
      if (!(await canProjectManagerReviewEntry(user, entry))) {
        return ctx.forbidden('Нет прав');
      }
    }

    await strapi.db.query('api::user-challenge.user-challenge').update({
      where: { id },
      data: {
        status: 'rejected',
      },
    });

    ctx.body = { ok: true };
  },
};
