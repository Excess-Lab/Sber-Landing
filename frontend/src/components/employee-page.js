import { LitElement, html } from 'lit';
import { gsap } from 'gsap';

const infoCards = [
  {
    title: 'Система Оплаты',
    text: 'Получай опыт за выполненные челленджи',
    visual: 'visual-payment',
  },
  {
    title: 'Челленджи',
    text: 'Интерес к повседневных задачах',
    visual: 'visual-challenges',
  },
  {
    title: 'Награды',
    text: 'Обменивай опыт на награды из магазина и будь сильнее',
    visual: 'visual-rewards',
  },
];

const challenges = [
  'Собери обратную связь',
  'Помоги команде',
  'Закрой задачу',
  'Проведи демо',
];

const myChallenges = [
  'Название челленджа',
  'Командный процесс',
  'Новая практика',
];

const members = ['Имя Фамилия', 'Имя Фамилия', 'Имя Фамилия'];

class EmployeePage extends LitElement {
  static properties = {
    footerImageX: { state: true },
    footerImageY: { state: true },
    footerClipStyle: { state: true },
    profileMenuOpen: { state: true },
    mobileHeaderHidden: { state: true },
  };

  constructor() {
    super();
    this.footerImageX = 0;
    this.footerImageY = 0;
    this.footerClipStyle = 'clip-path: inset(0 100% 100% 0);';
    this.profileMenuOpen =
      typeof window === 'undefined' ? true : !window.matchMedia('(max-width: 899px)').matches;
    this.mobileHeaderHidden = false;
    this.footerDrag = null;
    this.footerPositionReady = false;
    this.lastScrollY = typeof window === 'undefined' ? 0 : window.scrollY;
    this.mobileHeaderLockUntil = 0;
    this.profileAnimation = null;
    this.handleFooterPointerMove = this.handleFooterPointerMove.bind(this);
    this.handleFooterPointerUp = this.handleFooterPointerUp.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleWindowScroll = this.handleWindowScroll.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Кабинет сотрудника';
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('scroll', this.handleWindowScroll);
    window.removeEventListener('pointermove', this.handleFooterPointerMove);
    window.removeEventListener('pointerup', this.handleFooterPointerUp);
    window.removeEventListener('pointercancel', this.handleFooterPointerUp);
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.setInitialFooterImagePosition();
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
  }

