// ============================================================
// auth-ui.js
// Injects a minimal auth panel into the page.
// Depends on: supabase-service.js loaded first.
// Load in index.html AFTER supabase-service.js, BEFORE app.js.
// ============================================================

(function initAuthUI() {
  // ----------------------------------------------------------
  // Inject HTML
  // ----------------------------------------------------------
  const authHTML = `
    <!-- Auth Button (top-right corner) -->
    <div id="authButton" class="auth-button" title="Account">
      <span id="authButtonLabel">Sign In</span>
    </div>

    <!-- Auth Modal -->
    <div id="authModal" class="auth-modal" style="display:none;">
      <div class="auth-modal-content">
        <button class="auth-modal-close" id="authModalClose" aria-label="Close">✕</button>

        <!-- Signed-out view -->
        <div id="authSignedOut">
          <h2 class="auth-title" id="authFormTitle">Sign In</h2>

          <div class="auth-tabs">
            <button class="auth-tab active" id="tabSignIn" data-tab="signin">Sign In</button>
            <button class="auth-tab" id="tabSignUp" data-tab="signup">Sign Up</button>
          </div>

          <form id="authForm" class="auth-form" autocomplete="on">
            <div id="signupNameField" style="display:none;">
              <label class="auth-label" for="authDisplayName">Display Name</label>
              <input class="auth-input" type="text" id="authDisplayName" placeholder="Your name" autocomplete="name" />
            </div>

            <label class="auth-label" for="authEmail">Email</label>
            <input class="auth-input" type="email" id="authEmail" placeholder="you@example.com" autocomplete="email" required />

            <label class="auth-label" for="authPassword">Password</label>
            <input class="auth-input" type="password" id="authPassword" placeholder="••••••••" autocomplete="current-password" required />

            <div id="authError" class="auth-error" style="display:none;"></div>

            <button type="submit" class="auth-submit" id="authSubmitBtn">Sign In</button>
          </form>
        </div>

        <!-- Signed-in view -->
        <div id="authSignedIn" style="display:none;">
          <h2 class="auth-title">My Account</h2>
          <p class="auth-user-email" id="authUserEmail"></p>
          <hr class="auth-divider" />
          <button class="auth-action-btn" id="authSaveDataBtn">💾 Save Current Map Data</button>
          <button class="auth-action-btn" id="authLoadDataBtn">📂 Load My Saved Data</button>
          <hr class="auth-divider" />
          <button class="auth-signout-btn" id="authSignOutBtn">Sign Out</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', authHTML);

  // ----------------------------------------------------------
  // Inject styles
  // ----------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    /* Auth button */
    .auth-button {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2000;
      background: #2d2d2d;
      color: #ffffff;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: background 0.2s;
    }
    .auth-button:hover { background: #3d3d3d; }

    /* Auth modal overlay */
    .auth-modal {
      position: fixed;
      inset: 0;
      z-index: 3000;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auth-modal-content {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 28px 32px;
      width: 340px;
      max-width: 90vw;
      position: relative;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      color: #ffffff;
    }
    .auth-modal-close {
      position: absolute;
      top: 12px; right: 14px;
      background: none; border: none;
      color: #aaaaaa; font-size: 16px;
      cursor: pointer;
    }
    .auth-modal-close:hover { color: #ffffff; }

    /* Tabs */
    .auth-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .auth-tab {
      flex: 1; padding: 8px;
      background: #3d3d3d; border: 1px solid #505050;
      border-radius: 6px; color: #aaaaaa;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .auth-tab.active { background: #0a84ff; border-color: #0a84ff; color: #fff; }

    /* Form */
    .auth-title { margin: 0 0 18px; font-size: 18px; }
    .auth-label { display: block; font-size: 12px; color: #aaaaaa; margin-bottom: 4px; margin-top: 12px; }
    .auth-input {
      width: 100%; box-sizing: border-box;
      background: #3d3d3d; border: 1px solid #505050;
      border-radius: 6px; padding: 9px 12px;
      color: #ffffff; font-size: 14px;
    }
    .auth-input:focus { outline: none; border-color: #0a84ff; }
    .auth-error {
      background: #5c1a1a; border: 1px solid #a33;
      border-radius: 6px; padding: 8px 10px;
      font-size: 13px; color: #ffaaaa;
      margin-top: 12px;
    }
    .auth-submit {
      width: 100%; margin-top: 18px; padding: 10px;
      background: #0a84ff; border: none; border-radius: 8px;
      color: #fff; font-size: 14px; font-weight: 700;
      cursor: pointer; transition: background 0.2s;
    }
    .auth-submit:hover { background: #0070d8; }
    .auth-submit:disabled { background: #555; cursor: not-allowed; }

    /* Signed-in panel */
    .auth-user-email { color: #aaaaaa; font-size: 13px; margin: 0 0 16px; }
    .auth-divider { border: none; border-top: 1px solid #404040; margin: 14px 0; }
    .auth-action-btn {
      display: block; width: 100%; padding: 10px 14px;
      background: #3d3d3d; border: 1px solid #505050;
      border-radius: 8px; color: #ffffff;
      font-size: 13px; text-align: left; cursor: pointer;
      margin-bottom: 8px; transition: background 0.2s;
    }
    .auth-action-btn:hover { background: #505050; }
    .auth-signout-btn {
      display: block; width: 100%; padding: 10px;
      background: #3d1a1a; border: 1px solid #6b2a2a;
      border-radius: 8px; color: #ff6b6b;
      font-size: 13px; font-weight: 600; cursor: pointer;
      margin-top: 4px; transition: background 0.2s;
    }
    .auth-signout-btn:hover { background: #501a1a; }
  `;
  document.head.appendChild(style);

  // ----------------------------------------------------------
  // DOM references
  // ----------------------------------------------------------
  const authButton      = document.getElementById('authButton');
  const authButtonLabel = document.getElementById('authButtonLabel');
  const authModal       = document.getElementById('authModal');
  const authModalClose  = document.getElementById('authModalClose');
  const authSignedOut   = document.getElementById('authSignedOut');
  const authSignedIn    = document.getElementById('authSignedIn');
  const authUserEmail   = document.getElementById('authUserEmail');
  const authForm        = document.getElementById('authForm');
  const authEmail       = document.getElementById('authEmail');
  const authPassword    = document.getElementById('authPassword');
  const authDisplayName = document.getElementById('authDisplayName');
  const signupNameField = document.getElementById('signupNameField');
  const authError       = document.getElementById('authError');
  const authSubmitBtn   = document.getElementById('authSubmitBtn');
  const tabSignIn       = document.getElementById('tabSignIn');
  const tabSignUp       = document.getElementById('tabSignUp');
  const authSaveDataBtn = document.getElementById('authSaveDataBtn');
  const authLoadDataBtn = document.getElementById('authLoadDataBtn');
  const authSignOutBtn  = document.getElementById('authSignOutBtn');

  // ----------------------------------------------------------
  // Tab switching
  // ----------------------------------------------------------
  let currentTab = 'signin';

  function setTab(tab) {
    currentTab = tab;
    tabSignIn.classList.toggle('active', tab === 'signin');
    tabSignUp.classList.toggle('active', tab === 'signup');
    signupNameField.style.display = tab === 'signup' ? 'block' : 'none';
    authSubmitBtn.textContent = tab === 'signup' ? 'Create Account' : 'Sign In';
    authPassword.setAttribute('autocomplete', tab === 'signup' ? 'new-password' : 'current-password');
    clearError();
  }

  tabSignIn.addEventListener('click', () => setTab('signin'));
  tabSignUp.addEventListener('click', () => setTab('signup'));

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  function showError(msg) {
    authError.textContent = msg;
    authError.style.display = 'block';
  }

  function clearError() {
    authError.textContent = '';
    authError.style.display = 'none';
  }

  function openModal() { authModal.style.display = 'flex'; }
  function closeModal() { authModal.style.display = 'none'; clearError(); }

  function updateUIForUser(user) {
    if (user) {
      authButtonLabel.textContent = user.email.split('@')[0];
      authSignedOut.style.display = 'none';
      authSignedIn.style.display  = 'block';
      authUserEmail.textContent   = user.email;
    } else {
      authButtonLabel.textContent = 'Sign In';
      authSignedOut.style.display = 'block';
      authSignedIn.style.display  = 'none';
    }
  }

  // ----------------------------------------------------------
  // Wire up Supabase auth state
  // ----------------------------------------------------------
  const svc = window.supabaseService;

  if (svc?.isReady) {
    svc.onAuthChange((event, session) => {
      updateUIForUser(session?.user ?? null);
      // Only auto-load on actual new sign-in, not session restore on page load
      if (event === 'SIGNED_IN' && !svc._sessionRestoredOnLoad && typeof window.loadMapDataFromSupabase === 'function') {
        window.loadMapDataFromSupabase().catch(err =>
          console.warn('[Supabase] Auto-load on sign-in failed:', err.message)
        );
      }
    });
    // Check existing session on load — mark restore complete so auth listener won't auto-load
    svc.getSession().then(session => {
      svc._sessionRestoredOnLoad = true;
      updateUIForUser(session?.user ?? null);
    });
  }

  // ----------------------------------------------------------
  // Event listeners
  // ----------------------------------------------------------
  authButton.addEventListener('click', openModal);
  authModalClose.addEventListener('click', closeModal);
  authModal.addEventListener('click', e => { if (e.target === authModal) closeModal(); });

  authForm.addEventListener('submit', async e => {
    e.preventDefault();
    clearError();
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'Please wait…';

    try {
      if (currentTab === 'signup') {
        await svc.signUp(authEmail.value.trim(), authPassword.value, authDisplayName.value.trim());
        showError('Check your email to confirm your account, then sign in.');
        setTab('signin');
      } else {
        await svc.signIn(authEmail.value.trim(), authPassword.value);
        closeModal();
      }
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      authSubmitBtn.disabled = false;
      setTab(currentTab);
    }
  });

  authSignOutBtn.addEventListener('click', async () => {
    await svc.signOut();
    closeModal();
  });

  // ----------------------------------------------------------
  // Save / Load map data (delegates to app.js global functions)
  // ----------------------------------------------------------
  authSaveDataBtn.addEventListener('click', async () => {
    if (typeof window.saveMapDataToSupabase === 'function') {
      authSaveDataBtn.textContent = '⏳ Saving…';
      try {
        await window.saveMapDataToSupabase();
        authSaveDataBtn.textContent = '✅ Saved!';
      } catch (err) {
        authSaveDataBtn.textContent = '❌ Save failed';
        console.error(err);
      }
      setTimeout(() => { authSaveDataBtn.textContent = '💾 Save Current Map Data'; }, 2500);
    } else {
      alert('Save function not available yet. Make sure app.js is loaded.');
    }
  });

  authLoadDataBtn.addEventListener('click', async () => {
    if (typeof window.loadMapDataFromSupabase === 'function') {
      authLoadDataBtn.textContent = '⏳ Loading…';
      try {
        await window.loadMapDataFromSupabase();
        authLoadDataBtn.textContent = '✅ Loaded!';
        closeModal();
      } catch (err) {
        authLoadDataBtn.textContent = '❌ Load failed';
        console.error(err);
      }
      setTimeout(() => { authLoadDataBtn.textContent = '📂 Load My Saved Data'; }, 2500);
    } else {
      alert('Load function not available yet. Make sure app.js is loaded.');
    }
  });
})();