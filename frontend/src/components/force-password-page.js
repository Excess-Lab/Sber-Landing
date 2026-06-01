import { LitElement, html } from 'lit';

class ForcePasswordPage extends LitElement {
  static properties = {
    password: { state: true },
    passwordConfirmation: { state: true },
    saving: { state: true },
    error: { state: true },
  };

  constructor() {
    super();
    this.apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.password = '';
    this.passwordConfirmation = '';
    this.saving = false;
    this.error = '';
  }

  createRenderRoot() {
    return this;
  }

  getAuthToken() {
    return window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt') || '';
  }

  getAuthStorage() {
    return window.localStorage.getItem('auth.jwt') ? window.localStorage : window.sessionStorage;
  }

  getStoredUser() {
    const raw = window.localStorage.getItem('auth.user') || window.sessionStorage.getItem('auth.user') || '';

    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  async submit(event) {
    event.preventDefault();

    if (this.saving) {
      return;
    }

    if (!this.password || !this.passwordConfirmation) {
      this.error = 'Заполни все поля';
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.error = 'Новый пароль и повтор не совпадают';
      return;
    }

    this.saving = true;
    this.error = '';

    try {
      const response = await fetch(`${this.apiUrl}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          password: this.password,
          passwordConfirmation: this.passwordConfirmation,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Не удалось изменить пароль');
      }

      const storage = this.getAuthStorage();
      const user = { ...this.getStoredUser(), mustChangePassword: false, temporaryPasswordIssuedAt: null };
      storage.setItem('auth.user', JSON.stringify(user));
      window.location.assign(user.globalRole === 'admin' ? '/admin' : '/employee');
    } catch (error) {
      this.error = error.message || 'Не удалось изменить пароль';
    } finally {
      this.saving = false;
    }
  }

  render() {
    return html`
      <main class="force-password-shell font-sb">
        <form class="force-password-card" @submit=${(event) => this.submit(event)}>
          <span>Фабрика решений</span>
          <h1>Смени временный пароль</h1>
          <p>Администратор выдал временный пароль. Перед входом в кабинет нужно задать новый.</p>
          <input
            type="password"
            autocomplete="new-password"
            placeholder="Новый пароль"
            .value=${this.password}
            @input=${(event) => {
              this.password = event.currentTarget.value;
            }}
          />
          <input
            type="password"
            autocomplete="new-password"
            placeholder="Повтори пароль"
            .value=${this.passwordConfirmation}
            @input=${(event) => {
              this.passwordConfirmation = event.currentTarget.value;
            }}
          />
          ${this.error ? html`<p role="alert">${this.error}</p>` : ''}
          <button type="submit" ?disabled=${this.saving}>${this.saving ? 'Сохраняю...' : 'Сохранить пароль'}</button>
        </form>
      </main>
    `;
  }
}

customElements.define('force-password-page', ForcePasswordPage);