  handleWindowScroll() {
    const currentScrollY = Math.max(0, window.scrollY);

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
      this.mobileHeaderHidden = true;
      if (this.profileMenuOpen) {
        this.profileAnimation?.kill();
        this.profileAnimation = null;
        const details = this.getMobileProfileDetails();

        if (details) {
          gsap.set(details, { clearProps: 'height,opacity,transform,overflow' });
        }

        this.profileMenuOpen = false;
      }
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

  getDisplayRole() {
    const user = this.readStoredUser();
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

  closeMobileProfile() {
    this.mobileHeaderLockUntil = Date.now() + 450;
    this.lastScrollY = Math.max(0, window.scrollY);
    const details = this.getMobileProfileDetails();

    if (!details) {
      this.profileMenuOpen = false;
      return;
    }

    this.profileAnimation?.kill();
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
      },
    });
  }

  renderProfileCard({ expanded = this.profileMenuOpen, collapsible = true } = {}) {
    const displayRole = this.getDisplayRole();

    return html`
      <article
        class=${`employee-profile-card employee-menu-card ${expanded ? 'is-expanded' : 'is-collapsed'}`}
        aria-label="Профиль сотрудника"
      >
        <div class="employee-menu-head">
          <div class="employee-avatar" aria-hidden="true">
            <span>excess</span>
          </div>
          <div class="employee-menu-intro">
            <div class="employee-status-row">
              <span class="employee-position-pill">${displayRole}</span>
              <span class="employee-mood-pill">😁 Кайфую</span>
            </div>
            <h2>Макар Кабанов</h2>
            <p class="employee-xp-line">Уровень 6 | 653 XP</p>
          </div>
        </div>

        <div class="employee-profile-details">
              <div class="employee-profile-actions">
                <button type="button">Изменить статус</button>
                <button type="button">Изменить аватарку</button>
              </div>

              <div class="employee-profile-block">
                <h3>Мои команды</h3>
                <div class="employee-team-tags">
                  <span class="is-blue">AmazMe</span>
                  <span class="is-teal">Sber ID <small>Покинуть ×</small></span>
                  <span class="is-rose">Platform V</span>
                </div>
              </div>

              <div class="employee-profile-block">
                <h3>Мои роли</h3>
                <p class="employee-role-note">Назначаются Проектным менеджером</p>
                <div class="employee-role-tags">
                  <span class="is-blue">
                    <small>Назначил: Алексей Панаморев</small>
                    UI/UX дизайнер
                  </span>
                  <span class="is-violet">
                    <small>Назначил: Алена Долгорукова</small>
                    Вайбкодер :)
                  </span>
                </div>
              </div>

              <div class="employee-profile-block">
                <h3>Мои челленджи</h3>
                <div class="employee-menu-challenge">
                  <div>
                    <span>Осталось 5 дней</span>
                    <span>Награда: 100 XP</span>
                  </div>
                  <strong>Название челленджа</strong>
                  <p>
                    Описание челленджа Описание челленджаОписание челленджаОписание челленджа
                  </p>
                </div>
              </div>

              <div class="employee-menu-progress" aria-hidden="true">
                <span></span>
                <span></span>
              </div>

              <div class="employee-menu-actions">
                <button type="button">Выйти</button>
                <button type="button">Восстановить пароль</button>
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
                ${expanded ? '↑ Скрыть ↑' : '↑ Раскрыть ↑'}
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
          <a class="is-active" href="#about">Про проект</a>
          <a href="#challenges">Челленджи</a>
          <a href="#teams">Команды</a>
          <a href="#rewards">Награды</a>
          <a href="#faq">F&Q</a>
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

  renderChallengeCard(title, variant = '') {
    return html`
      <article class=${`employee-challenge-card ${variant}`}>
        <p class="challenge-days">Осталось 14 дней</p>
        <h3>${title}</h3>
        <p class="challenge-reward">Награда: 100 XP</p>
        <p class="challenge-desc">
          Описание задачиОписание задачиОписание задачиОписание задачиОписание задачи
        </p>
        <button type="button">Принять участие</button>
      </article>
    `;
  }

  renderTeamPreview() {
    return html`
      <article class="employee-team-card">
        <div class="team-list">
          <h3>Название команды <span>Сменить</span></h3>
          <p>Участники</p>
          ${members.map(
            (member) => html`
              <div class="team-member-row">
                <span></span>
                <strong>${member}</strong>
              </div>
            `,
          )}
        </div>

        <div class="team-owner">
          <p>Владелец команды</p>
          <div class="team-owner-visual" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Владелец команды</p>
          <strong>Макар Кабанов</strong>
        </div>
      </article>
    `;
  }

  render() {
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
              <p>Макар, до 7 уровня осталось 47 XP</p>
              <button type="button">Выполнить челленджи</button>
            </section>

            <section class="employee-section" id="about">
              <div class="employee-section-heading">
                <h2>Что такое Система Геймификации Сбера?</h2>
                <p>Платформа превращает рабочие процессы в систему прогресса</p>
              </div>

              <div class="employee-info-grid">
                ${infoCards.map(
                  (card) => html`
                    <article class="employee-info-card">
                      <h3>${card.title}</h3>
                      <p>${card.text}</p>
                      ${this.renderVisual(card.visual)}
                    </article>
                  `,
                )}
              </div>
            </section>

            <section class="employee-section" id="rewards">
              <h2>Зачем это нужно?</h2>
              <div class="employee-why-grid">
                <article class="employee-why-card is-wide">
                  <h3>Развитие Soft/Hard скиллов</h3>
                  <p>Челленджи помогают прокачивать навыки через реальные рабочие задачи и командную практику</p>
                </article>

                <article class="employee-why-card">
                  <h3>Вовлеченность Команды</h3>
                  <p>Процесс становится понятнее и участники видят общий прогресс</p>
                </article>

                <article class="employee-why-card">
                  <h3>Мотивация</h3>
                  <p>Выполняй челленджи, получай опыт и обменивай его на реальные награды</p>
                </article>

                <article class="employee-why-card is-process">
                  <h3>Прозрачный Процесс</h3>
                  <p>Понятный прогресс, сроки и достижение помогают держать фокус</p>
                  ${this.renderVisual('visual-process')}
                </article>
              </div>
            </section>

            <section class="employee-section">
              <h2>Как это помогает команде?</h2>
              <article class="employee-team-story">
                <div>
                  <p>Техника командной динамики Сбер ID</p>
                  <strong>Макар</strong>
                  <p>
                    После внедрения системы геймификации команда начала закрывать внутренние задачи на 43% быстрее
                  </p>
                </div>
                <div class="employee-person-shape" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </article>
            </section>

            <section class="employee-section">
              <h2>Уровни челленджей</h2>
              <div class="employee-levels">
                <article class="level-light">
                  <h3>Light</h3>
                  <p>Легкие повседневные задачи</p>
                </article>
                <article class="level-medium">
                  <h3>Medium</h3>
                  <p>Активность с командой</p>
                </article>
                <article class="level-hard">
                  <h3>Hard</h3>
                  <p>Сложные челленджи</p>
                </article>
              </div>
            </section>

            <section class="employee-section" id="challenges">
              <div class="employee-title-row">
                <h2>Доступные челленджи</h2>
                <button type="button" aria-label="Фильтр">⌁</button>
              </div>
              <div class="employee-card-grid">
                ${challenges.map((challenge, index) =>
                  this.renderChallengeCard(challenge, index === 1 ? 'is-highlighted' : ''),
                )}
              </div>
            </section>

            <section class="employee-section">
              <h2>Мои челленджи</h2>
              <div class="employee-card-grid is-three">
                ${myChallenges.map((challenge) => this.renderChallengeCard(challenge, 'is-my'))}
              </div>
            </section>

            <section class="employee-section" id="teams">
              <h2>Команды</h2>
              ${this.renderTeamPreview()}

              <div class="employee-top-teams">
                <h2>Команды <span>Топ 30</span></h2>
                ${[1, 2, 3].map(
                  (item) => html`
                    <div class=${item === 1 ? 'top-team-row is-first' : 'top-team-row'}>
                      <span></span>
                      <strong>Имя Фамилия</strong>
                      <em>423 XP</em>
                    </div>
                  `,
                )}
                <button type="button">↓ Раскрыть ↓</button>
              </div>
            </section>

            <section class="employee-section" id="faq">
              <h2>F&Q</h2>
              <label class="employee-faq-field">
                <span class="sr-only">Спросите GigaChat</span>
                <input type="text" placeholder="Спросите GigaChat" />
              </label>
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
          </section>
        </div>
      </main>
    `;
  }
}

customElements.define('employee-page', EmployeePage);
