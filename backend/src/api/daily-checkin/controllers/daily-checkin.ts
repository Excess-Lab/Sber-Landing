/**
 * daily-checkin controller
 */

import { recomputeUserAchievements } from '../../../services/gamification';

const USER_UID = 'plugin::users-permissions.user';

const normalizeXp = (value: unknown) => {
  const xp = Number(value);

  return Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
};

const calculateLevel = (value: unknown) => Math.floor(normalizeXp(value) / 50) + 1;

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
    populate: { primaryTeam: true },
  });

  if (!user) {
    ctx.unauthorized('Пользователь не найден');
    return null;
  }

  return user;
};

const formatMoscowDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const toMonthKey = (day: string) => day.slice(0, 7);

const assertManager = (user: any, ctx: any) => {
  const role = String(user?.globalRole || '').toLowerCase();
  if (role === 'admin' || role === 'project_manager') {
    return true;
  }
  ctx.forbidden('Нет прав');
  return false;
};

const getPmTeamUserIds = async (pmUserId: number) => {
  const teamLinks = await strapi.db.query('api::team-user.team-user').findMany({
    where: { user: { id: pmUserId } },
    populate: { team: true },
    limit: 24,
  });
  const teamIds = teamLinks.map((link: any) => link.team?.id).filter(Boolean);

  if (!teamIds.length) {
    return [];
  }

  const memberLinks = await strapi.db.query('api::team-user.team-user').findMany({
    where: {
      team: {
        id: {
          $in: teamIds,
        },
      },
    },
    populate: { user: true },
    limit: 500,
  });

  return Array.from(
    new Set(
      memberLinks
        .map((link: any) => link.user?.id)
        .filter((id: any) => typeof id === 'number'),
    ),
  );
};

const getPmTeamIds = async (pmUserId: number) => {
  const teamLinks = await strapi.db.query('api::team-user.team-user').findMany({
    where: { user: { id: pmUserId } },
    populate: { team: true },
    limit: 24,
  });

  return Array.from(
    new Set(
      teamLinks
        .map((link: any) => link.team?.id)
        .filter((id: any) => typeof id === 'number'),
    ),
  );
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

  ctx.badRequest('Выбери основную команду перед отправкой дейлика');
  return null;
};

const canProjectManagerReviewEntry = async (approver: any, entry: any) => {
  const teamIds = await getPmTeamIds(approver.id);

  if (!teamIds.length) {
    return false;
  }

  if (entry.team?.id) {
    return teamIds.includes(entry.team.id);
  }

  const allowedUserIds = await getPmTeamUserIds(approver.id);
  return allowedUserIds.includes(entry.user?.id);
};

const serializePending = (entry: any) => ({
  id: entry.id,
  day: entry.day,
  status: entry.status,
  points: entry.points ?? 0,
  user: entry.user
    ? {
        id: entry.user.id,
        username: entry.user.username,
        email: entry.user.email,
      }
    : null,
  teamName: entry.team?.name || '',
});

export default {
  async checkin(ctx: any) {
    const user = await findCurrentUser(ctx);
    if (!user) return;
    const primaryTeam = await requirePrimaryTeamForUser(user, ctx);
    if (!primaryTeam) return;

    const day = formatMoscowDay(new Date());
    const dayKey = `${user.id}:${day}`;

    const existing = await strapi.db.query('api::daily-checkin.daily-checkin').findOne({
      where: { dayKey },
    });

    if (existing) {
      ctx.body = { ok: true, checkin: existing };
      return;
    }

    const created = await strapi.db.query('api::daily-checkin.daily-checkin').create({
      data: {
        user: user.id,
        team: primaryTeam.id,
        day,
        dayKey,
        status: 'pending',
        points: 10,
      },
    });

    ctx.body = { ok: true, checkin: created };
  },

  async pending(ctx: any) {
    const user = await findCurrentUser(ctx);
    if (!user) return;
    if (!assertManager(user, ctx)) return;

    const role = String(user.globalRole || '').toLowerCase();
    let allowedUserIds: number[] | null = null;
    let managedTeamIds: number[] | null = null;

    if (role === 'project_manager') {
      allowedUserIds = await getPmTeamUserIds(user.id);
      managedTeamIds = await getPmTeamIds(user.id);
      if (!allowedUserIds.length || !managedTeamIds.length) {
        ctx.body = { items: [] };
        return;
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
      populate: {
        user: true,
        team: true,
      },
      orderBy: [{ day: 'desc' }, { id: 'desc' }],
      limit: 50,
    });

    ctx.body = {
      items: entries
        .filter((entry: any) => {
          if (!managedTeamIds) {
            return true;
          }

          if (entry.team?.id) {
            return managedTeamIds.includes(entry.team.id);
          }

          return allowedUserIds?.includes(entry.user?.id);
        })
        .map(serializePending),
    };
  },

  async approve(ctx: any) {
    const approver = await findCurrentUser(ctx);
    if (!approver) return;
    if (!assertManager(approver, ctx)) return;

    const id = Number(ctx.params?.id);
    if (!Number.isFinite(id)) {
      ctx.badRequest('Неверный id');
      return;
    }

    const entry = await strapi.db.query('api::daily-checkin.daily-checkin').findOne({
      where: { id },
      populate: { user: true, team: true },
    });

    if (!entry) {
      ctx.notFound('Не найдено');
      return;
    }

    const role = String(approver.globalRole || '').toLowerCase();
    if (role === 'project_manager') {
      if (!(await canProjectManagerReviewEntry(approver, entry))) {
        ctx.forbidden('Нет прав');
        return;
      }
    }

    if (entry.status === 'approved') {
      ctx.body = { ok: true };
      return;
    }

    const nowIso = new Date().toISOString();

    await strapi.db.query('api::daily-checkin.daily-checkin').update({
      where: { id: entry.id },
      data: {
        status: 'approved',
        approvedBy: approver.id,
        approvedAt: nowIso,
      },
    });

    await recomputeUserAchievements(entry.user.id, toMonthKey(entry.day));
    ctx.body = { ok: true };
  },

  async reject(ctx: any) {
    const approver = await findCurrentUser(ctx);
    if (!approver) return;
    if (!assertManager(approver, ctx)) return;

    const id = Number(ctx.params?.id);
    if (!Number.isFinite(id)) {
      ctx.badRequest('Неверный id');
      return;
    }

    const entry = await strapi.db.query('api::daily-checkin.daily-checkin').findOne({
      where: { id },
      populate: { user: true, team: true },
    });

    if (!entry) {
      ctx.notFound('Не найдено');
      return;
    }

    const role = String(approver.globalRole || '').toLowerCase();
    if (role === 'project_manager') {
      if (!(await canProjectManagerReviewEntry(approver, entry))) {
        ctx.forbidden('Нет прав');
        return;
      }
    }

    await strapi.db.query('api::daily-checkin.daily-checkin').update({
      where: { id: entry.id },
      data: {
        status: 'rejected',
        approvedBy: approver.id,
        approvedAt: new Date().toISOString(),
      },
    });

    ctx.body = { ok: true };
  },
};
