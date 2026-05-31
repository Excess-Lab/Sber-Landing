import { LitElement, html } from 'lit';
import { gsap } from 'gsap';

const infoCards = [
  {
    title: 'Система Оплаты',
    text: 'Получай опыт за выполненные челленджи',
    visual: 'visual-payment',
    image: '/assets/sber-landing-photo/image-7.png',
  },
  {
    title: 'Челленджи',
    text: 'Интерес к повседневных задачах',
    visual: 'visual-challenges',
    image: '/assets/sber-landing-photo/image-8.png',
  },
  {
    title: 'Награды',
    text: 'Обменивай опыт на награды из магазина и будь сильнее',
    visual: 'visual-rewards',
    image: '/assets/sber-landing-photo/image-9.png',
  },
];

const navItems = [
  { label: 'Про проект', hash: '#about' },
  { label: 'Челленджи', hash: '#challenges' },
  { label: 'Достижения', hash: '#achievements' },
  { label: 'Команды', hash: '#teams' },
  { label: 'Рейтинг', hash: '#rating' },
  { label: 'Магазин', hash: '#shop' },
  { label: 'F&Q', hash: '#faq' },
];

const levelCards = [
  {
    difficulty: 'Light',
    title: 'Light',
    text: 'Легкие повседневные задачи',
    className: 'level-light',
  },
  {
    difficulty: 'Medium',
    title: 'Medium',
    text: 'Активность с командой',
    className: 'level-medium',
  },
  {
    difficulty: 'Hard',
    title: 'Hard',
    text: 'Сложные челленджи',
    className: 'level-hard',
  },
];

const shopFallbackGallery = [
  '/assets/sber-landing-photo/rectangle-27.png',
  '/assets/sber-landing-photo/image-7.png',
  '/assets/sber-landing-photo/image-8.png',
  '/assets/sber-landing-photo/image-9.png',
  '/assets/sber-landing-photo/image-10.png',
];

const fallbackTeams = [
  { name: 'AmazMe', className: 'is-blue' },
  { name: 'Sber ID', className: 'is-teal' },
  { name: 'Platform V', className: 'is-rose' },
];

const fallbackProfileChallenges = [
  {
    title: 'Твой первый челлендж :)',
    reward: 'хорошее настроение',
    description: 'Скорее участвуй! Первый челлендж во вкладке «Челленджи».',
    placeholder: true,
  },
  {
    title: 'Твой второй челлендж',
    reward: 'хорошее настроение',
    description: 'Скорее участвуй! Первый челлендж во вкладке «Челленджи».',
    placeholder: true,
  },
];

const participantColors = ['#8dff00', '#69d8ff', '#ff7ab6', '#fff200', '#b559f3'];

class EmployeePage extends LitElement {
  static properties = {
    footerImageX: { state: true },
    footerImageY: { state: true },
    footerClipStyle: { state: true },
    profileMenuOpen: { state: true },
    mobileHeaderHidden: { state: true },
    user: { state: true },
    teams: { state: true },
    roles: { state: true },
    selectedTeamId: { state: true },
    availableChallenges: { state: true },
    userChallenges: { state: true },
    participantRating: { state: true },
    shopCards: { state: true },
    collapsedSections: { state: true },
    selectedDifficulty: { state: true },
    availableScopeFilter: { state: true },
    availableDeadlineFilter: { state: true },
    availableSort: { state: true },
    myDeadlineFilter: { state: true },
    mySort: { state: true },
    availableFiltersOpen: { state: true },
    myFiltersOpen: { state: true },
    expandedRating: { state: true },
    shopPhotoIndexes: { state: true },
    floatingSectionKey: { state: true },
    challengeSubmissionOpen: { state: true },
    challengeSubmissionTarget: { state: true },
    challengeSubmissionText: { state: true },
    challengeSubmissionLinks: { state: true },
    challengeSubmissionSaving: { state: true },
    challengeSubmissionError: { state: true },
    challengeSubmissionSuccess: { state: true },
    langflowQuestion: { state: true },
    langflowAnswer: { state: true },
    langflowLoading: { state: true },
    langflowError: { state: true },
    statusEditorOpen: { state: true },
    statusEmojiInput: { state: true },
    statusTextInput: { state: true },
    statusSaving: { state: true },
    statusError: { state: true },
    avatarEditorOpen: { state: true },
    avatarPreviewUrl: { state: true },
    avatarCropX: { state: true },
    avatarCropY: { state: true },
    avatarScale: { state: true },
    avatarSaving: { state: true },
    avatarError: { state: true },
    activeNavHash: { state: true },
    profileChallengeIndex: { state: true },
    passwordEditorOpen: { state: true },
    newPasswordInput: { state: true },
    repeatPasswordInput: { state: true },
    passwordSaving: { state: true },
    passwordError: { state: true },
    passwordSuccess: { state: true },
    daily: { state: true },
    achievements: { state: true },
    milestoneRewards: { state: true },
    dailyCheckinSaving: { state: true },
    dailyCheckinError: { state: true },
    dailyCheckinSuccess: { state: true },
  };

  constructor() {
    super();
    this.apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.footerImageX = 0;
    this.footerImageY = 0;
    this.footerClipStyle = 'clip-path: inset(0 100% 100% 0);';
    this.profileMenuOpen =
      typeof window === 'undefined' ? true : !window.matchMedia('(max-width: 899px)').matches;
    this.mobileHeaderHidden = false;
    this.user = this.readStoredUser() || {};
    this.teams = [];
    this.roles = [];
    this.selectedTeamId = '';
    this.availableChallenges = [];
    this.userChallenges = [];
    this.participantRating = [];
    this.shopCards = [];
    this.collapsedSections = {
      about: false,
      challenges: false,
      dailies: false,
      achievements: false,
      teams: false,
      shop: false,
      faq: false,
    };
    this.selectedDifficulty = 'all';
    this.availableScopeFilter = 'all';
    this.availableDeadlineFilter = 'all';
    this.availableSort = 'deadline';
    this.myDeadlineFilter = 'all';
    this.mySort = 'deadline';
    this.availableFiltersOpen = true;
    this.myFiltersOpen = true;
    this.expandedRating = false;
    this.shopPhotoIndexes = {};
    this.floatingSectionKey = '';
    this.challengeSubmissionOpen = false;
    this.challengeSubmissionTarget = null;
    this.challengeSubmissionText = '';
    this.challengeSubmissionLinks = '';
    this.challengeSubmissionSaving = false;
    this.challengeSubmissionError = '';
    this.challengeSubmissionSuccess = '';
    this.langflowQuestion = '';
    this.langflowAnswer = '';
    this.langflowLoading = false;
    this.langflowError = '';
    this.statusEditorOpen = false;
    this.statusEmojiInput = this.user.statusEmoji || '😁';
    this.statusTextInput = this.user.statusText || 'Кайфую';
    this.statusSaving = false;
    this.statusError = '';
    this.avatarEditorOpen = false;
    this.avatarPreviewUrl = '';
    this.avatarCropX = 0;
    this.avatarCropY = 0;
    this.avatarScale = 1;
    this.avatarSaving = false;
    this.avatarError = '';
    this.activeNavHash = typeof window === 'undefined' ? '#about' : window.location.hash || '#about';
    this.profileChallengeIndex = 0;
    this.passwordEditorOpen = false;
    this.newPasswordInput = '';
    this.repeatPasswordInput = '';
    this.passwordSaving = false;
    this.passwordError = '';
    this.passwordSuccess = '';
    this.daily = { today: null, monthStats: { approvedCount: 0, streak: 0, xpFromDailies: 0 }, pendingForPm: [] };
    this.achievements = [];
    this.milestoneRewards = [];
    this.dailyCheckinSaving = false;
    this.dailyCheckinError = '';
    this.dailyCheckinSuccess = '';
    this.footerDrag = null;
    this.avatarDrag = null;
    this.avatarNaturalWidth = 0;
    this.avatarNaturalHeight = 0;
    this.profileChallengeTimer = null;
    this.profileChallengeAnimation = null;
    this.mobileProfileClosing = false;
    this.footerPositionReady = false;
    this.lastScrollY = typeof window === 'undefined' ? 0 : window.scrollY;
    this.mobileHeaderLockUntil = 0;
    this.profileAnimation = null;
    this.handleFooterPointerMove = this.handleFooterPointerMove.bind(this);
    this.handleFooterPointerUp = this.handleFooterPointerUp.bind(this);
    this.handleAvatarPointerMove = this.handleAvatarPointerMove.bind(this);
    this.handleAvatarPointerUp = this.handleAvatarPointerUp.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleWindowScroll = this.handleWindowScroll.bind(this);
    this.handleWindowHashChange = this.handleWindowHashChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Кабинет сотрудника';
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
    window.addEventListener('hashchange', this.handleWindowHashChange);
    this.fetchProfile();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('scroll', this.handleWindowScroll);
    window.removeEventListener('hashchange', this.handleWindowHashChange);
    window.removeEventListener('pointermove', this.handleFooterPointerMove);
    window.removeEventListener('pointerup', this.handleFooterPointerUp);
    window.removeEventListener('pointercancel', this.handleFooterPointerUp);
    window.removeEventListener('pointermove', this.handleAvatarPointerMove);
    window.removeEventListener('pointerup', this.handleAvatarPointerUp);
    window.removeEventListener('pointercancel', this.handleAvatarPointerUp);
    this.stopChallengeCarousel();
    this.revokeAvatarPreview();
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.setInitialFooterImagePosition();
    this.updateActiveNavFromScroll();
    this.syncNavIndicators();
    this.animateInitialContent();
    this.startChallengeCarousel();
  }

  updated(changedProperties) {
    if (
      changedProperties.has('activeNavHash') ||
      changedProperties.has('profileMenuOpen') ||
      changedProperties.has('mobileHeaderHidden')
    ) {
      this.syncNavIndicators();
    }

    if (changedProperties.has('userChallenges')) {
      this.profileChallengeIndex = Math.min(
        this.profileChallengeIndex,
        Math.max(0, this.getProfileChallengeCards().length - 1),
      );
      this.startChallengeCarousel();
    }
  }

  getFooterElements() {
    return {
      footer: this.querySelector('.employee-footer'),
      image: this.querySelector('.employee-footer-drag-image'),
    };
  }

  clampFooterImagePosition(x, y) {
    const { footer, image } = this.getFooterElements();

    if (!footer || !image) {
      return { x, y };
    }

    const maxX = Math.max(0, footer.clientWidth - image.offsetWidth);
    const maxY = Math.max(0, footer.clientHeight - image.offsetHeight);

    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }

