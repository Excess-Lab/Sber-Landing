const USER_UID = 'plugin::users-permissions.user';

const normalizeXp = (value: unknown) => {
  const xp = Number(value);

  return Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
};

const toMonthRange = (periodKey: string) => {
  if (periodKey === 'lifetime') {
    return null;
  }

  const [yearRaw, monthRaw] = String(periodKey || '').split('-');
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
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    startIso: startMoscow.toISOString(),
    endIso: endMoscow.toISOString(),
  };
};

const formatMoscowDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const getDailyApprovedCount = async (userId: number, periodKey: string) => {
  const range = toMonthRange(periodKey);

  const where: any = {
    user: { id: userId },
    status: 'approved',
  };

  if (range) {
    where.day = {
      $gte: range.start,
      $lt: range.end,
    };
  }

  const entries = await strapi.db.query('api::daily-checkin.daily-checkin').findMany({
    where,
    select: ['day'],
    limit: 1000,
  });

  return entries.length;
};

const getDailyStreak = async (userId: number, periodKey: string) => {
  const range = toMonthRange(periodKey);

  const where: any = {
    user: { id: userId },
    status: 'approved',
  };

  if (range) {
    where.day = {
      $gte: range.start,
      $lt: range.end,
    };
  }

  const entries = await strapi.db.query('api::daily-checkin.daily-checkin').findMany({
    where,
    select: ['day'],
    orderBy: [{ day: 'desc' }],
    limit: 1000,
  });

  const approvedDays = new Set(entries.map((e: any) => String(e.day)));
  if (!approvedDays.size) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();

  while (true) {
    const day = formatMoscowDay(cursor);
    if (!approvedDays.has(day)) {
      break;
    }
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);

    if (range && day < range.start) {
      break;
    }
  }

  return streak;
};

const getChallengeApprovedCountsByDifficulty = async (userId: number, periodKey: string) => {
  const range = toMonthRange(periodKey);

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
};

const matchesRule = (rule: any, stats: any) => {
  const type = String(rule?.type || '').trim();

  if (type === 'daily_approved_count') {
    const count = normalizeXp(rule?.count);
    return stats.dailyApprovedCount >= count;
  }

  if (type === 'daily_streak') {
    const days = normalizeXp(rule?.days);
    return stats.dailyStreak >= days;
  }

  if (type === 'challenge_difficulty_approved_count') {
    const difficulty = String(rule?.difficulty || '').trim();
    const count = normalizeXp(rule?.count);
    const actual = normalizeXp(stats.challengeApprovedByDifficulty?.[difficulty]);
    return actual >= count;
  }

  return false;
};

export const recomputeUserAchievements = async (userId: number, periodKey: string) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    return;
  }

  const achievements = await strapi.db.query('api::achievement.achievement').findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    limit: 200,
  });

  if (!achievements.length) {
    return;
  }

  const challengeApprovedByDifficulty = await getChallengeApprovedCountsByDifficulty(userId, periodKey);

  const stats = {
    dailyApprovedCount: await getDailyApprovedCount(userId, periodKey),
    dailyStreak: await getDailyStreak(userId, periodKey),
    challengeApprovedByDifficulty,
  };

  for (const achievement of achievements) {
    const scope = String(achievement.scope || 'monthly');
    const effectivePeriodKey = scope === 'lifetime' ? 'lifetime' : periodKey;
    const uniqueKey = `${userId}:${achievement.code}:${effectivePeriodKey}`;

    const already = await strapi.db.query('api::user-achievement.user-achievement').findOne({
      where: { uniqueKey },
      select: ['id'],
    });

    if (already) {
      continue;
    }

    if (!matchesRule(achievement.rule, stats)) {
      continue;
    }

    await strapi.db.query('api::user-achievement.user-achievement').create({
      data: {
        user: userId,
        achievement: achievement.id,
        periodKey: effectivePeriodKey,
        earnedAt: new Date().toISOString(),
        uniqueKey,
      },
    });
  }
};
