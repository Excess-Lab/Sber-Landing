import { LitElement, html } from 'lit';
import './login-page.js';
import './employee-page.js';
import './admin-page.js';
import './force-password-page.js';

class AppRoot extends LitElement {
  static properties = {
    path: { state: true },
    cabinetLoading: { state: true },
    cabinetProgress: { state: true },
  };

  constructor() {
    super();
    this.path = window.location.pathname;
    this.cabinetProgress = 1;
    this.cabinetLoading = Boolean(
      (window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt')) &&
        ['/employee', '/admin'].includes(this.path.replace(/\/+$/, '') || '/'),
    );
    this.loaderTimer = null;
    this.handlePopState = this.handlePopState.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.handlePopState);
    this.stopCabinetLoader();
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  handlePopState() {
    this.path = window.location.pathname;
  }

  firstUpdated() {
    this.startCabinetLoaderIfNeeded();
  }

  updated(changedProperties) {
    if (changedProperties.has('path')) {
      this.startCabinetLoaderIfNeeded();
    }
  }

  isCabinetRoute(route) {
    return route === '/employee' || route === '/admin';
  }

  stopCabinetLoader() {
    if (this.loaderTimer) {
      window.clearInterval(this.loaderTimer);
      this.loaderTimer = null;
    }
  }

  startCabinetLoaderIfNeeded() {
    const route = this.path.replace(/\/+$/, '') || '/';
    const token = window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt');

    if (!token || !this.isCabinetRoute(route) || this.loaderTimer || this.cabinetProgress >= 100) {
      return;
    }

    this.cabinetLoading = true;
    this.cabinetProgress = 1;
    this.stopCabinetLoader();
    this.loaderTimer = window.setInterval(() => {
      const nextProgress = Math.min(100, this.cabinetProgress + 2);
      this.cabinetProgress = nextProgress;

      if (nextProgress >= 100) {
        this.stopCabinetLoader();
        window.setTimeout(() => {
          this.cabinetLoading = false;
        }, 180);
      }
    }, 24);
  }

  getLoaderImage() {
    if (this.cabinetProgress < 25) {
      return '/assets/sber-kolonka/1.png';
    }

    if (this.cabinetProgress < 50) {
      return '/assets/sber-kolonka/2.png';
    }

    if (this.cabinetProgress < 75) {
      return '/assets/sber-kolonka/3.png';
    }

    return '/assets/sber-kolonka/4.png';
  }

  renderCabinetLoader() {
    return html`
      <main class="cabinet-loader font-sb" aria-label="Загрузка кабинета">
        <div class="cabinet-loader-visual">
          <img src=${this.getLoaderImage()} alt="" />
        </div>
        <div class="cabinet-loader-bottom">
          <span>${this.cabinetProgress}%</span>
          <div class="cabinet-loader-track">
            <i style=${`width: ${this.cabinetProgress}%;`}></i>
          </div>
        </div>
      </main>
    `;
  }

  render() {
    const route = this.path.replace(/\/+$/, '') || '/';
    const storedUser = window.localStorage.getItem('auth.user') || window.sessionStorage.getItem('auth.user');
    const token = window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt');
    let user = null;

    try {
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      user = null;
    }

    if (token && user?.mustChangePassword) {
      return html`<force-password-page></force-password-page>`;
    }

    if (token && this.isCabinetRoute(route) && this.cabinetLoading) {
      return this.renderCabinetLoader();
    }

    if (route === '/employee' && token && user?.globalRole === 'admin') {
      window.history.replaceState({}, '', '/admin');
      this.path = '/admin';
      return html`<admin-page></admin-page>`;
    }

    if (route === '/employee') {
      return html`<employee-page></employee-page>`;
    }

    if (route === '/admin') {
      if (token && user?.globalRole === 'admin') {
        return html`<admin-page></admin-page>`;
      }
    }

    return html`<login-page></login-page>`;
  }
}

customElements.define('app-root', AppRoot);