  async setInitialFooterImagePosition() {
    await this.updateComplete;

    const { footer, image } = this.getFooterElements();

    if (!footer || !image) {
      return;
    }

    const x = (footer.clientWidth - image.offsetWidth) / 2;
    const y = Math.max(0, footer.clientHeight * 0.42 - image.offsetHeight / 2);
    const clamped = this.clampFooterImagePosition(x, y);

    this.footerImageX = clamped.x;
    this.footerImageY = clamped.y;
    this.footerPositionReady = true;
    await this.updateComplete;
    this.updateFooterClip();
  }

  async handleWindowResize() {
    if (!this.footerPositionReady) {
      await this.setInitialFooterImagePosition();
      return;
    }

    const clamped = this.clampFooterImagePosition(this.footerImageX, this.footerImageY);
    this.footerImageX = clamped.x;
    this.footerImageY = clamped.y;
    await this.updateComplete;
    this.updateFooterClip();
    this.syncNavIndicators();
    this.updateActiveNavFromScroll();
  }

  handleWindowScroll() {
    const currentScrollY = Math.max(0, window.scrollY);

    this.updateActiveNavFromScroll(currentScrollY);

    if (!window.matchMedia('(max-width: 899px)').matches) {
      if (this.mobileHeaderHidden) {
        this.mobileHeaderHidden = false;
      }
      this.lastScrollY = currentScrollY;
      return;
    }

    if (Date.now() < this.mobileHeaderLockUntil) {
      this.mobileHeaderHidden = false;
      this.lastScrollY = currentScrollY;
      return;
    }

    const delta = currentScrollY - this.lastScrollY;

    if (Math.abs(delta) < 6) {
      return;
    }

    if (delta > 0 && currentScrollY > 96) {
      if (this.profileMenuOpen) {
        if (!this.mobileProfileClosing) {
          this.closeMobileProfile({ fromScroll: true });
        }

        this.lastScrollY = currentScrollY;
        return;
      }

      this.mobileHeaderHidden = true;
    } else if (delta < 0 || currentScrollY < 24) {
      this.mobileHeaderHidden = false;
    }

    this.lastScrollY = currentScrollY;
  }

  updateFooterClip() {
    const { footer, image } = this.getFooterElements();

    if (!footer || !image) {
      return;
    }

    const footerRect = footer.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const top = Math.max(0, imageRect.top - footerRect.top);
    const right = Math.max(0, footerRect.right - imageRect.right);
    const bottom = Math.max(0, footerRect.bottom - imageRect.bottom);
    const left = Math.max(0, imageRect.left - footerRect.left);

    this.footerClipStyle = `clip-path: inset(${top}px ${right}px ${bottom}px ${left}px);`;
  }

  handleFooterImageLoad() {
    this.setInitialFooterImagePosition();
  }

  handleFooterPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    this.footerDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: this.footerImageX,
      originY: this.footerImageY,
    };

    window.addEventListener('pointermove', this.handleFooterPointerMove);
    window.addEventListener('pointerup', this.handleFooterPointerUp);
    window.addEventListener('pointercancel', this.handleFooterPointerUp);
  }

  async handleFooterPointerMove(event) {
    if (!this.footerDrag || event.pointerId !== this.footerDrag.pointerId) {
      return;
    }

    const nextX = this.footerDrag.originX + event.clientX - this.footerDrag.startX;
    const nextY = this.footerDrag.originY + event.clientY - this.footerDrag.startY;
    const clamped = this.clampFooterImagePosition(nextX, nextY);

    this.footerImageX = clamped.x;
    this.footerImageY = clamped.y;
    await this.updateComplete;
    this.updateFooterClip();
  }

  handleFooterPointerUp(event) {
    if (this.footerDrag && event.pointerId !== this.footerDrag.pointerId) {
      return;
    }

    this.footerDrag = null;
    window.removeEventListener('pointermove', this.handleFooterPointerMove);
    window.removeEventListener('pointerup', this.handleFooterPointerUp);
    window.removeEventListener('pointercancel', this.handleFooterPointerUp);
  }

  renderFooterLinks(className = 'employee-footer-links') {
    return html`
      <div class=${className}>
        <a href="https://www.sberbank.ru/" target="_blank" rel="noreferrer">Сбербанк</a>
        <a href="https://github.com/sharyzadizain" target="_blank" rel="noreferrer">Github</a>
        <a href="https://t.me/KabanovMakap" target="_blank" rel="noreferrer">Telegram</a>
      </div>
    `;
  }

  prefersReducedMotion() {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  getAuthStorage() {
    if (window.localStorage.getItem('auth.jwt')) {
      return window.localStorage;
    }

    if (window.sessionStorage.getItem('auth.jwt')) {
      return window.sessionStorage;
    }

    return null;
  }

  getAuthToken() {
    return (
      window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt') || ''
    );
  }

  syncStoredUser(user) {
    const storage = this.getAuthStorage();

    if (!storage || !user) {
      return;
    }

    storage.setItem('auth.user', JSON.stringify(user));
  }

  readStoredUser() {
    const storedUser =
      window.localStorage.getItem('auth.user') || window.sessionStorage.getItem('auth.user');

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }

  async requestApi(path, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
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

  async fetchProfile() {
    if (!this.getAuthToken()) {
      return;
    }

    try {
      const data = await this.requestApi('/api/profile/me');
      const nextUser = {
        ...this.user,
        ...(data.user || {}),
      };

      this.user = nextUser;
      this.teams = Array.isArray(data.teams) ? data.teams : [];
      if (!this.selectedTeamId && this.teams[0]?.id) {
        this.selectedTeamId = String(this.teams[0].id);
      }
      this.roles = Array.isArray(data.roles) ? data.roles : [];
      this.availableChallenges = Array.isArray(data.availableChallenges)
        ? data.availableChallenges
        : [];
      this.userChallenges = Array.isArray(data.myChallenges)
        ? data.myChallenges
        : Array.isArray(data.userChallenges)
          ? data.userChallenges
          : [];
      this.participantRating = Array.isArray(data.participantRating)
        ? data.participantRating
        : [];
      this.shopCards = Array.isArray(data.shopCards) ? data.shopCards : this.shopCards;
      this.daily = data.daily || this.daily;
      this.achievements = Array.isArray(data.achievements) ? data.achievements : this.achievements;
      this.milestoneRewards = Array.isArray(data.milestoneRewards)
        ? data.milestoneRewards
        : this.milestoneRewards;
      this.syncStoredUser(nextUser);
    } catch (error) {
      console.error(error);
      this.fetchShopCards();
    }
  }

  async fetchShopCards() {
    try {
      const data = await this.requestApi('/api/shop-cards?populate=photo');
      const items = Array.isArray(data.data) ? data.data : [];

      this.shopCards = items.map((item) => {
        const raw = item.attributes ? { id: item.id, documentId: item.documentId, ...item.attributes } : item;
        const photoData = raw.photo?.data;
        const photo = photoData
          ? { id: photoData.id, documentId: photoData.documentId, ...photoData.attributes }
          : raw.photo;

        return {
          id: raw.id,
          documentId: raw.documentId,
          name: raw.name || 'Товар',
          description: raw.description || '',
          price: Number(raw.price || 0),
          status: raw.status || 'available',
          photo,
          gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
          splineUrl: raw.splineUrl || '',
        };
      });
    } catch (error) {
      console.error(error);
      if (!this.shopCards.length) {
        this.shopCards = [];
      }
    }
  }

  async checkinDaily() {
    if (this.dailyCheckinSaving) {
      return;
    }

    this.dailyCheckinSaving = true;
    this.dailyCheckinError = '';
    this.dailyCheckinSuccess = '';

    try {
      await this.requestApi('/api/daily-checkins/checkin', { method: 'POST' });
      this.dailyCheckinSuccess = 'Отмечено. Ждёт подтверждения PM.';
      await this.fetchProfile();
    } catch (error) {
      this.dailyCheckinError = error.message || 'Не удалось отметить дейлик';
    } finally {
      this.dailyCheckinSaving = false;
    }
  }

  async approveDailyCheckin(id, action = 'approve') {
    const numericId = Number(id);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      return;
    }

    if (this.dailyCheckinSaving) {
      return;
    }

    this.dailyCheckinSaving = true;
    this.dailyCheckinError = '';
    this.dailyCheckinSuccess = '';

    try {
      await this.requestApi(`/api/daily-checkins/${numericId}/${action}`, { method: 'POST' });
      await this.fetchProfile();
    } catch (error) {
      this.dailyCheckinError = error.message || 'Не удалось обновить дейлик';
    } finally {
      this.dailyCheckinSaving = false;
    }
  }

  getGraphemes(value) {
    const segmenter =
      typeof Intl !== 'undefined' && 'Segmenter' in Intl
        ? new Intl.Segmenter('ru', { granularity: 'grapheme' })
        : null;

    if (!segmenter) {
      return Array.from(value);
    }

    return Array.from(segmenter.segment(value), (part) => part.segment);
  }

  isSingleEmoji(value) {
    const trimmed = String(value || '').trim();
    const graphemes = this.getGraphemes(trimmed);

    return (
      graphemes.length === 1 &&
      /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(trimmed)
    );
  }

  getMediaUrl(media) {
    const url =
      typeof media === 'string'
        ? media
        : media?.formats?.thumbnail?.url || media?.formats?.small?.url || media?.url;

    if (!url) {
      return '';
    }

    return url.startsWith('/') ? `${this.apiUrl}${url}` : url;
  }

  getAvatarUrl() {
    return this.getMediaUrl(this.user?.avatar);
  }

  getDisplayName() {
    const username = String(this.user?.username || '').trim();

    if (username && !username.includes('.') && !username.includes('@')) {
      return username;
    }

    return 'Макар Кабанов';
  }

  getUserLevel() {
    const level = Number(this.user?.lvl);

    return Number.isFinite(level) && level > 0 ? level : 1;
  }

  getUserXp() {
    const xp = Number(this.user?.xp);

    return Number.isFinite(xp) && xp >= 0 ? xp : 0;
  }

  getXpToNextLevel() {
    const level = this.getUserLevel();
    const xp = this.getUserXp();
    const nextLevelXp = level * 50;

    return Math.max(0, nextLevelXp - xp);
  }

  getDisplayRole() {
    const user = this.user || this.readStoredUser();
    const rawRole = String(user?.globalRole || user?.role?.name || user?.role?.type || user?.role || '').trim();
    const normalizedRole = rawRole.toLowerCase().replace(/[\s-]+/g, '_');

    if (normalizedRole === 'admin') {
      return 'Админ';
    }

    if (
      normalizedRole === 'project_manager' ||
      normalizedRole === 'projectmanager' ||
      normalizedRole === 'manager'
    ) {
      return 'Проектный менеджер';
    }

    return 'Сотрудник';
  }

  getDisplayTeams() {
    return this.teams
      .map((item, index) => ({
        id: item.id,
        name: item.name || 'Команда',
        className: fallbackTeams[index % fallbackTeams.length].className,
        color: item.color || '',
        roleName: item.roleName || '',
        members: Array.isArray(item.members) ? item.members : [],
      }))
      .filter((team) => team.name);
  }

  getActiveTeam(displayTeams = this.getDisplayTeams()) {
    if (!displayTeams.length) {
      return null;
    }

    return displayTeams.find((team) => String(team.id) === String(this.selectedTeamId)) || displayTeams[0];
  }

  getDisplayRoles() {
    return this.roles
      .map((item, index) => ({
        id: item.id,
        teamName: item.teamName || '',
        name: item.name || 'Роль',
        className: index % 2 ? 'is-violet' : 'is-blue',
      }))
      .filter((role) => role.name);
  }

  formatChallengeDeadline(deadline) {
    if (!deadline) {
      return '';
    }

    const deadlineTime = new Date(deadline).getTime();

    if (!Number.isFinite(deadlineTime)) {
      return '';
    }

    const daysLeft = Math.ceil((deadlineTime - Date.now()) / 86400000);

    if (daysLeft <= 0) {
      return 'Срок сегодня';
    }

    return `Осталось ${daysLeft} ${this.getDayWord(daysLeft)}`;
  }

  getChallengeDaysLeft(deadline) {
    if (!deadline) {
      return Infinity;
    }

    const deadlineTime = new Date(deadline).getTime();

    if (!Number.isFinite(deadlineTime)) {
      return Infinity;
    }

    return Math.ceil((deadlineTime - Date.now()) / 86400000);
  }

  getDeadlineBadge(deadline) {
    const daysLeft = this.getChallengeDaysLeft(deadline);

    if (!Number.isFinite(daysLeft)) {
      return 'Без дедлайна';
    }

    return daysLeft <= 3 ? 'Дедлайн скоро' : 'Не скоро';
  }

  normalizeChallenge(entry) {
    const challenge = entry?.challenge || entry;

    if (!challenge?.title) {
      return null;
    }

    return {
      id: challenge.id || entry.id,
      documentId: challenge.documentId || entry.documentId,
      title: challenge.title,
      description: challenge.description || 'Описание появится скоро',
      type: challenge.type || '',
      difficulty: challenge.difficulty || 'Light',
      xpReward: Number(challenge.xpReward || challenge.xp_reward || 0),
      deadline: challenge.deadline || '',
      visibility: challenge.visibility || 'private',
      status: entry?.status || '',
      userChallengeId: entry?.challenge ? entry.id : entry?.userChallengeId || entry?.id,
      submittedAt: entry?.submittedAt || '',
      submissionText: entry?.submissionText || '',
      submissionLinks: entry?.submissionLinks || '',
    };
  }

  getAvailableChallengeList() {
    const selectedDifficulty = this.selectedDifficulty;

    return this.availableChallenges
      .map((entry) => this.normalizeChallenge(entry))
      .filter(Boolean)
      .filter((challenge) => {
        if (this.availableScopeFilter === 'open' && challenge.visibility !== 'public') {
          return false;
        }

        if (this.availableScopeFilter === 'private' && challenge.visibility !== 'private') {
          return false;
        }

        if (selectedDifficulty !== 'all' && challenge.difficulty !== selectedDifficulty) {
          return false;
        }

        if (this.availableDeadlineFilter === 'soon' && this.getChallengeDaysLeft(challenge.deadline) > 3) {
          return false;
        }

        if (this.availableDeadlineFilter === 'later' && this.getChallengeDaysLeft(challenge.deadline) <= 3) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (this.availableSort === 'xp') {
          return b.xpReward - a.xpReward;
        }

        return this.getChallengeDaysLeft(a.deadline) - this.getChallengeDaysLeft(b.deadline);
      });
  }

  getMyChallengeList() {
    return this.userChallenges
      .map((entry) => this.normalizeChallenge(entry))
      .filter(Boolean)
      .filter((challenge) => {
        if (this.myDeadlineFilter === 'soon' && this.getChallengeDaysLeft(challenge.deadline) > 3) {
          return false;
        }

        if (this.myDeadlineFilter === 'later' && this.getChallengeDaysLeft(challenge.deadline) <= 3) {
          return false;
        }

        if (this.selectedDifficulty !== 'all' && challenge.difficulty !== this.selectedDifficulty) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (this.mySort === 'xp') {
          return b.xpReward - a.xpReward;
        }

        return this.getChallengeDaysLeft(a.deadline) - this.getChallengeDaysLeft(b.deadline);
      });
  }

  hasChallengeSectionData() {
    return this.availableChallenges.length > 0 || this.userChallenges.length > 0;
  }

  getDayWord(value) {
    const lastDigit = value % 10;
    const lastTwoDigits = value % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'дней';
    }

    if (lastDigit === 1) {
      return 'день';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'дня';
    }

    return 'дней';
  }

  getProfileChallengeCards() {
    const realChallenges = this.userChallenges
      .map((entry) => {
        const challenge = entry.challenge || entry;

        if (!challenge?.title) {
          return null;
        }

        return {
          title: challenge.title,
          reward: `${Number(challenge.xpReward || challenge.xp_reward || 0)} XP`,
          description: challenge.description || 'Описание челленджа',
          days: this.formatChallengeDeadline(challenge.deadline),
          placeholder: false,
        };
      })
      .filter(Boolean);

    return realChallenges.length ? realChallenges : fallbackProfileChallenges;
  }

  getParticipantName(participant) {
    const username = String(participant?.username || '').trim();

    return username && !username.includes('@') ? username : username || 'Участник';
  }

  getParticipantColor(index) {
    return participantColors[index % participantColors.length];
  }

  updateActiveNavFromScroll(currentScrollY = Math.max(0, window.scrollY)) {
    if (typeof window === 'undefined') {
      return;
    }

    const sections = navItems
      .map((item) => ({
        hash: item.hash,
        element: this.querySelector(item.hash),
      }))
      .filter((item) => item.element)
      .map((item) => ({
        ...item,
        top: item.element.getBoundingClientRect().top + currentScrollY,
      }))
      .sort((a, b) => a.top - b.top);

    if (!sections.length) {
      return;
    }

    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    const sticky = this.querySelector(isMobile ? '.employee-mobile-sticky' : '.employee-desktop-topbar');
    const stickyBottom = sticky ? Math.max(0, sticky.getBoundingClientRect().bottom) : 0;
    const probeY = currentScrollY + stickyBottom + 36;
    let activeHash = sections[0].hash;

    sections.forEach((section) => {
      if (section.top <= probeY) {
        activeHash = section.hash;
      }
    });

    const documentBottom = currentScrollY + window.innerHeight;
    const isNearBottom = documentBottom >= document.documentElement.scrollHeight - 8;

    if (isNearBottom) {
      activeHash = sections[sections.length - 1].hash;
    }

    if (activeHash !== this.activeNavHash) {
      this.activeNavHash = activeHash;
    }

    this.updateFloatingSectionAction(activeHash);
  }

  getSectionLabel(key) {
    return {
      about: 'О проекте',
      challenges: 'Челленджи',
      teams: 'Команды',
      shop: 'Магазин',
      faq: 'F&Q',
    }[key];
  }

  updateFloatingSectionAction(activeHash = this.activeNavHash) {
    if (typeof window === 'undefined') {
      return;
    }

    const key = String(activeHash || '').replace('#', '');
    const label = this.getSectionLabel(key);
    const section = label ? this.querySelector(`#${key}`) : null;

    if (!section || key === 'rating') {
      if (this.floatingSectionKey) {
        this.floatingSectionKey = '';
      }
      return;
    }

    const rect = section.getBoundingClientRect();

    if (rect.bottom <= 96 || rect.top >= window.innerHeight - 96) {
      if (this.floatingSectionKey) {
        this.floatingSectionKey = '';
      }
      return;
    }

    const heading = section.querySelector('h2');
    const toggle = section.querySelector('.employee-section-toggle:not(.is-floating)');
    const isVisible = (element) => {
      if (!element) {
        return false;
      }

      const elementRect = element.getBoundingClientRect();
      return elementRect.bottom > 72 && elementRect.top < window.innerHeight - 96;
    };
    const shouldShow = !isVisible(heading) && !isVisible(toggle);

    if (shouldShow && this.floatingSectionKey !== key) {
      this.floatingSectionKey = key;
    } else if (!shouldShow && this.floatingSectionKey) {
      this.floatingSectionKey = '';
    }
  }

  handleWindowHashChange() {
    this.activeNavHash = window.location.hash || '#about';
  }

  handleNavClick(hash) {
    this.activeNavHash = hash;
    this.syncNavIndicators();
  }

  navigateToSection(hash) {
    const section = this.querySelector(hash);

    this.activeNavHash = hash;
    this.syncNavIndicators();

    if (!section) {
      return;
    }

    section.scrollIntoView({
      behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  isSectionCollapsed(key) {
    return Boolean(this.collapsedSections?.[key]);
  }

  toggleSection(key) {
    this.collapsedSections = {
      ...this.collapsedSections,
      [key]: !this.isSectionCollapsed(key),
    };

    if (!this.prefersReducedMotion()) {
      window.requestAnimationFrame(() => {
        gsap.fromTo(
          this.querySelectorAll(`[data-section-content="${key}"]`),
          { autoAlpha: 0.7, y: this.isSectionCollapsed(key) ? -8 : 8 },
          { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' },
        );
      });
    }

    this.updateComplete.then(() => this.updateFloatingSectionAction());
  }

  renderSectionToggle(key, label) {
    const collapsed = this.isSectionCollapsed(key);

    return html`
      <button class="employee-section-toggle" type="button" @click=${() => this.toggleSection(key)}>
        ${collapsed ? `↓ Раскрыть "${label}" ↓` : `↑ Скрыть "${label}" ↑`}
      </button>
    `;
  }

  renderFloatingSectionToggle() {
    const key = this.floatingSectionKey;
    const label = this.getSectionLabel(key);

    if (!key || !label) {
      return '';
    }

    const collapsed = this.isSectionCollapsed(key);

    return html`
      <button
        class="employee-section-toggle is-floating"
        type="button"
        @click=${() => this.toggleSection(key)}
      >
        ${collapsed ? `↓ Раскрыть "${label}" ↓` : `↑ Скрыть "${label}" ↑`}
      </button>
    `;
  }

  syncNavIndicators() {
    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      this.querySelectorAll('.employee-nav').forEach((nav) => {
        const activeLink = nav.querySelector('.employee-nav-link.is-active');

        if (!activeLink) {
          return;
        }

        nav.style.setProperty('--nav-indicator-x', `${activeLink.offsetLeft}px`);
        nav.style.setProperty('--nav-indicator-y', `${activeLink.offsetTop}px`);
        nav.style.setProperty('--nav-indicator-width', `${activeLink.offsetWidth}px`);
        nav.style.setProperty('--nav-indicator-height', `${activeLink.offsetHeight}px`);
      });
    });
  }

  animateInitialContent() {
    if (this.prefersReducedMotion()) {
      return;
    }

    gsap.fromTo(
      this.querySelectorAll('.employee-menu-card, .employee-hero, .employee-section'),
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.52,
        stagger: 0.035,
        ease: 'power3.out',
      },
    );
  }

  openStatusEditor() {
    this.statusEmojiInput = this.user?.statusEmoji || '😁';
    this.statusTextInput = this.user?.statusText || 'Кайфую';
    this.statusError = '';
    this.statusEditorOpen = true;
    this.avatarEditorOpen = false;
  }

  closeStatusEditor() {
    this.statusEditorOpen = false;
    this.statusError = '';
  }

  async saveStatus() {
    const statusEmoji = String(this.statusEmojiInput || '').trim();
    const statusText = String(this.statusTextInput || '').trim();

    if (!this.isSingleEmoji(statusEmoji)) {
      this.statusError = 'Нужен ровно 1 смайл';
      return;
    }

    if (!statusText) {
      this.statusError = 'Напиши текст статуса';
      return;
    }

    this.statusSaving = true;
    this.statusError = '';

    try {
      const data = await this.requestApi('/api/profile/status', {
        method: 'PUT',
        body: JSON.stringify({
          statusEmoji,
          statusText,
        }),
      });
      const nextUser = {
        ...this.user,
        ...(data.user || {}),
      };

      this.user = nextUser;
      this.syncStoredUser(nextUser);
      this.statusEditorOpen = false;
    } catch (error) {
      this.statusError = error.message || 'Не удалось сохранить статус';
    } finally {
      this.statusSaving = false;
    }
  }

  openAvatarEditor() {
    this.avatarError = '';
    this.avatarEditorOpen = true;
    this.statusEditorOpen = false;
    this.passwordEditorOpen = false;
  }

  openPasswordEditor() {
    this.passwordEditorOpen = true;
    this.avatarEditorOpen = false;
    this.statusEditorOpen = false;
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  closePasswordEditor() {
    this.passwordEditorOpen = false;
    this.newPasswordInput = '';
    this.repeatPasswordInput = '';
    this.passwordError = '';
  }

  async changePassword() {
    const password = String(this.newPasswordInput || '');
    const passwordConfirmation = String(this.repeatPasswordInput || '');

    if (!password || !passwordConfirmation) {
      this.passwordError = 'Заполни все поля';
      return;
    }

    if (password !== passwordConfirmation) {
      this.passwordError = 'Новый пароль и повтор не совпадают';
      return;
    }

    this.passwordSaving = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    try {
      await this.requestApi('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ password, passwordConfirmation }),
      });

      this.passwordSuccess = 'Пароль изменен';
      this.newPasswordInput = '';
      this.repeatPasswordInput = '';
      this.passwordEditorOpen = false;
    } catch (error) {
      this.passwordError = error.message || 'Не удалось изменить пароль';
    } finally {
      this.passwordSaving = false;
    }
  }

  closeAvatarEditor() {
    this.avatarEditorOpen = false;
    this.avatarError = '';
    this.revokeAvatarPreview();
    this.avatarPreviewUrl = '';
    this.avatarCropX = 0;
    this.avatarCropY = 0;
    this.avatarScale = 1;
  }

  revokeAvatarPreview() {
    if (this.avatarPreviewUrl) {
      URL.revokeObjectURL(this.avatarPreviewUrl);
    }
  }

  handleAvatarFileChange(event) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.avatarError = 'Выбери изображение';
      return;
    }

    this.revokeAvatarPreview();
    this.avatarPreviewUrl = URL.createObjectURL(file);
    this.avatarCropX = 0;
    this.avatarCropY = 0;
    this.avatarScale = 1;
    this.avatarError = '';

    const image = new Image();
    image.onload = () => {
      this.avatarNaturalWidth = image.naturalWidth;
      this.avatarNaturalHeight = image.naturalHeight;
    };
    image.src = this.avatarPreviewUrl;
  }

  handleAvatarPointerDown(event) {
    if (!this.avatarPreviewUrl || (event.button !== undefined && event.button !== 0)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    this.avatarDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: this.avatarCropX,
      originY: this.avatarCropY,
    };

    window.addEventListener('pointermove', this.handleAvatarPointerMove);
    window.addEventListener('pointerup', this.handleAvatarPointerUp);
    window.addEventListener('pointercancel', this.handleAvatarPointerUp);
  }

  handleAvatarPointerMove(event) {
    if (!this.avatarDrag || event.pointerId !== this.avatarDrag.pointerId) {
      return;
    }

    this.avatarCropX = Math.max(
      -120,
      Math.min(120, this.avatarDrag.originX + event.clientX - this.avatarDrag.startX),
    );
    this.avatarCropY = Math.max(
      -120,
      Math.min(120, this.avatarDrag.originY + event.clientY - this.avatarDrag.startY),
    );
  }

  handleAvatarPointerUp(event) {
    if (this.avatarDrag && event.pointerId !== this.avatarDrag.pointerId) {
      return;
    }

    this.avatarDrag = null;
    window.removeEventListener('pointermove', this.handleAvatarPointerMove);
    window.removeEventListener('pointerup', this.handleAvatarPointerUp);
    window.removeEventListener('pointercancel', this.handleAvatarPointerUp);
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async createCroppedAvatarBlob() {
    const image = await this.loadImage(this.avatarPreviewUrl);
    const outputSize = 512;
    const canvas = document.createElement('canvas');
    const cropWindow = this.querySelector('.employee-avatar-crop-window');
    const previewSize = cropWindow?.clientWidth || 240;
    const offsetScale = outputSize / previewSize;
    const coverScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight);
    const drawScale = coverScale * this.avatarScale;
    const drawWidth = image.naturalWidth * drawScale;
    const drawHeight = image.naturalHeight * drawScale;
    const drawX = (outputSize - drawWidth) / 2 + this.avatarCropX * offsetScale;
    const drawY = (outputSize - drawHeight) / 2 + this.avatarCropY * offsetScale;

    canvas.width = outputSize;
    canvas.height = outputSize;
    canvas.getContext('2d').drawImage(image, drawX, drawY, drawWidth, drawHeight);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
    });
  }

  async saveAvatar() {
    if (!this.avatarPreviewUrl) {
      this.avatarError = 'Сначала выбери изображение';
      return;
    }

    this.avatarSaving = true;
    this.avatarError = '';

    try {
      const blob = await this.createCroppedAvatarBlob();
      const formData = new FormData();

      if (!blob) {
        throw new Error('Не удалось кадрировать изображение');
      }

      formData.append('avatar', blob, 'avatar.png');

      const data = await this.requestApi('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const nextUser = {
        ...this.user,
        ...(data.user || {}),
      };

      this.user = nextUser;
      this.syncStoredUser(nextUser);
      this.closeAvatarEditor();
    } catch (error) {
      this.avatarError = error.message || 'Не удалось сохранить аватарку';
    } finally {
      this.avatarSaving = false;
    }
  }

  logout() {
    window.localStorage.removeItem('auth.jwt');
    window.localStorage.removeItem('auth.user');
    window.sessionStorage.removeItem('auth.jwt');
    window.sessionStorage.removeItem('auth.user');
    window.location.assign('/');
  }

  stopChallengeCarousel() {
    if (this.profileChallengeTimer) {
      window.clearInterval(this.profileChallengeTimer);
      this.profileChallengeTimer = null;
    }
  }

  startChallengeCarousel() {
    this.stopChallengeCarousel();

    if (this.prefersReducedMotion()) {
      return;
    }

    const cards = this.getProfileChallengeCards();

    if (cards.length < 2) {
      return;
    }

    this.profileChallengeTimer = window.setInterval(() => {
      this.showProfileChallenge((this.profileChallengeIndex + 1) % cards.length, 1);
    }, 5000);
  }

  async showProfileChallenge(nextIndex, direction = 1) {
    const cards = this.getProfileChallengeCards();

    if (nextIndex === this.profileChallengeIndex || nextIndex < 0 || nextIndex >= cards.length) {
      return;
    }

    if (this.prefersReducedMotion()) {
      this.profileChallengeIndex = nextIndex;
      return;
    }

    this.profileChallengeAnimation?.kill();
    const outgoingCards = this.querySelectorAll('.employee-menu-challenge');

    await new Promise((resolve) => {
      this.profileChallengeAnimation = gsap.to(outgoingCards, {
        autoAlpha: 0,
        x: -34 * direction,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: resolve,
      });
    });

    this.profileChallengeIndex = nextIndex;
    await this.updateComplete;

    this.profileChallengeAnimation = gsap.fromTo(
      this.querySelectorAll('.employee-menu-challenge'),
      { autoAlpha: 0, x: 34 * direction },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.34,
        ease: 'power3.out',
        onComplete: () => {
          this.profileChallengeAnimation = null;
        },
      },
    );
  }

  getMobileProfileDetails() {
    return this.querySelector('.employee-mobile-sticky .employee-profile-details');
  }

  async openMobileProfile() {
    this.profileAnimation?.kill();
    this.mobileHeaderLockUntil = Date.now() + 700;
    this.lastScrollY = Math.max(0, window.scrollY);
    this.mobileHeaderHidden = false;
    this.profileMenuOpen = true;
    await this.updateComplete;

    const details = this.getMobileProfileDetails();

    if (!details) {
      return;
    }

    this.profileAnimation = gsap.fromTo(
      details,
      { height: 0, opacity: 0, y: -8, overflow: 'hidden' },
      {
        height: 'auto',
        opacity: 1,
        y: 0,
        duration: 0.34,
        ease: 'power3.out',
        clearProps: 'height,opacity,transform,overflow',
      },
    );
  }

  closeMobileProfile({ fromScroll = false } = {}) {
    this.mobileHeaderLockUntil = Date.now() + 450;
    this.lastScrollY = Math.max(0, window.scrollY);
    const details = this.getMobileProfileDetails();
    this.mobileProfileClosing = true;

    if (!details) {
      this.profileMenuOpen = false;
      this.mobileProfileClosing = false;
      if (fromScroll) {
        this.mobileHeaderHidden = true;
      }
      return;
    }

    this.profileAnimation?.kill();

    if (this.prefersReducedMotion()) {
      gsap.set(details, { clearProps: 'height,opacity,transform,overflow' });
      this.profileMenuOpen = false;
      this.profileAnimation = null;
      this.mobileProfileClosing = false;
      if (fromScroll) {
        this.mobileHeaderHidden = true;
      }
      return;
    }

    this.profileAnimation = gsap.to(details, {
      height: 0,
      opacity: 0,
      y: -8,
      overflow: 'hidden',
      duration: 0.26,
      ease: 'power2.inOut',
      onComplete: () => {
        this.profileMenuOpen = false;
        this.profileAnimation = null;
        this.mobileProfileClosing = false;
        if (fromScroll) {
          this.mobileHeaderHidden = true;
        }
      },
    });
  }

  renderAvatar() {
    const avatarUrl = this.getAvatarUrl();

    return html`
      <div class="employee-avatar" aria-hidden=${avatarUrl ? 'false' : 'true'}>
        ${avatarUrl
          ? html`<img src=${avatarUrl} alt="Аватар сотрудника" />`
          : html`<span>excess</span>`}
      </div>
    `;
  }

  renderStatusEditor() {
    if (!this.statusEditorOpen) {
      return '';
    }

    return html`
      <div class="employee-profile-editor" data-profile-editor>
        <label>
          <span>Смайл</span>
          <input
            class="employee-status-emoji-input"
            type="text"
            maxlength="8"
            inputmode="text"
            .value=${this.statusEmojiInput}
            @input=${(event) => {
              this.statusEmojiInput = event.currentTarget.value;
            }}
          />
        </label>
        <label>
          <span>Статус</span>
          <input
            type="text"
            maxlength="48"
            .value=${this.statusTextInput}
            @input=${(event) => {
              this.statusTextInput = event.currentTarget.value;
            }}
          />
        </label>
        ${this.statusError
          ? html`<p class="employee-editor-error" role="alert">${this.statusError}</p>`
          : ''}
        <div class="employee-editor-actions">
          <button type="button" @click=${() => this.saveStatus()} ?disabled=${this.statusSaving}>
            ${this.statusSaving ? 'Сохраняю' : 'Сохранить'}
          </button>
          <button type="button" @click=${() => this.closeStatusEditor()}>Отмена</button>
        </div>
      </div>
    `;
  }

  renderAvatarEditor() {
    if (!this.avatarEditorOpen) {
      return '';
    }

    return html`
      <div class="employee-profile-editor employee-avatar-editor" data-profile-editor>
        <label class="employee-avatar-file">
          <span>Загрузить аву</span>
          <input
            class="employee-avatar-file-input"
            type="file"
            accept="image/*"
            @change=${this.handleAvatarFileChange}
          />
        </label>

        ${this.avatarPreviewUrl
          ? html`
              <div
                class="employee-avatar-crop-window"
                @pointerdown=${this.handleAvatarPointerDown}
              >
                <img
                  src=${this.avatarPreviewUrl}
                  alt=""
                  draggable="false"
                  style=${`transform: translate(${this.avatarCropX}px, ${this.avatarCropY}px) scale(${this.avatarScale});`}
                />
              </div>
              <label class="employee-avatar-zoom">
                <span>Масштаб</span>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  .value=${String(this.avatarScale)}
                  @input=${(event) => {
                    this.avatarScale = Number(event.currentTarget.value);
                  }}
                />
              </label>
            `
          : ''}

        ${this.avatarError
          ? html`<p class="employee-editor-error" role="alert">${this.avatarError}</p>`
          : ''}
        <div class="employee-editor-actions">
          <button type="button" @click=${() => this.saveAvatar()} ?disabled=${this.avatarSaving}>
            ${this.avatarSaving ? 'Сохраняю' : 'Сохранить'}
          </button>
          <button type="button" @click=${() => this.closeAvatarEditor()}>Отмена</button>
        </div>
      </div>
    `;
  }

  renderProfileChallenge() {
    const cards = this.getProfileChallengeCards();
    const activeIndex = Math.min(this.profileChallengeIndex, cards.length - 1);
    const challenge = cards[activeIndex] || cards[0];
    const indicatorCount = Math.min(cards.length, 10);
    const activeIndicatorIndex = indicatorCount ? activeIndex % indicatorCount : 0;

    return html`
      <div class="employee-menu-challenge">
        <div class="employee-menu-challenge-meta">
          ${challenge.days ? html`<span>${challenge.days}</span>` : ''}
          <span>Награда: ${challenge.reward}</span>
        </div>
        <strong>${challenge.title}</strong>
        <p>${challenge.description}</p>
      </div>

      <div class="employee-menu-progress" aria-label="Челленджи в профиле">
        ${Array.from({ length: indicatorCount }, (_, index) => index).map(
          (_, index) => html`
            <button
              class=${index === activeIndicatorIndex ? 'is-active' : ''}
              type="button"
              aria-label=${`Показать челлендж ${index + 1}`}
              style=${index === activeIndicatorIndex ? `--progress-duration: 5s;` : ''}
              @click=${() => {
                this.stopChallengeCarousel();
                this.showProfileChallenge(index, index > activeIndex ? 1 : -1);
                this.startChallengeCarousel();
              }}
            ></button>
          `,
        )}
      </div>
    `;
  }

  renderDailyProfileBlock() {
    const today = this.daily?.today || null;
    const statusLabel = this.getDailyStatusLabel(today?.status);
    const canCheckin = !today || today.status === 'rejected';

    return html`
      <div class="employee-profile-daily">
        <div>
          <span>Дейлик</span>
          <strong>${statusLabel}</strong>
          <small>Награда: 10 XP</small>
        </div>
        ${canCheckin
          ? html`
              <button type="button" @click=${() => this.checkinDaily()} ?disabled=${this.dailyCheckinSaving}>
                ${this.dailyCheckinSaving ? '...' : 'Отметить'}
              </button>
            `
          : ''}
      </div>
      ${this.dailyCheckinError
        ? html`<p class="employee-editor-error" role="alert">${this.dailyCheckinError}</p>`
        : ''}
      ${this.dailyCheckinSuccess ? html`<p class="employee-password-success">${this.dailyCheckinSuccess}</p>` : ''}
    `;
  }

  renderEmptyHint() {
    return html`<p class="employee-empty-note">Ой! Кажется, тут пусто :(</p>`;
  }

  renderPasswordEditor() {
    if (!this.passwordEditorOpen) {
      return '';
    }

    return html`
      <div class="employee-profile-editor" data-profile-editor>
        <label>
          <span>Новый пароль</span>
          <input
            type="password"
            autocomplete="new-password"
            .value=${this.newPasswordInput}
            @input=${(event) => {
              this.newPasswordInput = event.currentTarget.value;
            }}
          />
        </label>
        <label>
          <span>Повтори новый пароль</span>
          <input
            type="password"
            autocomplete="new-password"
            .value=${this.repeatPasswordInput}
            @input=${(event) => {
              this.repeatPasswordInput = event.currentTarget.value;
            }}
          />
        </label>
        ${this.passwordError
          ? html`<p class="employee-editor-error" role="alert">${this.passwordError}</p>`
          : ''}
        <div class="employee-editor-actions">
          <button type="button" @click=${() => this.changePassword()} ?disabled=${this.passwordSaving}>
            ${this.passwordSaving ? 'Сохраняю' : 'Сохранить'}
          </button>
          <button type="button" @click=${() => this.closePasswordEditor()}>Отмена</button>
        </div>
      </div>
    `;
  }

  renderProfileCard({ expanded = this.profileMenuOpen, collapsible = true } = {}) {
    const displayRole = this.getDisplayRole();
    const displayName = this.getDisplayName();
    const statusEmoji = this.user?.statusEmoji || '😁';
    const statusText = this.user?.statusText || 'Кайфую';
    const level = this.getUserLevel();
    const xp = this.getUserXp();
    const teams = this.getDisplayTeams();
    const roles = this.getDisplayRoles();

    return html`
      <article
        class=${`employee-profile-card employee-menu-card ${expanded ? 'is-expanded' : 'is-collapsed'}`}
        aria-label="Профиль сотрудника"
      >
        <div class="employee-menu-head">
          ${this.renderAvatar()}
          <div class="employee-menu-intro">
            <div class="employee-status-row">
              <span class="employee-position-pill">${displayRole}</span>
              <span class="employee-mood-pill">${statusEmoji} ${statusText}</span>
            </div>
            <h2>${displayName}</h2>
            <p class="employee-xp-line">Уровень ${level} | ${xp} XP</p>
          </div>
        </div>

        <div class="employee-profile-details">
              <div class="employee-profile-actions">
                <button type="button" @click=${() => this.openStatusEditor()}>Изменить статус</button>
                <button type="button" @click=${() => this.openAvatarEditor()}>Изменить аватарку</button>
              </div>

              ${this.renderStatusEditor()}
              ${this.renderAvatarEditor()}

              <div class="employee-profile-block">
                <h3>Мои команды</h3>
                ${teams.length
                  ? html`
                      <div class="employee-team-tags">
                        ${teams.map(
                          (team) => html`
                            <span class=${team.className} style=${team.color ? `background: ${team.color};` : ''}>
                              ${team.name}
                            </span>
                          `,
                        )}
                      </div>
                    `
                  : this.renderEmptyHint()}
              </div>

              <div class="employee-profile-block">
                <h3>Мои роли</h3>
                <p class="employee-role-note">Назначаются Проектным менеджером</p>
                ${roles.length
                  ? html`
                      <div class="employee-role-tags">
                        ${roles.map(
                          (role) => html`
                            <span class=${role.className}>
                              ${role.teamName ? html`<small>${role.teamName}</small>` : ''}
                              ${role.name}
                            </span>
                          `,
                        )}
                      </div>
                    `
                  : this.renderEmptyHint()}
              </div>

              <div class="employee-profile-block">
                <h3>Мои челленджи</h3>
                ${this.renderProfileChallenge()}
              </div>

              <div class="employee-profile-block">
                <h3>Дейлик</h3>
                ${this.renderDailyProfileBlock()}
              </div>

              <div class="employee-menu-actions">
                <button type="button" @click=${() => this.logout()}>Выйти</button>
                ${this.renderPasswordEditor()}
                <button type="button" @click=${() => this.openPasswordEditor()}>Восстановить пароль</button>
                ${this.passwordSuccess ? html`<p class="employee-password-success">${this.passwordSuccess}</p>` : ''}
              </div>
        </div>

        ${collapsible
          ? html`
              <button
                class="employee-menu-toggle"
                type="button"
                @click=${() => {
                  if (expanded) {
                    this.closeMobileProfile();
                    return;
                  }

                  this.openMobileProfile();
                }}
              >
                ${expanded ? '↑ Скрыть ↑' : '↓ Раскрыть ↓'}
              </button>
            `
          : ''}
      </article>
    `;
  }

  renderStickyHeader() {
    return html`
      <div class=${`employee-mobile-sticky ${this.mobileHeaderHidden ? 'is-hidden' : ''}`}>
        ${this.renderTopbar()}
        <div class="employee-profile-panel">
          ${this.renderProfileCard()}
        </div>
      </div>
    `;
  }

  renderTopbar() {
    return html`
      <header class="employee-topbar">
        <a class="employee-brand" href="/employee">
          <span>Фабрика решений</span>
        </a>

        <nav class="employee-nav" aria-label="Разделы кабинета">
          <span class="employee-nav-indicator" aria-hidden="true"></span>
          ${navItems.map(
            (item) => html`
              <a
                class=${`employee-nav-link ${this.activeNavHash === item.hash ? 'is-active' : ''}`}
                href=${item.hash}
                @click=${() => this.handleNavClick(item.hash)}
              >
                ${item.label}
              </a>
            `,
          )}
        </nav>
      </header>
    `;
  }

  renderVisual(type) {
    return html`
      <div class=${`employee-visual ${type}`} aria-hidden="true">
        <span class="shape one"></span>
        <span class="shape two"></span>
        <span class="shape three"></span>
        <span class="shape four"></span>
      </div>
    `;
  }

  renderFilterButton(group, value, label) {
    const activeValue = this[group];

    return html`
      <button
        class=${activeValue === value ? 'is-active' : ''}
        type="button"
        @click=${() => {
          this[group] = value;
        }}
      >
        ${label}
      </button>
    `;
  }

  renderFilterToggle(kind = 'available') {
    const property = kind === 'available' ? 'availableFiltersOpen' : 'myFiltersOpen';
    const isOpen = this[property];

    return html`
      <button
        class=${`employee-filter-toggle ${isOpen ? 'is-active' : ''}`}
        type="button"
        @click=${() => {
          this[property] = !isOpen;
        }}
      >
        Фильтры
      </button>
    `;
  }

  renderChallengeFilters(kind = 'available') {
    const isAvailable = kind === 'available';
    const isOpen = isAvailable ? this.availableFiltersOpen : this.myFiltersOpen;

    if (!isOpen) {
      return '';
    }

    return html`
      <div class="employee-challenge-filters">
        ${isAvailable
          ? html`
              <div>
                ${this.renderFilterButton('availableScopeFilter', 'all', 'Все')}
                ${this.renderFilterButton('availableScopeFilter', 'open', 'Открытые')}
                ${this.renderFilterButton('availableScopeFilter', 'private', 'Личные')}
              </div>
            `
          : ''}
        <div>
          ${this.renderFilterButton(
            isAvailable ? 'availableDeadlineFilter' : 'myDeadlineFilter',
            'all',
            'Все сроки',
          )}
          ${this.renderFilterButton(
            isAvailable ? 'availableDeadlineFilter' : 'myDeadlineFilter',
            'soon',
            'Скоро дедлайн',
          )}
          ${this.renderFilterButton(
            isAvailable ? 'availableDeadlineFilter' : 'myDeadlineFilter',
            'later',
            'Не скоро',
          )}
        </div>
        <div>
          ${this.renderFilterButton('selectedDifficulty', 'all', 'Все уровни')}
          ${levelCards.map((level) =>
            this.renderFilterButton('selectedDifficulty', level.difficulty, level.title),
          )}
        </div>
        <label>
          <span>Сортировка</span>
          <select
            .value=${isAvailable ? this.availableSort : this.mySort}
            @change=${(event) => {
              if (isAvailable) {
                this.availableSort = event.currentTarget.value;
              } else {
                this.mySort = event.currentTarget.value;
              }
            }}
          >
            <option value="deadline">По дедлайну</option>
            <option value="xp">По XP</option>
          </select>
        </label>
      </div>
    `;
  }

  renderChallengeCard(challenge, variant = '') {
    const deadline = this.formatChallengeDeadline(challenge.deadline);
    const isPrivate = challenge.visibility === 'private';

    return html`
      <article class=${`employee-challenge-card ${variant}`}>
        <div class="employee-challenge-card-meta">
          ${deadline ? html`<span>${deadline}</span>` : html`<span>Без дедлайна</span>`}
          <span>${challenge.difficulty || 'Light'}</span>
        </div>
        <h3>${challenge.title}</h3>
        <p class="challenge-reward">Награда: ${Number(challenge.xpReward || 0)} XP</p>
        <p class="challenge-desc">${challenge.description}</p>
        <div class="employee-challenge-card-bottom">
          <span>${isPrivate ? 'Личный' : 'Открытый'}</span>
          <button type="button">Принять участие</button>
        </div>
      </article>
    `;
  }

  renderMyChallengeCard(challenge) {
    return html`
      <article class="employee-my-challenge-card">
        <div class="employee-my-challenge-top">
          <span>${this.getDeadlineBadge(challenge.deadline)}</span>
          <span>${challenge.difficulty || 'Light'}</span>
        </div>
        <h3>${challenge.title}</h3>
        <p class="challenge-reward">Награда: ${Number(challenge.xpReward || 0)} XP</p>
        <p class="challenge-desc">${challenge.description}</p>
        <div class="employee-my-challenge-bottom">
          <span>${challenge.status || 'pending'}</span>
          <button type="button" @click=${() => this.openChallengeSubmission(challenge)}>
            Я выполнил
          </button>
        </div>
      </article>
    `;
  }

  openChallengeSubmission(challenge) {
    this.challengeSubmissionTarget = challenge;
    this.challengeSubmissionText = challenge.submissionText || '';
    this.challengeSubmissionLinks = challenge.submissionLinks || '';
    this.challengeSubmissionError = '';
    this.challengeSubmissionSuccess = '';
    this.challengeSubmissionOpen = true;
  }

  closeChallengeSubmission() {
    if (this.challengeSubmissionSaving) {
      return;
    }

    this.challengeSubmissionOpen = false;
    this.challengeSubmissionTarget = null;
    this.challengeSubmissionText = '';
    this.challengeSubmissionLinks = '';
    this.challengeSubmissionError = '';
    this.challengeSubmissionSuccess = '';
  }

  async submitChallengeCompletion() {
    const target = this.challengeSubmissionTarget;
    const userChallengeId = Number(target?.userChallengeId);

    if (!Number.isFinite(userChallengeId) || userChallengeId <= 0) {
      this.challengeSubmissionError = 'Не найден челлендж пользователя';
      return;
    }

    this.challengeSubmissionSaving = true;
    this.challengeSubmissionError = '';
    this.challengeSubmissionSuccess = '';

    try {
      const data = await this.requestApi('/api/profile/challenge-submission', {
        method: 'POST',
        body: JSON.stringify({
          userChallengeId,
          submissionText: this.challengeSubmissionText,
          submissionLinks: this.challengeSubmissionLinks,
        }),
      });
      const updatedEntry = data.userChallenge;

      if (updatedEntry) {
        this.userChallenges = this.userChallenges.map((entry) =>
          entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry,
        );
      }

      this.challengeSubmissionSuccess = 'Отправлено на проверку';
      window.setTimeout(() => this.closeChallengeSubmission(), 650);
    } catch (error) {
      this.challengeSubmissionError = error.message || 'Не удалось отправить';
    } finally {
      this.challengeSubmissionSaving = false;
    }
  }

  renderChallengeSubmissionModal() {
    if (!this.challengeSubmissionOpen || !this.challengeSubmissionTarget) {
      return '';
    }

    return html`
      <div
        class="employee-modal-backdrop"
        role="presentation"
        @click=${(event) => {
          if (event.target === event.currentTarget) {
            this.closeChallengeSubmission();
          }
        }}
      >
        <section class="employee-modal employee-submission-modal" role="dialog" aria-modal="true">
          <h3>${this.challengeSubmissionTarget.title}</h3>
          <label>
            <span>Описание результата</span>
            <textarea
              .value=${this.challengeSubmissionText}
              @input=${(event) => {
                this.challengeSubmissionText = event.currentTarget.value;
              }}
            ></textarea>
          </label>
          <label>
            <span>Ссылки</span>
            <textarea
              .value=${this.challengeSubmissionLinks}
              @input=${(event) => {
                this.challengeSubmissionLinks = event.currentTarget.value;
              }}
            ></textarea>
          </label>
          ${this.challengeSubmissionError
            ? html`<p class="employee-form-error">${this.challengeSubmissionError}</p>`
            : ''}
          ${this.challengeSubmissionSuccess
            ? html`<p class="employee-form-success">${this.challengeSubmissionSuccess}</p>`
            : ''}
          <div class="employee-modal-actions">
            <button
              type="button"
              @click=${() => this.submitChallengeCompletion()}
              ?disabled=${this.challengeSubmissionSaving}
            >
              ${this.challengeSubmissionSaving ? 'Отправляю...' : 'Отправить'}
            </button>
            <button type="button" @click=${() => this.closeChallengeSubmission()}>Отмена</button>
          </div>
        </section>
      </div>
    `;
  }

  renderLevelCards() {
    return html`
      <div class="employee-levels">
        ${levelCards.map(
          (level) => html`
            <article
              class=${`${level.className} ${this.selectedDifficulty === level.difficulty ? 'is-active' : ''}`}
              role="button"
              tabindex="0"
              @click=${() => {
                this.selectedDifficulty =
                  this.selectedDifficulty === level.difficulty ? 'all' : level.difficulty;
              }}
              @keydown=${(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  this.selectedDifficulty =
                    this.selectedDifficulty === level.difficulty ? 'all' : level.difficulty;
                }
              }}
            >
              <h3>${level.title}</h3>
              <p>${level.text}</p>
            </article>
          `,
        )}
      </div>
    `;
  }

  renderTeamPreview(team) {
    const members = Array.isArray(team.members) ? team.members : [];
    const manager =
      members.find((member) => member.roleName === 'Проектный менеджер') ||
      members.find((member) => member.globalRole === 'project_manager') ||
      members[0];
    const managerAvatarUrl = this.getMediaUrl(manager?.avatar);

    return html`
      <article class="employee-team-card" style=${team.color ? `--team-color: ${team.color};` : ''}>
        <div class="team-list">
          <h3>${team.name}</h3>
          <p>Участники</p>
          ${members.map((member, index) => {
            const avatarUrl = this.getMediaUrl(member.avatar);
            const name = this.getParticipantName(member);

            return html`
              <div class="team-member-row">
                <span style=${`--participant-color: ${this.getParticipantColor(index)};`}>
                  ${avatarUrl ? html`<img src=${avatarUrl} alt="" />` : name.slice(0, 1).toUpperCase()}
                </span>
                <strong>${name}</strong>
                <em>${member.roleName || 'Участник'}</em>
              </div>
            `;
          })}
        </div>

        <div class="team-owner">
          <p>Проектный менеджер</p>
          ${managerAvatarUrl
            ? html`<img class="team-owner-avatar" src=${managerAvatarUrl} alt="" loading="lazy" />`
            : html`
                <div class="team-owner-visual" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              `}
          <p>${manager?.roleName || 'Участник'}</p>
          <strong>${manager ? this.getParticipantName(manager) : 'Команда'}</strong>
        </div>
      </article>
    `;
  }

  renderTeamSectionHeader(displayTeams) {
    return html`
      <div class="employee-title-row employee-team-title-row">
        <h2>Команды</h2>
        ${displayTeams.length > 1
          ? html`
              <label class="employee-team-switcher">
                <span>Сменить команду</span>
                <select
                  .value=${String(this.getActiveTeam(displayTeams)?.id || '')}
                  @change=${(event) => {
                    this.selectedTeamId = event.currentTarget.value;
                  }}
                >
                  ${displayTeams.map((team) => html`<option value=${team.id}>${team.name}</option>`)}
                </select>
              </label>
            `
          : ''}
      </div>
    `;
  }

  renderParticipantRating() {
    const participants = this.participantRating.slice(0, 10);
    const visibleParticipants = this.expandedRating ? participants : participants.slice(0, 3);

    if (!participants.length) {
      return this.renderEmptyHint();
    }

    return html`
      ${visibleParticipants.map((participant, index) => {
        const name = this.getParticipantName(participant);
        const avatarUrl = this.getMediaUrl(participant.avatar);
        const xp = Number(participant.xp || 0);

        return html`
          <div
            class=${index === 0 ? 'top-team-row is-first' : 'top-team-row'}
            style=${`--participant-color: ${this.getParticipantColor(index)};`}
          >
            <span class="top-team-rank">${index + 1}</span>
            <span class="top-team-avatar">
              ${avatarUrl
                ? html`<img src=${avatarUrl} alt="" />`
                : html`<i>${name.slice(0, 1).toUpperCase()}</i>`}
            </span>
            <strong>${name}</strong>
            <em>${Number.isFinite(xp) ? xp : 0} XP</em>
          </div>
        `;
      })}
      ${participants.length > 3
        ? html`
            <button
              class="employee-rating-toggle"
              type="button"
              @click=${() => {
                this.expandedRating = !this.expandedRating;
              }}
            >
              ${this.expandedRating ? 'Свернуть' : 'Раскрыть'}
            </button>
          `
        : ''}
    `;
  }

  getDailyStatusLabel(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'approved') {
      return 'Подтверждено';
    }

    if (normalized === 'pending') {
      return 'Ожидает подтверждения';
    }

    if (normalized === 'rejected') {
      return 'Отклонено';
    }

    return 'Не отмечено';
  }

  renderDailySection() {
    const today = this.daily?.today || null;
    const monthStats = this.daily?.monthStats || {};
    const pendingForPm = Array.isArray(this.daily?.pendingForPm) ? this.daily.pendingForPm : [];
    const statusLabel = this.getDailyStatusLabel(today?.status);
    const canCheckin = !today || today.status === 'rejected';

    return html`
      <div class="employee-daily-grid">
        <article class="employee-daily-card">
          <h3>Сегодня</h3>
          <p class="employee-daily-status">Статус: <strong>${statusLabel}</strong></p>
          <p class="employee-daily-meta">Награда: 10 XP</p>
          ${this.dailyCheckinError ? html`<p class="employee-editor-error" role="alert">${this.dailyCheckinError}</p>` : ''}
          ${this.dailyCheckinSuccess ? html`<p class="employee-form-success">${this.dailyCheckinSuccess}</p>` : ''}
          ${canCheckin
            ? html`
                <button type="button" @click=${() => this.checkinDaily()} ?disabled=${this.dailyCheckinSaving}>
                  ${this.dailyCheckinSaving ? 'Отмечаю...' : 'Отметить участие'}
                </button>
              `
            : ''}
        </article>

        <article class="employee-daily-card is-stats">
          <h3>Статистика месяца</h3>
          <p>Подтверждено: <strong>${Number(monthStats.approvedCount || 0)}</strong></p>
          <p>Серия: <strong>${Number(monthStats.streak || 0)}</strong> дн.</p>
          <p>Получено: <strong>${Number(monthStats.xpFromDailies || 0)}</strong> XP</p>
        </article>
      </div>

      ${pendingForPm.length
        ? html`
            <div class="employee-subsection">
              <h2>На подтверждение</h2>
              <div class="employee-daily-queue">
                ${pendingForPm.map((entry) => {
                  const name = entry.user?.username || entry.user?.email || 'Участник';
                  return html`
                    <div class="employee-daily-queue-row">
                      <div>
                        <strong>${name}</strong>
                        <p>${entry.day} · ${Number(entry.points || 0)} XP</p>
                      </div>
                      <div class="employee-daily-queue-actions">
                        <button
                          type="button"
                          @click=${() => this.approveDailyCheckin(entry.id, 'approve')}
                          ?disabled=${this.dailyCheckinSaving}
                        >
                          Подтвердить
                        </button>
                        <button
                          type="button"
                          @click=${() => this.approveDailyCheckin(entry.id, 'reject')}
                          ?disabled=${this.dailyCheckinSaving}
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>
          `
        : ''}
    `;
  }

  renderAchievementsSection() {
    const achievements = Array.isArray(this.achievements) ? this.achievements : [];

    return html`
      ${achievements.length
        ? html`
            <div class="employee-badges" aria-label="Достижения">
              ${achievements.map((achievement) => {
                const unlocked = Boolean(achievement.unlocked);
                const progress = achievement.progress;
                const current = Number(progress?.current || 0);
                const target = Number(progress?.target || 0);
                const percent = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

                return html`
                  <article class=${`employee-badge ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    ${unlocked && achievement.earnedAt
                      ? html`<p class="employee-badge-earned">Получено: ${String(achievement.earnedAt).slice(0, 10)}</p>`
                      : ''}
                    ${!unlocked && progress
                      ? html`
                          <p class="employee-badge-progress">
                            Прогресс: ${current}/${target}
                          </p>
                          <div class="employee-progress" aria-hidden="true">
                            <span style=${`width: ${percent}%;`}></span>
                          </div>
                        `
                      : ''}
                  </article>
                `;
              })}
            </div>
          `
        : this.renderEmptyHint()}
    `;
  }

  renderShopCards() {
    if (!this.shopCards.length) {
      return this.renderEmptyHint();
    }

    return html`
      <div class="employee-shop-grid">
        ${this.shopCards.map((card, cardIndex) => {
          const gallery = [
            ...(Array.isArray(card.gallery) ? card.gallery : []),
            this.getMediaUrl(card.photo),
          ].filter(Boolean);
          const normalizedGallery = gallery.length
            ? gallery
            : [shopFallbackGallery[cardIndex % shopFallbackGallery.length]];
          const mediaSlides = [
            ...(card.splineUrl ? [{ type: 'spline', src: card.splineUrl }] : []),
            ...normalizedGallery.map((src) => ({ type: 'photo', src })),
          ];
          const cardKey = card.id || cardIndex;
          const mediaIndex = (this.shopPhotoIndexes[cardKey] || 0) % mediaSlides.length;
          const activeMedia = mediaSlides[mediaIndex];
          const isAvailable = card.status === 'available';
          const price = Number.isFinite(card.price) ? card.price : 0;

          return html`
            <article class="employee-shop-card">
              <div class="employee-shop-media">
                ${activeMedia.type === 'spline'
                  ? html`<iframe title=${`${card.name} 3D`} src=${activeMedia.src} loading="lazy"></iframe>`
                  : html`<img src=${activeMedia.src} alt="" loading="lazy" />`}
                ${mediaSlides.length > 1
                  ? html`
                      <div class="employee-shop-photo-actions">
                        <button
                          type="button"
                          aria-label="Предыдущий слайд"
                          @click=${() => this.moveShopPhoto(cardKey, -1, mediaSlides.length)}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label="Следующий слайд"
                          @click=${() => this.moveShopPhoto(cardKey, 1, mediaSlides.length)}
                        >
                          ›
                        </button>
                      </div>
                    `
                  : ''}
              </div>
              <div>
                <div class="employee-shop-meta">
                  <span>${isAvailable ? 'Доступно' : 'Нет в наличии'}</span>
                  <strong>Стоимость: ${price} XP</strong>
                </div>
                <h3>${card.name}</h3>
                <p>${card.description || 'Описание появится скоро'}</p>
                <button class="employee-shop-exchange" type="button" ?disabled=${!isAvailable}>
                  ${isAvailable ? 'Обменять' : 'Недоступно'}
                </button>
              </div>
            </article>
          `;
        })}
      </div>
    `;
  }

  moveShopPhoto(cardKey, direction, count) {
    const current = this.shopPhotoIndexes[cardKey] || 0;

    this.shopPhotoIndexes = {
      ...this.shopPhotoIndexes,
      [cardKey]: (current + direction + count) % count,
    };
  }

  renderGigaChatBadge() {
    return html`
      <span class="employee-gigachat-badge">
        <svg viewBox="0 0 32.092 32.092" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M16.046 0c8.862 0 16.046 7.184 16.046 16.046 0 8.863-7.184 16.046-16.046 16.046S0 24.908 0 16.046 7.185 0 16.046 0M29.26 12.157c-.406 2.813-1.835 5.133-3.028 6.644-1.84 2.267-4.307 4.23-7.137 5.68-2.8 1.436-5.827 2.308-8.756 2.522-.496.029-.956.043-1.388.043-.513 0-.987-.02-1.436-.061a13.77 13.77 0 0 0 8.522 2.936l-.002-.002c7.64 0 13.835-6.193 13.835-13.834 0-1.326-.187-2.607-.535-3.821zM18.015 1.463c-4.727 0-9.024 1.95-11.494 5.212l-.015.02c-1.068 1.3-1.778 2.727-2.051 4.127-.156.851-.127 1.633.087 2.315v-.002c.507 1.524 1.743 2.747 3.143 3.106a5.8 5.8 0 0 0 1.664.182l.137-.012c3.542-.286 6.7-2.517 9.322-4.664 1.64-1.373 3.21-3.19 3.311-4.364-2.288 1.11-4.65 2.553-7.373 4.504a.68.68 0 0 1-.938-.137C12.456 10 11.278 8.578 10.1 7.28a.686.686 0 0 1 .097-1.005c3.61-2.708 7.201-4.242 10.685-4.565a16.6 16.6 0 0 0-2.867-.247"
          ></path>
        </svg>
        <span>Giga Chat</span>
      </span>
    `;
  }

  async submitLangflowQuestion() {
    const question = String(this.langflowQuestion || '').trim();

    if (!question) {
      this.langflowError = 'Напиши вопрос';
      return;
    }

    const endpoint = import.meta.env.VITE_LANGFLOW_ENDPOINT;

    this.langflowLoading = true;
    this.langflowError = '';
    this.langflowAnswer = '';

    try {
      if (!endpoint) {
        this.langflowError = 'Langflow endpoint не настроен';
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_value: question }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Langflow не ответил');
      }

      this.langflowAnswer =
        data.output ||
        data.answer ||
        data.result ||
        data.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
        'Ответ получен';
    } catch (error) {
      this.langflowError = error.message || 'Не удалось отправить вопрос';
    } finally {
      this.langflowLoading = false;
    }
  }

  renderLangflowPanel() {
    return html`
      <div class="employee-langflow-panel">
        <label class="employee-faq-field">
          <span class="sr-only">Спросите GigaChat</span>
          <input
            type="text"
            placeholder="Спросите GigaChat"
            .value=${this.langflowQuestion}
            @input=${(event) => {
              this.langflowQuestion = event.currentTarget.value;
            }}
            @keydown=${(event) => {
              if (event.key === 'Enter') {
                this.submitLangflowQuestion();
              }
            }}
          />
          <button type="button" @click=${() => this.submitLangflowQuestion()} ?disabled=${this.langflowLoading}>
            ${this.langflowLoading ? '...' : 'Отправить'}
          </button>
        </label>
        ${this.langflowError
          ? html`<p class="employee-langflow-error" role="alert">${this.langflowError}</p>`
          : ''}
        ${this.langflowAnswer
          ? html`<div class="employee-langflow-answer">${this.langflowAnswer}</div>`
          : ''}
      </div>
    `;
  }

  render() {
    const aboutCollapsed = this.isSectionCollapsed('about');
    const challengesCollapsed = this.isSectionCollapsed('challenges');
    const achievementsCollapsed = this.isSectionCollapsed('achievements');
    const teamsCollapsed = this.isSectionCollapsed('teams');
    const shopCollapsed = this.isSectionCollapsed('shop');
    const faqCollapsed = this.isSectionCollapsed('faq');
    const availableChallenges = this.getAvailableChallengeList();
    const myChallengeList = this.getMyChallengeList();
    const hasChallengeSection = this.hasChallengeSectionData();
    const displayTeams = this.getDisplayTeams();
    const activeTeam = this.getActiveTeam(displayTeams);
    const hasTeams = displayTeams.length > 0;
    const hasShop = this.shopCards.length > 0;

    return html`
      <main class="employee-shell font-sb">
        <div class="employee-page">
          <aside class="employee-desktop-profile">
            ${this.renderProfileCard({ expanded: true, collapsible: false })}
          </aside>

          <section class="employee-content">
            ${this.renderStickyHeader()}
            <div class="employee-desktop-topbar">
              ${this.renderTopbar()}
            </div>

            <section class="employee-hero">
              <h1>Система Геймификации Сбера</h1>
              <p>
                ${this.getDisplayName()}, до ${this.getUserLevel() + 1} уровня осталось
                ${this.getXpToNextLevel()} XP
              </p>
              <button type="button" @click=${() => this.navigateToSection('#challenges')}>
                Выполнить челленджи
              </button>
            </section>

            <section class="employee-section" id="about">
              <div data-section-content="about">
                <div class="employee-section-heading">
                  <h2>Что такое Система Геймификации Сбера?</h2>
                  <p>Платформа превращает рабочие процессы в систему прогресса</p>
                </div>

                ${aboutCollapsed
                  ? ''
                  : html`
                      <div class="employee-info-grid">
                        ${infoCards.map(
                          (card) => html`
                            <article class="employee-info-card">
                              <h3>${card.title}</h3>
                              <p>${card.text}</p>
                              <img class="employee-info-card-image" src=${card.image} alt="" loading="lazy" />
                            </article>
                          `,
                        )}
                      </div>

                      <div class="employee-subsection">
                        <h2>Зачем это нужно?</h2>
                        <div class="employee-why-grid">
                          <article class="employee-why-card is-wide">
                            <h3>Развитие Soft/Hard скиллов</h3>
                            <p>Челленджи помогают прокачивать навыки через реальные рабочие задачи и командную практику</p>
                          </article>

                          <article class="employee-why-card is-engagement">
                            <h3>Вовлеченность Команды</h3>
                            <p>Процесс становится понятнее и участники видят общий прогресс</p>
                          </article>

                          <article class="employee-why-card is-motivation">
                            <h3>Мотивация</h3>
                            <p>Выполняй челленджи, получай опыт и обменивай его на реальные награды</p>
                          </article>

                          <article class="employee-why-card is-process">
                            <h3>Прозрачный Процесс</h3>
                            <p>Понятный прогресс, сроки и достижение помогают держать фокус</p>
                            <img
                              class="employee-process-image"
                              src="/assets/sber-landing-photo/rectangle-27.png"
                              alt=""
                              loading="lazy"
                            />
                          </article>
                        </div>
                      </div>

                      <div class="employee-subsection">
                        <h2>Как это помогает команде?</h2>
                        <article class="employee-team-story">
                          <div>
                            <p>Тимлид команды дизайна Сбер ID</p>
                            <strong class="employee-team-name-harper">MAKAP</strong>
                            <p>
                              После внедрения системы геймификации команда начала закрывать внутренние задачи на 43% быстрее
                            </p>
                          </div>
                          <img
                            class="employee-team-person-image"
                            src="/assets/sber-landing-photo/image-10.png"
                            alt=""
                            loading="lazy"
                          />
                        </article>
                      </div>

                      <div class="employee-subsection">
                        <h2>Уровни челленджей</h2>
                        ${this.renderLevelCards()}
                      </div>
                    `}
              </div>
              ${this.renderSectionToggle('about', 'О проекте')}
            </section>

	            ${hasChallengeSection
	              ? html`
	                  <section class="employee-section" id="challenges">
                    <div data-section-content="challenges">
                      <div class="employee-title-row">
                        <h2>Доступные челленджи</h2>
                        ${this.renderFilterToggle('available')}
                      </div>
                      ${challengesCollapsed
                        ? ''
                        : html`
                            ${this.renderChallengeFilters('available')}
                            ${availableChallenges.length
                              ? html`
                                  <div class="employee-card-grid">
                                    ${availableChallenges.map((challenge, index) =>
                                      this.renderChallengeCard(
                                        challenge,
                                        index === 1 ? 'is-highlighted' : '',
                                      ),
                                    )}
                                  </div>
                                `
                              : ''}
                            ${myChallengeList.length
                              ? html`
                                  <div class="employee-subsection">
                                    <div class="employee-title-row">
                                      <h2>Мои челленджи</h2>
                                      ${this.renderFilterToggle('my')}
                                    </div>
                                    ${this.renderChallengeFilters('my')}
                                    <div class="employee-my-challenges-grid">
                                      ${myChallengeList.map((challenge) =>
                                        this.renderMyChallengeCard(challenge),
                                      )}
                                    </div>
                                  </div>
                                `
                              : ''}
                          `}
                    </div>
                    ${this.renderSectionToggle('challenges', 'Челленджи')}
                  </section>
	                `
	              : ''}

	            <section class="employee-section" id="achievements">
	              <div data-section-content="achievements">
	                <h2>Достижения</h2>
	                ${achievementsCollapsed ? '' : this.renderAchievementsSection()}
	              </div>
	              ${this.renderSectionToggle('achievements', 'Достижения')}
	            </section>

	            ${hasTeams
	              ? html`
	                  <section class="employee-section" id="teams">
                    <div data-section-content="teams">
                      ${this.renderTeamSectionHeader(displayTeams)}
                      ${teamsCollapsed
                        ? ''
                        : activeTeam
                          ? this.renderTeamPreview(activeTeam)
                          : ''}
                    </div>
                    ${this.renderSectionToggle('teams', 'Команды')}
                  </section>
                `
              : ''}

            <section class="employee-section" id="rating">
              <div class="employee-top-teams">
                <h2>Рейтинг<span class="employee-heading-sup">Топ 10</span></h2>
                ${this.renderParticipantRating()}
              </div>
            </section>

            ${hasShop
              ? html`
                  <section class="employee-section" id="shop">
                    <div data-section-content="shop">
                      <h2>Магазин</h2>
                      ${shopCollapsed ? '' : this.renderShopCards()}
                    </div>
                    ${this.renderSectionToggle('shop', 'Магазин')}
                  </section>
                `
              : ''}

            <section class="employee-section" id="faq">
              <div data-section-content="faq">
                <h2 class="employee-faq-title">F&Q ${this.renderGigaChatBadge()}</h2>
                ${faqCollapsed ? '' : this.renderLangflowPanel()}
              </div>
              ${this.renderSectionToggle('faq', 'F&Q')}
            </section>

            <footer class="employee-footer">
              ${this.renderFooterLinks()}
              <div class="employee-footer-white-layer" style=${this.footerClipStyle} aria-hidden="true">
                ${this.renderFooterLinks('employee-footer-links')}
              </div>
              <img
                class="employee-footer-drag-image"
                src="/assets/employee-footer-image.png"
                alt=""
                draggable="false"
                style=${`left: ${this.footerImageX}px; top: ${this.footerImageY}px;`}
                @load=${this.handleFooterImageLoad}
                @pointerdown=${this.handleFooterPointerDown}
              />
              <p class="employee-footer-hint">Двигай картинку</p>
            </footer>
            ${this.renderFloatingSectionToggle()}
            ${this.renderChallengeSubmissionModal()}
          </section>
        </div>
      </main>
    `;
  }
}

customElements.define('employee-page', EmployeePage);
