import { LitElement, html } from 'lit';

const adminSections = [
  { key: 'overview', label: 'Обзор' },
  { key: 'users', label: 'Пользователи' },
  { key: 'teams', label: 'Команды' },
  { key: 'challenges', label: 'Челленджи' },
  { key: 'wordy', label: 'Wordly' },
  { key: 'achievements', label: 'Достижения' },
  { key: 'shop', label: 'Магазин' },
  { key: 'strapi', label: 'Strapi' },
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
  userIds: [],
  teamIds: [],
};

const difficultyXpRewards = {
  None: 0,
  Light: 50,
  Medium: 100,
  Hard: 150,
};

const defaultUserForm = {
  username: '',
  email: '',
  globalRole: 'worker',
  xp: 0,
  teamId: '',
  teamRoleName: 'Участник',
};

const defaultShopForm = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  status: 'available',
  splineUrl: '',
};

const defaultWordyForm = {
  word: '',
  hint: '',
  isActive: true,
  sort: 0,
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
    userForm: { state: true },
    shopForm: { state: true },
    wordyForm: { state: true },
    teamName: { state: true },
    teamColor: { state: true },
    teamManagerUserId: { state: true },
    assignUserId: { state: true },
    assignTeamId: { state: true },
    assignRoleName: { state: true },
    aiAchievementIdea: { state: true },
    aiChallengeIdea: { state: true },
    aiWordyIdea: { state: true },
    temporaryPassword: { state: true },
  };

  constructor() {
    super();
    this.apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.strapiHint =
      import.meta.env.VITE_STRAPI_ADMIN_HINT ||
      'Локально используй Strapi admin-аккаунт, созданный при первом запуске.';
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
      wordyWords: [],
      shopCards: [],
      shopExchanges: [],
    };
    this.achievementForm = { ...defaultAchievementForm };
    this.challengeForm = { ...defaultChallengeForm };
    this.userForm = { ...defaultUserForm };
    this.shopForm = { ...defaultShopForm };
    this.wordyForm = { ...defaultWordyForm };
    this.teamName = '';
    this.teamColor = '#69d8ff';
    this.teamManagerUserId = '';
    this.assignUserId = '';
    this.assignTeamId = '';
    this.assignRoleName = 'Участник';
    this.aiAchievementIdea = '';
    this.aiChallengeIdea = '';
    this.aiWordyIdea = '';
    this.temporaryPassword = '';
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

  getSelectedValues(select) {
    return Array.from(select.selectedOptions || []).map((option) => option.value);
  }

  getCheckedValues(form, name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
  }

  getPmCandidateUsers() {
    return this.dashboard.users.filter((user) => !user.blocked && user.globalRole !== 'admin');
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
        wordyWords: Array.isArray(data.wordyWords) ? data.wordyWords : [],
        shopCards: Array.isArray(data.shopCards) ? data.shopCards : [],
        shopExchanges: Array.isArray(data.shopExchanges) ? data.shopExchanges : [],
      };
    } catch (error) {
      this.error = error.message || 'Не удалось загрузить админку';
    } finally {
      this.loading = false;
    }
  }

  setAchievementField(field, value) {
    this.achievementForm = { ...this.achievementForm, [field]: value };
  }

  setChallengeField(field, value) {
    this.challengeForm = {
      ...this.challengeForm,
      [field]: value,
      ...(field === 'difficulty' ? { xpReward: difficultyXpRewards[value] || 50 } : {}),
    };
  }

  setUserField(field, value) {
    this.userForm = { ...this.userForm, [field]: value };
  }

  setShopField(field, value) {
    this.shopForm = { ...this.shopForm, [field]: value };
  }

  setWordyField(field, value) {
    this.wordyForm = { ...this.wordyForm, [field]: value };
  }

  variantsToText(variants) {
    return Array.isArray(variants) ? variants : [];
  }

  variantsFromForm(form) {
    const keys = form.getAll('variantKey');
    const titles = form.getAll('variantTitle');
    const splineUrls = form.getAll('variantSplineUrl');

    return keys
      .map((key, index) => ({
        key: String(key || '').trim(),
        title: String(titles[index] || '').trim(),
        splineUrl: String(splineUrls[index] || '').trim(),
        gallery: [],
      }))
      .filter((variant) => variant.key || variant.title || variant.splineUrl);
  }

  requiredDifficultiesFromForm(form) {
    return form.getAll('requiredDifficulties').map((value) => String(value || '').trim()).filter(Boolean);
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

  createUser(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      const data = await this.requestApi('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(this.userForm),
      });
      this.temporaryPassword = data.temporaryPassword || '';
      this.userForm = { ...defaultUserForm };
    }, 'Пользователь создан. Временный пароль показан ниже один раз.');
  }

  resetTemporaryPassword(user) {
    return this.runMutation(async () => {
      const data = await this.requestApi(`/api/admin/users/${user.id}/reset-temporary-password`, {
        method: 'POST',
      });
      this.temporaryPassword = data.temporaryPassword || '';
    }, 'Временный пароль обновлен');
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

  createTeam(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: this.teamName,
          color: this.teamColor,
          managerUserId: this.teamManagerUserId,
        }),
      });
      this.teamName = '';
      this.teamColor = '#69d8ff';
      this.teamManagerUserId = '';
    }, 'Команда сохранена');
  }

  updateTeamFromCard(team, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/teams/${team.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.get('name'),
            color: form.get('color'),
          }),
        }),
      'Команда обновлена',
    );
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

  deleteTeamUser(entry) {
    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/team-users/${entry.id}`, {
          method: 'DELETE',
        }),
      'Участник убран из команды',
    );
  }

  updateShopExchangeStatus(exchange, status) {
    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/shop-exchanges/${exchange.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status }),
        }),
      status === 'issued' ? 'Обмен отмечен как выданный' : 'Обмен передан PM',
    );
  }

  createShopCard(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/shop-cards', {
        method: 'POST',
        body: JSON.stringify({
          ...this.shopForm,
          variants: this.variantsFromForm(form),
          requiredDifficulties: this.requiredDifficultiesFromForm(form),
        }),
      });
      this.shopForm = { ...defaultShopForm };
    }, 'Товар добавлен в магазин');
  }

  updateShopCardFromCard(card, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/shop-cards/${card.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.get('name'),
            description: form.get('description'),
            price: form.get('price'),
            stock: form.get('stock'),
            status: form.get('status'),
            splineUrl: form.get('splineUrl'),
            variants: this.variantsFromForm(form),
            requiredDifficulties: this.requiredDifficultiesFromForm(form),
          }),
        }),
      'Товар обновлен',
    );
  }

  deleteShopCard(card) {
    const confirmed = window.confirm(`Удалить товар «${card.name}»?`);

    if (!confirmed) {
      return;
    }

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/shop-cards/${card.id}`, {
          method: 'DELETE',
        }),
      'Товар удален',
    );
  }

  deleteAchievement(achievement) {
    const confirmed = window.confirm(`Удалить достижение «${achievement.title}»?`);

    if (!confirmed) {
      return;
    }

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/achievements/${achievement.id}`, {
          method: 'DELETE',
        }),
      'Достижение удалено',
    );
  }

  createChallenge(event) {
    event.preventDefault();
    const form = event.currentTarget;

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/challenges', {
        method: 'POST',
        body: JSON.stringify({
          ...this.challengeForm,
          userIds: this.getCheckedValues(form, 'challengeUserIds'),
          teamIds: this.getCheckedValues(form, 'challengeTeamIds'),
        }),
      });
      this.challengeForm = { ...defaultChallengeForm };
    }, 'Челлендж создан');
  }

  updateChallengeFromCard(challenge, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/challenges/${challenge.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.get('title'),
            description: form.get('description'),
            difficulty: form.get('difficulty'),
            xpReward: difficultyXpRewards[form.get('difficulty')] || 50,
            deadline: form.get('deadline'),
            visibility: form.get('visibility'),
          }),
        }),
      'Челлендж обновлен',
    );
  }

  generateChallenge(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      const data = await this.requestApi('/api/admin/challenges/generate', {
        method: 'POST',
        body: JSON.stringify({ idea: this.aiChallengeIdea }),
      });
      this.challengeForm = {
        ...this.challengeForm,
        ...(data.draft || {}),
      };
    }, 'Черновик челленджа от ИИ загружен в форму');
  }

  createWordyWord(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      await this.requestApi('/api/admin/wordy-words', {
        method: 'POST',
        body: JSON.stringify(this.wordyForm),
      });
      this.wordyForm = { ...defaultWordyForm };
    }, 'Слово Wordly сохранено');
  }

  updateWordyWordFromCard(wordyWord, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/wordy-words/${wordyWord.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            word: form.get('word'),
            hint: form.get('hint'),
            isActive: form.get('isActive') === 'on',
            sort: Number(form.get('sort') || 0),
          }),
        }),
      'Слово Wordly обновлено',
    );
  }

  deleteWordyWord(wordyWord) {
    const confirmed = window.confirm(`Удалить слово «${wordyWord.word}»?`);

    if (!confirmed) {
      return;
    }

    return this.runMutation(
      () =>
        this.requestApi(`/api/admin/wordy-words/${wordyWord.id}`, {
          method: 'DELETE',
        }),
      'Слово Wordly удалено',
    );
  }

  generateWordyWord(event) {
    event.preventDefault();

    return this.runMutation(async () => {
      const data = await this.requestApi('/api/admin/wordy-words/generate', {
        method: 'POST',
        body: JSON.stringify({ idea: this.aiWordyIdea }),
      });
      this.wordyForm = {
        ...defaultWordyForm,
        ...(data.draft || {}),
      };
    }, 'Черновик Wordly от ИИ загружен в форму');
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
        body: JSON.stringify({ idea: this.aiAchievementIdea }),
      });
      this.achievementForm = {
        ...this.achievementForm,
        ...(data.draft || {}),
      };
    }, 'Черновик достижения от ИИ загружен в форму');
  }

  logout() {
    window.localStorage.removeItem('auth.jwt');
    window.localStorage.removeItem('auth.user');
    window.sessionStorage.removeItem('auth.jwt');
    window.sessionStorage.removeItem('auth.user');
    window.location.assign('/admin');
  }

  renderOverview() {
    const { users, teams, challenges, achievements, wordyWords, shopCards } = this.dashboard;

    return html`
      <div class="admin-stat-grid">
        <article><span>Пользователи</span><strong>${users.length}</strong></article>
        <article><span>Команды</span><strong>${teams.length}</strong></article>
        <article><span>Челленджи</span><strong>${challenges.length}</strong></article>
        <article><span>Достижения</span><strong>${achievements.length}</strong></article>
        <article><span>Wordly</span><strong>${wordyWords.length}</strong></article>
        <article><span>Магазин</span><strong>${shopCards.length}</strong></article>
      </div>
    `;
  }

  renderUsers() {
    return html`
      <form class="admin-form is-wide" @submit=${(event) => this.createUser(event)}>
        <label class="admin-field">
          Имя
          <input
            .value=${this.userForm.username}
            @input=${(event) => this.setUserField('username', event.currentTarget.value)}
          />
        </label>
        <label class="admin-field">
          Email
          <input
            type="email"
            .value=${this.userForm.email}
            @input=${(event) => this.setUserField('email', event.currentTarget.value)}
          />
        </label>
        <label class="admin-field">
          Глобальная роль
          <select
            .value=${this.userForm.globalRole}
            @change=${(event) => this.setUserField('globalRole', event.currentTarget.value)}
          >
            <option value="worker">worker</option>
            <option value="project_manager">project_manager</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label class="admin-field">
          Стартовый XP
          <input
            type="number"
            min="0"
            .value=${String(this.userForm.xp)}
            @input=${(event) => this.setUserField('xp', Number(event.currentTarget.value))}
          />
        </label>
        <label class="admin-field">
          Команда
          <select
            .value=${this.userForm.teamId}
            @change=${(event) => this.setUserField('teamId', event.currentTarget.value)}
          >
            <option value="">Без команды</option>
            ${this.dashboard.teams.map((team) => html`<option value=${team.id}>${team.name}</option>`)}
          </select>
        </label>
        <label class="admin-field">
          Роль в команде
          <select
            .value=${this.userForm.teamRoleName}
            @change=${(event) => this.setUserField('teamRoleName', event.currentTarget.value)}
          >
            <option value="Участник">Участник</option>
            <option value="Проектный менеджер">Проектный менеджер</option>
          </select>
        </label>
        <button type="submit" ?disabled=${this.saving}>Создать с временным паролем</button>
      </form>

      ${this.temporaryPassword
        ? html`
            <div class="admin-temp-password">
              <span>Временный пароль показывается один раз</span>
              <strong>${this.temporaryPassword}</strong>
            </div>
          `
        : ''}

      <div class="admin-table">
        ${this.dashboard.users.map(
          (user) => html`
            <div class="admin-table-row admin-user-row">
              <div>
                <strong>${user.username || user.email}</strong>
                <span>
                  ${user.email} · ${user.xp} XP · lvl ${user.lvl}
                  ${user.mustChangePassword ? ' · временный пароль' : ''}
                </span>
              </div>
              <input
                type="number"
                min="0"
                .value=${String(user.xp)}
                @change=${(event) => this.updateUser(user, { xp: Number(event.currentTarget.value) })}
              />
              <select
                .value=${user.globalRole}
                @change=${(event) => this.updateUser(user, { globalRole: event.currentTarget.value })}
              >
                <option value="worker">worker</option>
                <option value="project_manager">project_manager</option>
                <option value="admin">admin</option>
              </select>
              <button type="button" @click=${() => this.resetTemporaryPassword(user)}>
                Временный пароль
              </button>
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
        <label class="admin-field">
          Название команды
          <input
            .value=${this.teamName}
            @input=${(event) => {
              this.teamName = event.currentTarget.value;
            }}
          />
        </label>
        <label class="admin-color-field">
          <input
            type="color"
            .value=${this.teamColor}
            @input=${(event) => {
              this.teamColor = event.currentTarget.value;
            }}
          />
          <span>${this.teamColor}</span>
        </label>
        <label class="admin-field">
          PM команды
          <select
            required
            .value=${this.teamManagerUserId}
            @change=${(event) => {
              this.teamManagerUserId = event.currentTarget.value;
            }}
          >
            <option value="">Выбери PM</option>
            ${this.getPmCandidateUsers().map(
              (user) => html`<option value=${user.id}>${user.username || user.email}</option>`,
            )}
          </select>
        </label>
        <button type="submit" ?disabled=${this.saving}>Создать команду</button>
      </form>

      <form class="admin-form" @submit=${(event) => this.assignTeamUser(event)}>
        <label class="admin-field">
          Пользователь
          <select
            .value=${this.assignUserId}
            @change=${(event) => {
              this.assignUserId = event.currentTarget.value;
            }}
          >
            <option value="">Выбери пользователя</option>
            ${this.dashboard.users.map((user) => html`<option value=${user.id}>${user.username || user.email}</option>`)}
          </select>
        </label>
        <label class="admin-field">
          Команда
          <select
            .value=${this.assignTeamId}
            @change=${(event) => {
              this.assignTeamId = event.currentTarget.value;
            }}
          >
            <option value="">Выбери команду</option>
            ${this.dashboard.teams.map((team) => html`<option value=${team.id}>${team.name}</option>`)}
          </select>
        </label>
        <label class="admin-field">
          Роль в команде
          <select
            .value=${this.assignRoleName}
            @change=${(event) => {
              this.assignRoleName = event.currentTarget.value;
            }}
          >
            <option value="Участник">Участник</option>
            <option value="Проектный менеджер">Проектный менеджер</option>
          </select>
        </label>
        <button type="submit" ?disabled=${this.saving}>Добавить / назначить</button>
      </form>

      <div class="admin-team-grid">
        ${this.dashboard.teams.map((team) => {
          const members = this.dashboard.teamUsers.filter((entry) => entry.teamId === team.id);

          return html`
            <article class="admin-team-card">
              <form @submit=${(event) => this.updateTeamFromCard(team, event)}>
                <input name="name" .value=${team.name} />
                <input type="color" name="color" .value=${team.color || '#b559f3'} />
                <button type="submit" ?disabled=${this.saving}>Сохранить</button>
              </form>
              <p>${team.memberCount} участников</p>
              ${team.managers?.length ? html`<p>PM: ${team.managers.join(', ')}</p>` : ''}
              <div class="admin-team-members">
                ${members.map(
                  (member) => html`
                    <div>
                      <span>${member.username}</span>
                      <em>${member.roleName}</em>
                      <button type="button" @click=${() => this.deleteTeamUser(member)}>Убрать</button>
                    </div>
                  `,
                )}
              </div>
            </article>
          `;
        })}
      </div>
    `;
  }

  renderChallenges() {
    return html`
      <form class="admin-form is-ai" @submit=${(event) => this.generateChallenge(event)}>
        <input
          placeholder="Идея для ИИ: например, челлендж для дизайнеров"
          .value=${this.aiChallengeIdea}
          @input=${(event) => {
            this.aiChallengeIdea = event.currentTarget.value;
          }}
        />
        <button type="submit" ?disabled=${this.saving}>Сгенерировать через ИИ</button>
      </form>

      <form class="admin-form is-wide" @submit=${(event) => this.createChallenge(event)}>
        <label class="admin-field">Название<input .value=${this.challengeForm.title} @input=${(event) => this.setChallengeField('title', event.currentTarget.value)} /></label>
        <label class="admin-field">Описание<textarea .value=${this.challengeForm.description} @input=${(event) => this.setChallengeField('description', event.currentTarget.value)}></textarea></label>
        <label class="admin-field">Сложность<select .value=${this.challengeForm.difficulty} @change=${(event) => this.setChallengeField('difficulty', event.currentTarget.value)}>
          <option value="None">Без сложности</option>
          <option value="Light">Light · 50 XP</option>
          <option value="Medium">Medium · 100 XP</option>
          <option value="Hard">Hard · 150 XP</option>
        </select></label>
        <label class="admin-field">XP фиксируется автоматически<input type="number" min="0" .value=${String(this.challengeForm.xpReward)} readonly /></label>
        <label class="admin-field">Дедлайн<input type="datetime-local" .value=${this.challengeForm.deadline} @input=${(event) => this.setChallengeField('deadline', event.currentTarget.value)} /></label>
        <label class="admin-field">Видимость<select .value=${this.challengeForm.visibility} @change=${(event) => this.setChallengeField('visibility', event.currentTarget.value)}>
          <option value="public">Открытый</option>
          <option value="private">Личный</option>
        </select></label>
        <div class="admin-choice-field">
          <strong>Для кого челлендж</strong>
          ${this.dashboard.users.map(
            (user) => html`
              <label>
                <input type="checkbox" name="challengeUserIds" value=${user.id} />
                ${user.username || user.email}
              </label>
            `,
          )}
        </div>
        <div class="admin-choice-field">
          <strong>Или команда целиком</strong>
          ${this.dashboard.teams.map(
            (team) => html`
              <label>
                <input type="checkbox" name="challengeTeamIds" value=${team.id} />
                ${team.name}
              </label>
            `,
          )}
        </div>
        <button type="submit" ?disabled=${this.saving}>Создать челлендж</button>
      </form>

      <div class="admin-list">
        ${this.dashboard.challenges.map(
          (challenge) => html`
            <article>
              <form class="admin-inline-form" @submit=${(event) => this.updateChallengeFromCard(challenge, event)}>
                <input name="title" .value=${challenge.title} />
                <textarea name="description" .value=${challenge.description}></textarea>
                <select name="difficulty" .value=${challenge.difficulty}>
                  <option value="None">Без сложности</option>
                  <option value="Light">Light · 50 XP</option>
                  <option value="Medium">Medium · 100 XP</option>
                  <option value="Hard">Hard · 150 XP</option>
                </select>
                <input name="xpReward" type="number" min="0" .value=${String(challenge.xpReward)} readonly />
                <input name="deadline" type="datetime-local" .value=${String(challenge.deadline || '').slice(0, 16)} />
                <select name="visibility" .value=${challenge.visibility}>
                  <option value="public">Открытый</option>
                  <option value="private">Личный</option>
                </select>
                <button type="submit" ?disabled=${this.saving}>Сохранить</button>
              </form>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderWordy() {
    return html`
      <form class="admin-form is-ai" @submit=${(event) => this.generateWordyWord(event)}>
        <label class="admin-field">
          ИИ-идея для Wordly
          <input
            placeholder="Например: простое слово про авторизацию"
            .value=${this.aiWordyIdea}
            @input=${(event) => {
              this.aiWordyIdea = event.currentTarget.value;
            }}
          />
        </label>
        <button type="submit" ?disabled=${this.saving}>Сгенерировать Wordly</button>
      </form>

      <form class="admin-form is-wide" @submit=${(event) => this.createWordyWord(event)}>
        <label class="admin-field">
          Слово
          <input
            .value=${this.wordyForm.word}
            @input=${(event) => this.setWordyField('word', event.currentTarget.value)}
            required
          />
        </label>
        <label class="admin-field">
          Подсказка
          <input
            .value=${this.wordyForm.hint}
            @input=${(event) => this.setWordyField('hint', event.currentTarget.value)}
            required
          />
        </label>
        <label class="admin-field">
          Сортировка
          <input
            type="number"
            min="0"
            .value=${String(this.wordyForm.sort)}
            @input=${(event) => this.setWordyField('sort', Number(event.currentTarget.value))}
          />
        </label>
        <label class="admin-check-field">
          <input
            type="checkbox"
            .checked=${this.wordyForm.isActive}
            @change=${(event) => this.setWordyField('isActive', event.currentTarget.checked)}
          />
          Активно в игре
        </label>
        <button type="submit" ?disabled=${this.saving}>Сохранить слово</button>
      </form>

      <div class="admin-list">
        ${this.dashboard.wordyWords.length
          ? this.dashboard.wordyWords.map(
              (wordyWord) => html`
                <article>
                  <form
                    class="admin-inline-form admin-wordy-form"
                    @submit=${(event) => this.updateWordyWordFromCard(wordyWord, event)}
                  >
                    <label class="admin-field">
                      Слово
                      <input name="word" .value=${wordyWord.word || ''} required />
                    </label>
                    <label class="admin-field">
                      Подсказка
                      <input name="hint" .value=${wordyWord.hint || ''} required />
                    </label>
                    <label class="admin-field">
                      Сортировка
                      <input name="sort" type="number" min="0" .value=${String(wordyWord.sort || 0)} />
                    </label>
                    <label class="admin-check-field">
                      <input name="isActive" type="checkbox" .checked=${wordyWord.isActive !== false} />
                      Активно
                    </label>
                    <button type="submit" ?disabled=${this.saving}>Сохранить</button>
                    <button
                      type="button"
                      class="is-danger"
                      ?disabled=${this.saving}
                      @click=${() => this.deleteWordyWord(wordyWord)}
                    >
                      Удалить
                    </button>
                  </form>
                </article>
              `,
            )
          : html`
              <article>
                <strong>Слов пока нет</strong>
                <span>Создай первое слово вручную или сгенерируй через ИИ.</span>
              </article>
            `}
      </div>
    `;
  }

  renderAchievements() {
    return html`
      <form class="admin-form is-ai" @submit=${(event) => this.generateAchievement(event)}>
        <input
          placeholder="Идея для ИИ: например, серия дейликов за неделю"
          .value=${this.aiAchievementIdea}
          @input=${(event) => {
            this.aiAchievementIdea = event.currentTarget.value;
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
              <button type="button" class="is-danger" @click=${() => this.deleteAchievement(achievement)}>
                Удалить
              </button>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderShop() {
    const shopExchanges = Array.isArray(this.dashboard.shopExchanges) ? this.dashboard.shopExchanges : [];

    return html`
      <form class="admin-form is-wide" @submit=${(event) => this.createShopCard(event)}>
        <input
          name="name"
          placeholder="Название товара"
          .value=${this.shopForm.name}
          @input=${(event) => this.setShopField('name', event.target.value)}
          required
        />
        <input
          name="price"
          type="number"
          min="0"
          placeholder="Цена XP"
          .value=${String(this.shopForm.price)}
          @input=${(event) => this.setShopField('price', event.target.value)}
          required
        />
        <input
          name="stock"
          type="number"
          min="0"
          placeholder="Остаток"
          .value=${String(this.shopForm.stock)}
          @input=${(event) => this.setShopField('stock', event.target.value)}
          required
        />
        <select
          name="status"
          .value=${this.shopForm.status}
          @change=${(event) => this.setShopField('status', event.target.value)}
        >
          <option value="available">Доступен</option>
          <option value="not_available">Недоступен</option>
        </select>
        <input
          name="splineUrl"
          placeholder="Основной Spline URL"
          .value=${this.shopForm.splineUrl}
          @input=${(event) => this.setShopField('splineUrl', event.target.value)}
        />
        <textarea
          name="description"
          placeholder="Описание"
          .value=${this.shopForm.description}
          @input=${(event) => this.setShopField('description', event.target.value)}
        ></textarea>
        <div class="admin-requirement-fields">
          <strong>Условия покупки</strong>
          <label><input type="checkbox" name="requiredDifficulties" value="Light" /> Light</label>
          <label><input type="checkbox" name="requiredDifficulties" value="Medium" /> Medium</label>
          <label><input type="checkbox" name="requiredDifficulties" value="Hard" /> Hard</label>
          <span>Можно оставить пустым — тогда нужна только цена XP.</span>
        </div>
        <div class="admin-variant-fields">
          <strong>Вариант товара</strong>
          <input name="variantKey" placeholder="key" />
          <input name="variantTitle" placeholder="title" />
          <input name="variantSplineUrl" placeholder="splineUrl" />
        </div>
        <div class="admin-variant-fields">
          <strong>Вариант товара</strong>
          <input name="variantKey" placeholder="key" />
          <input name="variantTitle" placeholder="title" />
          <input name="variantSplineUrl" placeholder="splineUrl" />
        </div>
        <button type="submit" ?disabled=${this.saving}>Добавить товар</button>
      </form>
      <div class="admin-list">
        ${this.dashboard.shopCards.map(
          (card) => {
            const variants = this.variantsToText(card.variants);

            return html`
            <article>
              <form class="admin-inline-form admin-shop-card-form" @submit=${(event) => this.updateShopCardFromCard(card, event)}>
                <input name="name" .value=${card.name || ''} required />
                <input name="price" type="number" min="0" .value=${String(card.price || 0)} required />
                <input name="stock" type="number" min="0" .value=${String(card.stock || 0)} required />
                <select name="status" .value=${card.status || 'available'}>
                  <option value="available">Доступен</option>
                  <option value="not_available">Недоступен</option>
                </select>
                <input name="splineUrl" placeholder="Spline URL" .value=${card.splineUrl || ''} />
                <textarea name="description" placeholder="Описание" .value=${card.description || ''}></textarea>
                <div class="admin-requirement-fields">
                  <strong>Условия покупки</strong>
                  ${['Light', 'Medium', 'Hard'].map(
                    (difficulty) => html`
                      <label>
                        <input
                          type="checkbox"
                          name="requiredDifficulties"
                          value=${difficulty}
                          .checked=${Array.isArray(card.requiredDifficulties) && card.requiredDifficulties.includes(difficulty)}
                        />
                        ${difficulty}
                      </label>
                    `,
                  )}
                  <span>Пусто = без условий, только XP.</span>
                </div>
                ${[...variants, { key: '', title: '', splineUrl: '' }].map(
                  (variant) => html`
                    <div class="admin-variant-fields">
                      <strong>Вариант товара</strong>
                      <input name="variantKey" placeholder="key" .value=${variant.key || ''} />
                      <input name="variantTitle" placeholder="title" .value=${variant.title || ''} />
                      <input name="variantSplineUrl" placeholder="splineUrl" .value=${variant.splineUrl || ''} />
                    </div>
                  `,
                )}
                <button type="submit" ?disabled=${this.saving}>Сохранить</button>
                <button type="button" class="is-danger" ?disabled=${this.saving} @click=${() => this.deleteShopCard(card)}>
                  Удалить
                </button>
              </form>
            </article>
          `;
          },
        )}
      </div>
      <div class="admin-list">
        ${shopExchanges.length
          ? shopExchanges.map(
              (exchange) => html`
                <article>
                  <strong>${exchange.user?.username || exchange.user?.email || 'Сотрудник'}</strong>
                  <span>
                    ${exchange.teamName || 'Команда'} · ${exchange.itemName}
                    ${exchange.variantTitle ? `· ${exchange.variantTitle}` : ''} · ${exchange.price} XP
                  </span>
                  <span>${exchange.statusLabel || exchange.status}</span>
                  ${exchange.status === 'pending'
                    ? html`
                        <button type="button" @click=${() => this.updateShopExchangeStatus(exchange, 'with_pm')}>
                          Передано PM
                        </button>
                      `
                    : ''}
                  ${exchange.status === 'with_pm'
                    ? html`
                        <button type="button" @click=${() => this.updateShopExchangeStatus(exchange, 'issued')}>
                          Выдано
                        </button>
                      `
                    : ''}
                </article>
              `,
            )
          : html`
              <article>
                <strong>Заявок на выдачу нет</strong>
                <span>Новые обмены появятся здесь после списания XP у сотрудников.</span>
              </article>
            `}
      </div>
    `;
  }

  renderStrapi() {
    return html`
      <section class="admin-strapi-card">
        <span>Strapi admin</span>
        <h2>Переход в БД и CMS</h2>
        <p>${this.strapiHint}</p>
        <a href=${`${this.apiUrl}/admin`} target="_blank" rel="noreferrer">Открыть Strapi</a>
      </section>
    `;
  }

  renderActiveSection() {
    if (this.activeSection === 'users') return this.renderUsers();
    if (this.activeSection === 'teams') return this.renderTeams();
    if (this.activeSection === 'challenges') return this.renderChallenges();
    if (this.activeSection === 'wordy') return this.renderWordy();
    if (this.activeSection === 'achievements') return this.renderAchievements();
    if (this.activeSection === 'shop') return this.renderShop();
    if (this.activeSection === 'strapi') return this.renderStrapi();

    return this.renderOverview();
  }

  render() {
    return html`
      <main class="admin-dashboard font-sb">
        <section class="admin-desktop-warning">
          <strong>Админка оптимизирована под ПК</strong>
          <span>Для нормальной работы открой её на компьютере или разверни окно до desktop-ширины.</span>
        </section>
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
