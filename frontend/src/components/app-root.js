import { LitElement, html } from 'lit';
import './login-page.js';
import './employee-page.js';
import './admin-page.js';

class AppRoot extends LitElement {
  static properties = {
    path: { state: true },
  };

  constructor() {
    super();
    this.path = window.location.pathname;
    this.handlePopState = this.handlePopState.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.handlePopState);
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  handlePopState() {
    this.path = window.location.pathname;
  }

  render() {
    const route = this.path.replace(/\/+$/, '') || '/';

    if (route === '/employee') {
      return html`<employee-page></employee-page>`;
    }

    if (route === '/admin') {
      const storedUser = window.localStorage.getItem('auth.user') || window.sessionStorage.getItem('auth.user');
      const token = window.localStorage.getItem('auth.jwt') || window.sessionStorage.getItem('auth.jwt');
      let user = null;

      try {
        user = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        user = null;
      }

      if (token && user?.globalRole === 'admin') {
        return html`<admin-page></admin-page>`;
      }
    }

    return html`<login-page></login-page>`;
  }
}

customElements.define('app-root', AppRoot);
