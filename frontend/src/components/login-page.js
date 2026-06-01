import { LitElement, html } from 'lit';
import { gsap } from 'gsap';

class LoginPage extends LitElement {
  static properties = {
    loading: { state: true },
    errorMessage: { state: true },
    successMessage: { state: true },
    passwordVisible: { state: true },
  };

  constructor() {
    super();
    this.apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.loading = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordVisible = false;
    this.accessEmail = 'kabanov.makap@yandex.ru';
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = this.isAdminPage() ? 'Вход админ' : 'Вход работник';
    this.updateFrameScale = this.updateFrameScale.bind(this);
    window.addEventListener('resize', this.updateFrameScale);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.updateFrameScale);
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  isAdminPage() {
    return window.location.pathname.replace(/\/+$/, '') === '/admin';
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (this.loading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.submitCredentials(formData);
    } catch (error) {
      this.errorMessage = this.normalizeLoginError(error);
    } finally {
      this.loading = false;
    }
  }

  normalizeLoginError(error) {
    const message = error?.message || 'Что-то пошло не так';

    if (/blocked|заблок/i.test(message)) {
      return 'Профиль заблокирован. Обратитесь к PM';
    }

    return message;
  }

  async requestJson(path, options) {
    const response = await fetch(`${this.apiUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Запрос не выполнен');
    }

    return data;
  }

  async submitCredentials(formData) {
    const identifier = String(formData.get('identifier') || formData.get('email') || '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') || '');
    const remember = formData.get('remember') === 'on';

    const data = await this.requestJson('/api/auth/local', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    if (!data.jwt) {
      throw new Error('Сервер не вернул токен входа');
    }

    let authUser = data.user || {};

    try {
      const profileResponse = await fetch(`${this.apiUrl}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${data.jwt}`,
        },
      });
      const profileData = await profileResponse.json().catch(() => ({}));

      if (profileResponse.ok && profileData.user) {
        authUser = {
          ...authUser,
          ...profileData.user,
        };
      }
    } catch {
      authUser = data.user || {};
    }

    const storage = remember ? window.localStorage : window.sessionStorage;
    const otherStorage = remember ? window.sessionStorage : window.localStorage;

    storage.setItem('auth.jwt', data.jwt);
    storage.setItem('auth.user', JSON.stringify(authUser));
    otherStorage.removeItem('auth.jwt');
    otherStorage.removeItem('auth.user');

    this.successMessage = 'Вход выполнен';
    this.dispatchEvent(
      new CustomEvent('login-success', {
        detail: {
          ...data,
          user: authUser,
        },
        bubbles: true,
        composed: true,
      }),
    );

    window.location.assign(authUser?.globalRole === 'admin' ? '/admin' : '/employee');
  }

  openAccessRequestEmail() {
    const subject = 'Заявка на доступ в Фабрику решений';
    const body = [
      'Здравствуйте!',
      '',
      'Прошу выдать доступ к Фабрике решений.',
      '',
      'Моя почта:',
      'Отдел:',
    ].join('\n');

    const params = new URLSearchParams({ subject, body });
    window.location.href = `mailto:${this.accessEmail}?${params.toString()}`;
  }

  openPasswordRecoveryEmail() {
    const subject = 'Восстановление пароля в Фабрике решений';
    const body = [
      'Здравствуйте!',
      '',
      'Прошу помочь с восстановлением пароля.',
      '',
      `Email для входа: ${this.querySelector('input[name=\"email\"]')?.value || ''}`,
    ].join('\n');
    const params = new URLSearchParams({ subject, body });

    window.location.href = `mailto:${this.accessEmail}?${params.toString()}`;
  }

  updateFrameScale() {
    const stage = this.querySelector('.login-stage');

    if (!stage) {
      return;
    }

    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    const scale = isMobile
      ? Math.min(window.innerWidth / 440, 1)
      : Math.min(window.innerWidth / 1920, window.innerHeight / 1080, 1);

    stage.style.setProperty('--frame-scale', String(scale));
  }

  firstUpdated() {
    this.updateFrameScale();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      return;
    }

    gsap.fromTo(
      this.querySelectorAll('[data-animate]'),
      { autoAlpha: 0, y: 22 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.72,
        stagger: 0.08,
        ease: 'power3.out',
      },
    );

    const hero = this.querySelector('[data-hero]');

    if (hero) {
      gsap.fromTo(
        hero,
        { autoAlpha: 0, scale: 0.96, x: 30 },
        { autoAlpha: 1, scale: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.12 },
      );
    }
  }

  renderStatus() {
    if (this.errorMessage) {
      return html`<p class="status-message is-error" role="alert">${this.errorMessage}</p>`;
    }

    if (this.successMessage) {
      return html`<p class="status-message is-success">${this.successMessage}</p>`;
    }

    return html`<p class="status-message" aria-hidden="true"></p>`;
  }

  renderModeSwitch(isAdmin) {
    return html`
      <a class=${isAdmin ? 'mode-switch admin-mode-switch' : 'mode-switch employee-mode-switch'}
        href=${isAdmin ? '/' : '/admin'}
        data-animate
      >
        ${isAdmin ? 'Я - Сотрудник/Проектный менеджер' : 'Я - Админ'}
      </a>
    `;
  }

  renderCredentialsFields({ isAdmin = false } = {}) {
    const identifierName = isAdmin ? 'identifier' : 'email';
    const identifierType = isAdmin ? 'text' : 'email';
    const identifierAutocomplete = isAdmin ? 'username' : 'email';
    const identifierPlaceholder = isAdmin ? 'Логин' : 'Email';

    return html`
      <label class="block">
        <span class="sr-only">${identifierPlaceholder}</span>
        <input
          class="field-control"
          name=${identifierName}
          type=${identifierType}
          autocomplete=${identifierAutocomplete}
          placeholder=${identifierPlaceholder}
          required
        />
      </label>

      <label class="password-field">
        <span class="sr-only">Пароль</span>
        <input
          class="field-control password-control"
          name="password"
          type=${this.passwordVisible ? 'text' : 'password'}
          autocomplete="current-password"
          placeholder="Пароль"
          required
        />
        <button
          class="password-toggle"
          type="button"
          aria-label=${this.passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed=${this.passwordVisible}
          @click=${() => {
            this.passwordVisible = !this.passwordVisible;
          }}
        >
          ${this.passwordVisible
            ? html`
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.4 5.2A9.8 9.8 0 0 1 12 4.9c5.2 0 8.7 4.5 9.5 6.2a2 2 0 0 1 0 1.8 11.7 11.7 0 0 1-2.2 2.8" />
                  <path d="M6.6 6.6A12.4 12.4 0 0 0 2.5 11a2 2 0 0 0 0 1.8C3.3 14.6 6.8 19.1 12 19.1a10 10 0 0 0 4.5-1.1" />
                </svg>
              `
            : html`
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 11.1a2 2 0 0 0 0 1.8c.8 1.7 4.3 6.2 9.5 6.2s8.7-4.5 9.5-6.2a2 2 0 0 0 0-1.8C20.7 9.4 17.2 4.9 12 4.9s-8.7 4.5-9.5 6.2Z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              `}
        </button>
      </label>

      ${isAdmin
        ? ''
        : html`
            <div class="login-options">
              <label class="flex cursor-pointer items-center gap-[6px]">
                <input class="remember-box" type="checkbox" name="remember" />
                <span>Запомнить тебя?</span>
              </label>

              <button
                class="forgot-password-btn transition hover:text-black/55"
                type="button"
                @click=${() => this.openPasswordRecoveryEmail()}
              >
                Забыл пароль
              </button>
            </div>
          `}

      ${this.renderStatus()}

      <button
        class="login-submit focus:outline-none focus:ring-2 focus:ring-violet/40 focus:ring-offset-2"
        type="submit"
        ?disabled=${this.loading}
      >
        ${this.loading ? 'Отправка...' : 'Войти'}
      </button>
    `;
  }

  renderFormFields() {
    return this.renderCredentialsFields();
  }

  renderAccessPanel() {
    return html`
      <div class="access-panel">
        <div class="access-content">
          <p class="access-title">Нужен доступ?</p>
          <p class="access-subtitle">Напиши администратору, чтобы получить почту и пароль</p>
          <button
            class="access-link"
            type="button"
            @click=${() => this.openAccessRequestEmail()}
          >
            Оставить заявку
          </button>
        </div>
        <img
          class="access-hero-image"
          src="/assets/login-hero-cutout.png"
          alt=""
          aria-hidden="true"
        />
      </div>
    `;
  }

  render() {
    const isAdmin = this.isAdminPage();

    if (isAdmin) {
      return this.renderAdmin();
    }

    return html`
      <main class="login-shell font-sb">
        <section class="login-stage">
          <div data-animate class="brand-pill">
            <div class="brand-word text-ink">
              <span class="whitespace-nowrap">Фабрика решений</span>
            </div>
          </div>

          <img
            data-hero
            class="hero-image opacity-0"
            src="/assets/login-hero-cutout.png"
            alt=""
          />

          <div class="login-copy">
            ${this.renderModeSwitch(false)}

            <h1 data-animate class="login-title">
              <span class="desktop-title">Привет!</span>
              <span class="mobile-title">Привет!</span>
            </h1>

            <p data-animate class="login-subtitle">
              Войди через рабочую почту и пароль выданный администратором
            </p>

            <form
              data-animate
              class="login-form-card"
              aria-label="Форма входа работника"
              @submit=${this.handleSubmit}
            >
              <div class="login-form-main">
                ${this.renderFormFields()}
              </div>

              ${this.renderAccessPanel()}
            </form>
          </div>
        </section>
      </main>
    `;
  }

  renderAdmin() {
    return html`
      <main class="login-shell admin-shell font-sb">
        <section class="login-stage admin-stage">
          <div data-animate class="brand-pill">
            <div class="brand-word text-ink">
              <span class="whitespace-nowrap">Фабрика решений</span>
            </div>
          </div>

          <div class="admin-copy">
            ${this.renderModeSwitch(true)}

            <h1 data-animate class="login-title admin-title">Привет!</h1>

            <p data-animate class="login-subtitle admin-subtitle">
              Войди через логин и пароль
            </p>

            <form
              data-animate
              class="login-form-card admin-form-card"
              aria-label="Форма входа администратора"
              @submit=${this.handleSubmit}
            >
              <div class="login-form-main admin-form-main">
                ${this.renderCredentialsFields({ isAdmin: true })}
              </div>
            </form>
          </div>
        </section>
      </main>
    `;
  }
}

customElements.define('login-page', LoginPage);
