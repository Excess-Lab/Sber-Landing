import { LitElement, html } from 'lit';

const adminSections = [
  { key: 'overview', label: 'Обзор' },
  { key: 'users', label: 'Пользователи' },
  { key: 'teams', label: 'Команды' },
  { key: 'challenges', label: 'Челленджи' },
  { key: 'achievements', label: 'Достижения' },
  { key: 'shop', label: 'Магазин' },
];

const defaultAchievementForm = {
  code: '',
  title: '',
  description: '',
  scope: 'monthly',
  sort: 0,
  ruleType: 'daily_approved_count',
  count: 1,
  difficulty: 'Light',
};

const defaultChallengeForm = {
  title: '',
  description: '',
  difficulty: 'Light',
  xpReward: 50,
  deadline: '',
  visibility: 'public',
};

class AdminPage extends LitElement {
  static properties = {
    activeSection: { state: true },
    loading: { state: true },
    saving: { state: true },
    error: { state: true },
    success: { state: true },
    dashboard: { state: true },
    achievementForm: { state: true },
    challengeForm: { state: true },
    teamName: { state: true },
    teamColor: { state: true },
    assignUserId: { state: true },
    assignTeamId: { state: true },
    assignRoleName: { state: true },
    aiIdea: { state: true },
  };

  constructor() {
    super();
    this.apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.activeSection = 'overview';
    this.loading = false;
    this.saving = false;
    this.error = '';
    this.success = '';
    this.dashboard = {
      users: [],
      teams: [],
      teamUsers: [],
      challenges: [],
      achievements: [],
      shopCards: [],
    };
    this.achievementForm = { ...defaultAchievementForm };
    this.challengeForm = { ...defaultChallengeForm };
    this.teamName = '';
    this.teamColor = '#69d8ff';
    this.assignUserId = '';
    this.assignTeamId = '';
    this.assignRoleName = 'Участник';
    this.aiIdea = '';
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Админ кабинет';
    this.fetchDashboard();
  }

  createRenderRoot() {
    return this;
  }

  getAuthToken() {
    return window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt') || '';
  }

  async requestApi(path, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Запрос не выполнен');
    }

