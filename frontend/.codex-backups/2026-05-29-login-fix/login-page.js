import { LitElement, html } from 'lit';
import { gsap } from 'gsap';

class LoginPage extends LitElement {
  static properties = {
    loading: { state: true },
    errorMessage: { state: true },
    successMessage: { state: true },
  };

  constructor() {
    super();
    this.apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.loading = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.accessEmail = 'kabanov.makap@yandex.ru';
  }

  connectedCallback() {
    super.connectedCallback();
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
      this.errorMessage = error.message || 'Что-то пошло не так';
    } finally {
      this.loading = false;
    }
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
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const remember = formData.get('remember') === 'on';

    const data = await this.requestJson('/api/auth/local', {
      method: 'POST',
      body: JSON.stringify({
        identifier: email,
        password,
      }),
    });

    if (!data.jwt) {
      throw new Error('Сервер не вернул токен входа');
    }

    const storage = remember ? window.localStorage : window.sessionStorage;
    const otherStorage = remember ? window.sessionStorage : window.localStorage;

    storage.setItem('auth.jwt', data.jwt);
    storage.setItem('auth.user', JSON.stringify(data.user));
    otherStorage.removeItem('auth.jwt');
    otherStorage.removeItem('auth.user');

    this.successMessage = 'Вход выполнен';
    this.dispatchEvent(
      new CustomEvent('login-success', {
        detail: data,
        bubbles: true,
        composed: true,
      }),
    );
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

    gsap.fromTo(
      this.querySelector('[data-hero]'),
      { autoAlpha: 0, scale: 0.96, x: 30 },
      { autoAlpha: 1, scale: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.12 },
    );
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

  renderCredentialsFields() {
    return html`
      <label class="block">
        <span class="sr-only">Email</span>
        <input
          class="field-control"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="Email"
          required
        />
      </label>

      <label class="block" style="margin-top: calc(10px * var(--frame-scale));">
        <span class="sr-only">Пароль</span>
        <input
          class="field-control"
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="Пароль"
          required
        />
      </label>

      <div class="login-options">
        <label class="flex cursor-pointer items-center gap-[6px]">
          <input class="remember-box" type="checkbox" name="remember" />
          <span>Запомнить тебя?</span>
        </label>

        <a class="transition hover:text-black/55" href="/forgot-password">Забыл пароль</a>
      </div>

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
      </div>
    `;
  }

  render() {
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
            <h1 data-animate class="login-title">
              <span class="desktop-title">Привет!</span>
              <span class="mobile-title">Добро пожаловать!</span>
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
}

customElements.define('login-page', LoginPage);
