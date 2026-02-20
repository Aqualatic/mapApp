// ============================================================
// auth-ui.js
// Auth panel + manual Save / Load / Clear buttons only.
// NO automatic marker loading or saving — ever.
// Markers only change when the user explicitly presses a button.
// ============================================================

(function initAuthUI() {
  const authHTML = `
    <div id="authButton" class="auth-button" title="Account">
      <span id="authButtonLabel">Sign In</span>
    </div>

    <div id="authModal" class="auth-modal" style="display:none;">
      <div class="auth-modal-content">
        <button class="auth-modal-close" id="authModalClose" aria-label="Close">✕</button>

        <div id="authSignedOut">
          <h2 class="auth-title">Sign In</h2>
          <div class="auth-tabs">
            <button class="auth-tab active" id="tabSignIn">Sign In</button>
            <button class="auth-tab" id="tabSignUp">Sign Up</button>
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

        <div id="authSignedIn" style="display:none;">
          <h2 class="auth-title">My Account</h2>
          <p class="auth-user-email" id="authUserEmail"></p>
          <hr class="auth-divider" />
          <button class="auth-action-btn" id="authSaveDataBtn">💾 Save Current Map Data</button>
          <button class="auth-action-btn" id="authLoadDataBtn">📂 Load My Saved Data</button>
          <button class="auth-action-btn danger" id="authClearDataBtn">🗑️ Clear Saved Data</button>
          <hr class="auth-divider" />
          <button class="auth-signout-btn" id="authSignOutBtn">Sign Out</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', authHTML);

  const style = document.createElement('style');
  style.textContent = `
    .auth-button {
      position: fixed; top: 16px; right: 16px; z-index: 2000;
      background: #2d2d2d; color: #ffffff; border: 1px solid #404040;
      border-radius: 8px; padding: 8px 16px; font-size: 13px;
      font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: background 0.2s;
    }
    .auth-button:hover { background: #3d3d3d; }
    .auth-modal {
      position: fixed; inset: 0; z-index: 3000;
      background: rgba(0,0,0,0.65); display: flex;
      align-items: center; justify-content: center;
    }
    .auth-modal-content {
      background: #2d2d2d; border: 1px solid #404040; border-radius: 12px;
      padding: 28px 32px; width: 340px; max-width: 90vw; position: relative;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6); color: #ffffff;
    }
    .auth-modal-close {
      position: absolute; top: 12px; right: 14px;
      background: none; border: none; color: #aaa; font-size: 16px; cursor: pointer;
    }
    .auth-modal-close:hover { color: #fff; }
    .auth-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .auth-tab {
      flex: 1; padding: 8px; background: #3d3d3d; border: 1px solid #505050;
      border-radius: 6px; color: #aaa; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .auth-tab.active { background: #0a84ff; border-color: #0a84ff; color: #fff; }
    .auth-title { margin: 0 0 18px; font-size: 18px; }
    .auth-label { display: block; font-size: 12px; color: #aaa; margin: 12px 0 4px; }
    .auth-input {
      width: 100%; box-sizing: border-box; background: #3d3d3d;
      border: 1px solid #505050; border-radius: 6px; padding: 9px 12px;
      color: #fff; font-size: 14px;
    }
    .auth-input:focus { outline: none; border-color: #0a84ff; }
    .auth-error {
      background: #5c1a1a; border: 1px solid #a33; border-radius: 6px;
      padding: 8px 10px; font-size: 13px; color: #ffaaaa; margin-top: 12px;
    }
    .auth-submit {
      width: 100%; margin-top: 18px; padding: 10px; background: #0a84ff;
      border: none; border-radius: 8px; color: #fff; font-size: 14px;
      font-weight: 700; cursor: pointer;
    }
    .auth-submit:hover { background: #0070d8; }
    .auth-submit:disabled { background: #555; cursor: not-allowed; }
    .auth-user-email { color: #aaa; font-size: 13px; margin: 0 0 16px; }
    .auth-divider { border: none; border-top: 1px solid #404040; margin: 14px 0; }
    .auth-action-btn {
      display: block; width: 100%; padding: 10px 14px; background: #3d3d3d;
      border: 1px solid #505050; border-radius: 8px; color: #fff;
      font-size: 13px; text-align: left; cursor: pointer; margin-bottom: 8px;
    }
    .auth-action-btn:hover { background: #505050; }
    .auth-action-btn.danger { background: #3d1a1a; border-color: #6b2a2a; color: #ff6b6b; }
    .auth-action-btn.danger:hover { background: #501a1a; }
    .auth-signout-btn {
      display: block; width: 100%; padding: 10px; background: #3d1a1a;
      border: 1px solid #6b2a2a; border-radius: 8px; color: #ff6b6b;
      font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px;
    }
    .auth-signout-btn:hover { background: #501a1a; }
  `;
  document.head.appendChild(style);

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
  const authClearDataBtn = document.getElementById('authClearDataBtn');
  const authSignOutBtn  = document.getElementById('authSignOutBtn');

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

  function showError(msg) { authError.textContent = msg; authError.style.display = 'block'; }
  function clearError()   { authError.textContent = '';  authError.style.display = 'none'; }
  function openModal()    { authModal.style.display = 'flex'; }
  function closeModal()   { authModal.style.display = 'none'; clearError(); }

  // -------------------------------------------------------
  // updateUIForUser: updates button label and panel only.
  // Does NOT touch markers, load data, or call Supabase.
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // Auth state listener — UI updates ONLY.
  // The event type (_event) is intentionally ignored.
  // SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION — none of
  // these should ever load or modify markers automatically.
  // -------------------------------------------------------
  const svc = window.supabaseService;
  if (svc?.isReady) {
    svc.onAuthChange((_event, session) => {
      updateUIForUser(session?.user ?? null);
      // DO NOT add any marker loading here. Ever.
    });
    svc.getSession().then(session => updateUIForUser(session?.user ?? null));
  }

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
        // Signing in does NOT load markers. User must click the button.
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

  // -------------------------------------------------------
  // SAVE — runs only on button click
  // -------------------------------------------------------
  authSaveDataBtn.addEventListener('click', async () => {
    if (typeof window.saveMapDataToSupabase !== 'function') {
      alert('Save function not available. Make sure app.js is loaded.');
      return;
    }
    authSaveDataBtn.disabled = true;
    authSaveDataBtn.textContent = '⏳ Saving…';
    try {
      await window.saveMapDataToSupabase();
      authSaveDataBtn.textContent = '✅ Saved!';
    } catch (err) {
      authSaveDataBtn.textContent = '❌ Save failed';
      console.error('[auth-ui] Save error:', err);
    } finally {
      authSaveDataBtn.disabled = false;
      setTimeout(() => { authSaveDataBtn.textContent = '💾 Save Current Map Data'; }, 2500);
    }
  });

  // -------------------------------------------------------
  // LOAD — runs only on button click
  // Guard prevents double-load if button clicked twice fast
  // -------------------------------------------------------
  let _loadInProgress = false;
  authLoadDataBtn.addEventListener('click', async () => {
    if (_loadInProgress) return;
    if (typeof window.loadMapDataFromSupabase !== 'function') {
      alert('Load function not available. Make sure app.js is loaded.');
      return;
    }
    _loadInProgress = true;
    authLoadDataBtn.disabled = true;
    authLoadDataBtn.textContent = '⏳ Loading…';
    try {
      await window.loadMapDataFromSupabase();
      authLoadDataBtn.textContent = '✅ Loaded!';
      closeModal();
    } catch (err) {
      authLoadDataBtn.textContent = '❌ Load failed';
      console.error('[auth-ui] Load error:', err);
    } finally {
      _loadInProgress = false;
      authLoadDataBtn.disabled = false;
      setTimeout(() => { authLoadDataBtn.textContent = '📂 Load My Saved Data'; }, 2500);
    }
  });

  // -------------------------------------------------------
  // CLEAR — wipes all marker rows in Supabase for this user.
  // Use this to fix stale/duplicate data from older versions.
  // -------------------------------------------------------
  authClearDataBtn.addEventListener('click', async () => {
    if (!confirm('This will permanently delete all your saved marker data from the server. Your current map markers will NOT be removed — only the server copy. Are you sure?')) return;
    authClearDataBtn.disabled = true;
    authClearDataBtn.textContent = '⏳ Clearing…';
    try {
      if (!svc?.isReady || !svc.userId) { alert('Please sign in first.'); return; }
      await svc.deleteAllMarkers();
      authClearDataBtn.textContent = '✅ Cleared!';
    } catch (err) {
      authClearDataBtn.textContent = '❌ Failed';
      console.error('[auth-ui] Clear error:', err);
    } finally {
      authClearDataBtn.disabled = false;
      setTimeout(() => { authClearDataBtn.textContent = '🗑️ Clear Saved Data'; }, 2500);
    }
  });

})();