    return data;
  }

  async fetchDashboard() {
    this.loading = true;
    this.error = '';

    try {
      const data = await this.requestApi('/api/admin/dashboard');
      this.dashboard = {
        users: Array.isArray(data.users) ? data.users : [],
        teams: Array.isArray(data.teams) ? data.teams : [],
        teamUsers: Array.isArray(data.teamUsers) ? data.teamUsers : [],
        challenges: Array.isArray(data.challenges) ? data.challenges : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        shopCards: Array.isArray(data.shopCards) ? data.shopCards : [],
      };
    } catch (error) {
      this.error = error.message || 'Не удалось загрузить админку';
    } finally {
      this.loading = false;
    }
  }

  setAchievementField(field, value) {
    this.achievementForm = {
      ...this.achievementForm,
      [field]: value,
    };
  }

  setChallengeField(field, value) {
    this.challengeForm = {
      ...this.challengeForm,
      [field]: value,
    };
  }

  async runMutation(callback, successMessage) {
    if (this.saving) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    try {
      await callback();
      this.success = successMessage;
      await this.fetchDashboard();
    } catch (error) {
      this.error = error.message || 'Не удалось сохранить';
    } finally {
      this.saving = false;
    }
  }

  createAchievement(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/achievements', {
        method: 'POST',
        body: JSON.stringify(this.achievementForm),
      });
      this.achievementForm = { ...defaultAchievementForm };
    }, 'Достижение сохранено');
  }

  generateAchievement(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      const data = await this.requestApi('/api/admin/achievements/generate', {
        method: 'POST',
        body: JSON.stringify({ idea: this.aiIdea }),
      });
      this.achievementForm = {
        ...this.achievementForm,
        ...(data.draft || {}),
      };
    }, 'Черновик от ИИ загружен в форму');
  }

  createChallenge(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/challenges', {
        method: 'POST',
        body: JSON.stringify(this.challengeForm),
      });
      this.challengeForm = { ...defaultChallengeForm };
    }, 'Челлендж создан');
  }

  createTeam(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: this.teamName,
          color: this.teamColor,
        }),
      });
      this.teamName = '';
      this.teamColor = '#69d8ff';
    }, 'Команда сохранена');
  }

  assignTeamUser(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/team-users', {
        method: 'POST',
        body: JSON.stringify({
          userId: this.assignUserId,
          teamId: this.assignTeamId,
          roleName: this.assignRoleName,
        }),
      });
    }, 'Участник добавлен в команду');
  }

  updateUser(user, data) {
    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      'Пользователь обновлен',
    );
  }

  logout() {
    window.localStorage.removeItem('auth.jwt');
    window.localStorage.removeItem('auth.user');
    window.sessionStorage.removeItem('auth.jwt');
    window.sessionStorage.removeItem('auth.user');
    window.location.assign('/admin');
  }

  renderOverview() {
    const { users, teams, challenges, achievements, shopCards } = this.dashboard;

    return html`
      <div class="admin-stat-grid">
        <article><span>Пользователи</span><strong>${users.length}</strong></article>
        <article><span>Команды</span><strong>${teams.length}</strong></article>
        <article><span>Челленджи</span><strong>${challenges.length}</strong></article>
        <article><span>Достижения</span><strong>${achievements.length}</strong></article>
        <article><span>Магазин</span><strong>${shopCards.length}</strong></article>
      </div>
    `;
  }

  renderUsers() {
    return html`
      <div class="admin-table">
        ${this.dashboard.users.map(
          (user) => html`
            <div class="admin-table-row">
              <div>
                <strong>${user.username || user.email}</strong>
                <span>${user.email} · ${user.xp} XP · lvl ${user.lvl}</span>
              </div>
              <select
                .value=${user.globalRole}
                @change=${(event) => this.updateUser(user, { globalRole: event.currentTarget.value })}
              >
                <option value="worker">worker</option>
                <option value="project_manager">project_manager</option>
                <option value="admin">admin</option>
              </select>
              <button type="button" @click=${() => this.updateUser(user, { blocked: !user.blocked })}>
                ${user.blocked ? 'Разблокировать' : 'Заблокировать'}
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }

  renderTeams() {
    return html`
      <form class="admin-form" @submit=${(event) => this.createTeam(event)}>
        <input
          placeholder="Название команды"
          .value=${this.teamName}
          @input=${(event) => {
            this.teamName = event.currentTarget.value;
          }}
        />
        <input
          placeholder="#69d8ff"
          .value=${this.teamColor}
          @input=${(event) => {
            this.teamColor = event.currentTarget.value;
          }}
        />
        <button type="submit" ?disabled=${this.saving}>Создать команду</button>
      </form>

      <form class="admin-form" @submit=${(event) => this.assignTeamUser(event)}>
        <select
          .value=${this.assignUserId}
          @change=${(event) => {
            this.assignUserId = event.currentTarget.value;
          }}
        >
          <option value="">Пользователь</option>
          ${this.dashboard.users.map((user) => html`<option value=${user.id}>${user.username || user.email}</option>`)}
        </select>
        <select
          .value=${this.assignTeamId}
          @change=${(event) => {
            this.assignTeamId = event.currentTarget.value;
          }}
        >
          <option value="">Команда</option>
          ${this.dashboard.teams.map((team) => html`<option value=${team.id}>${team.name}</option>`)}
        </select>
        <select
          .value=${this.assignRoleName}
          @change=${(event) => {
            this.assignRoleName = event.currentTarget.value;
          }}
        >
          <option value="Участник">Участник</option>
          <option value="Проектный менеджер">Проектный менеджер</option>
        </select>
        <button type="submit" ?disabled=${this.saving}>Добавить</button>
      </form>

      <div class="admin-card-grid">
        ${this.dashboard.teams.map(
          (team) => html`
            <article>
              <span style=${`--team-color: ${team.color || '#b559f3'};`}></span>
              <strong>${team.name}</strong>
              <p>${team.memberCount} участников</p>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderChallenges() {
    return html`
      <form class="admin-form is-wide" @submit=${(event) => this.createChallenge(event)}>
        <input
          placeholder="Название"
          .value=${this.challengeForm.title}
          @input=${(event) => this.setChallengeField('title', event.currentTarget.value)}
        />
        <textarea
          placeholder="Описание"
          .value=${this.challengeForm.description}
          @input=${(event) => this.setChallengeField('description', event.currentTarget.value)}
        ></textarea>
        <select
          .value=${this.challengeForm.difficulty}
          @change=${(event) => this.setChallengeField('difficulty', event.currentTarget.value)}
        >
          <option value="Light">Light</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <input
          type="number"
          min="0"
          placeholder="XP"
          .value=${String(this.challengeForm.xpReward)}
          @input=${(event) => this.setChallengeField('xpReward', Number(event.currentTarget.value))}
        />
        <input
          type="datetime-local"
          .value=${this.challengeForm.deadline}
          @input=${(event) => this.setChallengeField('deadline', event.currentTarget.value)}
        />
        <select
          .value=${this.challengeForm.visibility}
          @change=${(event) => this.setChallengeField('visibility', event.currentTarget.value)}
        >
          <option value="public">Открытый</option>
          <option value="private">Личный</option>
        </select>
        <button type="submit" ?disabled=${this.saving}>Создать челлендж</button>
      </form>

      <div class="admin-list">
        ${this.dashboard.challenges.map(
          (challenge) => html`
            <article>
              <strong>${challenge.title}</strong>
              <span>${challenge.difficulty} · ${challenge.xpReward} XP · ${challenge.visibility}</span>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderAchievements() {
    return html`
      <form class="admin-form is-ai" @submit=${(event) => this.generateAchievement(event)}>
        <input
          placeholder="Идея для ИИ: например, серия дейликов за неделю"
          .value=${this.aiIdea}
          @input=${(event) => {
            this.aiIdea = event.currentTarget.value;
          }}
        />
        <button type="submit" ?disabled=${this.saving}>Сгенерировать через ИИ</button>
      </form>

      <form class="admin-form is-wide" @submit=${(event) => this.createAchievement(event)}>
        <input
          placeholder="code"
          .value=${this.achievementForm.code}
          @input=${(event) => this.setAchievementField('code', event.currentTarget.value)}
        />
        <input
          placeholder="Название"
          .value=${this.achievementForm.title}
          @input=${(event) => this.setAchievementField('title', event.currentTarget.value)}
        />
        <textarea
          placeholder="Описание"
          .value=${this.achievementForm.description}
          @input=${(event) => this.setAchievementField('description', event.currentTarget.value)}
        ></textarea>
        <select
          .value=${this.achievementForm.scope}
          @change=${(event) => this.setAchievementField('scope', event.currentTarget.value)}
        >
          <option value="monthly">monthly</option>
          <option value="lifetime">lifetime</option>
        </select>
        <select
          .value=${this.achievementForm.ruleType}
          @change=${(event) => this.setAchievementField('ruleType', event.currentTarget.value)}
        >
          <option value="daily_approved_count">daily_approved_count</option>
          <option value="daily_streak">daily_streak</option>
          <option value="challenge_difficulty_approved_count">challenge_difficulty_approved_count</option>
        </select>
        <input
          type="number"
          min="1"
          placeholder="count"
          .value=${String(this.achievementForm.count)}
          @input=${(event) => this.setAchievementField('count', Number(event.currentTarget.value))}
        />
        <select
          .value=${this.achievementForm.difficulty}
          @change=${(event) => this.setAchievementField('difficulty', event.currentTarget.value)}
        >
          <option value="Light">Light</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <input
          type="number"
          min="0"
          placeholder="sort"
          .value=${String(this.achievementForm.sort)}
          @input=${(event) => this.setAchievementField('sort', Number(event.currentTarget.value))}
        />
        <button type="submit" ?disabled=${this.saving}>Создать достижение</button>
      </form>

      <div class="admin-list">
        ${this.dashboard.achievements.map(
          (achievement) => html`
            <article>
              <strong>${achievement.title}</strong>
              <span>${achievement.code} · ${achievement.scope} · ${achievement.rule?.type || 'rule'}</span>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderShop() {
    return html`
      <div class="admin-list">
        ${this.dashboard.shopCards.map(
          (card) => html`
            <article>
              <strong>${card.name}</strong>
              <span>${card.price} XP · ${card.status}</span>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderActiveSection() {
    if (this.activeSection === 'users') {
      return this.renderUsers();
    }

    if (this.activeSection === 'teams') {
      return this.renderTeams();
    }

    if (this.activeSection === 'challenges') {
      return this.renderChallenges();
    }

    if (this.activeSection === 'achievements') {
      return this.renderAchievements();
    }

    if (this.activeSection === 'shop') {
      return this.renderShop();
    }

    return this.renderOverview();
  }

  render() {
    return html`
      <main class="admin-dashboard font-sb">
        <header class="admin-dashboard-head">
          <div>
            <span>Фабрика решений</span>
            <h1>Админ кабинет</h1>
          </div>
          <button type="button" @click=${() => this.logout()}>Выйти</button>
        </header>

        <nav class="admin-dashboard-nav" aria-label="Разделы админки">
          ${adminSections.map(
            (section) => html`
              <button
                class=${this.activeSection === section.key ? 'is-active' : ''}
                type="button"
                @click=${() => {
                  this.activeSection = section.key;
                }}
              >
                ${section.label}
              </button>
            `,
          )}
        </nav>

        ${this.error ? html`<p class="admin-message is-error">${this.error}</p>` : ''}
        ${this.success ? html`<p class="admin-message is-success">${this.success}</p>` : ''}
        ${this.loading ? html`<p class="admin-message">Загрузка...</p>` : this.renderActiveSection()}
      </main>
    `;
  }
}

customElements.define('admin-page', AdminPage);
