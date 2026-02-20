// ============================================================
// supabase-service.js
// Handles all Supabase interactions: auth, markers, categories,
// and map preferences. Routes are NOT stored — Mapbox redraws
// them from markers on each session.
//
// SETUP:
//   1. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env
//   2. Run npm run build to inject them into config.js
//   3. Load in index.html BEFORE app.js
// ============================================================

class SupabaseService {
  constructor() {
    const cfg = window.config?.supabase || {};
    if (!cfg.url || !cfg.anonKey) {
      console.warn('[SupabaseService] Missing supabase config. Auth/sync disabled.');
      this.client = null;
      return;
    }

    this.client = supabase.createClient(cfg.url, cfg.anonKey);
    this._session = null;
    this._authListeners = [];

    this.client.auth.onAuthStateChange((event, session) => {
      // Always keep internal session up to date.
      this._session = session;

      // STOP automatic marker loading.
      // Supabase fires these events with NO user interaction:
      //   INITIAL_SESSION - on every page load when a stored session exists
      //   TOKEN_REFRESHED - every time you alt-tab or switch back to the tab
      //   SIGNED_IN       - automatically when redirecting back from signin page
      //
      // Forwarding any of these to listeners is what causes markers to load
      // or duplicate without the user pressing any button.
      // We only forward SIGNED_OUT so the UI can react to explicit sign-out.
      if (event === 'SIGNED_OUT') {
        this._authListeners.forEach(fn => fn(event, session));
      }
    });
  }

  // ----------------------------------------------------------
  // INTERNAL HELPERS
  // ----------------------------------------------------------

  get isReady()  { return !!this.client; }
  get user()     { return this._session?.user ?? null; }
  get userId()   { return this.user?.id ?? null; }

  _requireAuth() {
    if (!this.userId) throw new Error('Not authenticated');
  }

  async _query(fn) {
    const { data, error } = await fn();
    if (error) throw error;
    return data;
  }

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  onAuthChange(callback) {
    this._authListeners.push(callback);
  }

  async getSession() {
    if (!this.isReady) return null;
    const { data } = await this.client.auth.getSession();
    this._session = data.session;
    return data.session;
  }

  async signUp(email, password, displayName = '') {
    if (!this.isReady) throw new Error('Supabase not configured');
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    if (!this.isReady) throw new Error('Supabase not configured');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this._session = data.session;
    return data;
  }

  async signOut() {
    if (!this.isReady) return;
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
    this._session = null;
  }

  // ----------------------------------------------------------
  // MAP PREFERENCES
  // ----------------------------------------------------------

  async getPreferences() {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('map_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()
    );
  }

  async savePreferences({ mapStyle, transportMode, defaultLat, defaultLng, defaultZoom }) {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('map_preferences')
        .upsert({
          user_id:        this.userId,
          map_style:      mapStyle,
          transport_mode: transportMode,
          default_lat:    defaultLat,
          default_lng:    defaultLng,
          default_zoom:   defaultZoom,
          updated_at:     new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single()
    );
  }

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  async getCategories() {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('categories')
        .select('*')
        .eq('user_id', this.userId)
        .order('name')
    );
  }

  async upsertCategory(name, color = '#ff453a') {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('categories')
        .upsert(
          { user_id: this.userId, name, color },
          { onConflict: 'user_id,name' }
        )
        .select()
        .single()
    );
  }

  async deleteCategory(categoryId) {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', this.userId)
    );
  }

  async renameCategory(categoryId, newName) {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('categories')
        .update({ name: newName })
        .eq('id', categoryId)
        .eq('user_id', this.userId)
        .select()
        .single()
    );
  }

  // ----------------------------------------------------------
  // MARKERS
  // ----------------------------------------------------------

  async getMarkers() {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('markers')
        .select('*, categories(id, name, color)')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: true })
    );
  }

  async saveMarker({ name, lat, lng, categoryName, notes = '' }) {
    this._requireAuth();

    let categoryId = null;
    if (categoryName) {
      const cat = await this.upsertCategory(categoryName);
      categoryId = cat.id;
    }

    return this._query(() =>
      this.client
        .from('markers')
        .insert({
          user_id:     this.userId,
          category_id: categoryId,
          name,
          lat,
          lng,
          notes
        })
        .select('*, categories(id, name, color)')
        .single()
    );
  }

  async updateMarker(markerId, updates) {
    this._requireAuth();

    if (updates.categoryName !== undefined) {
      if (updates.categoryName) {
        const cat = await this.upsertCategory(updates.categoryName);
        updates.category_id = cat.id;
      } else {
        updates.category_id = null;
      }
      delete updates.categoryName;
    }

    return this._query(() =>
      this.client
        .from('markers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', markerId)
        .eq('user_id', this.userId)
        .select('*, categories(id, name, color)')
        .single()
    );
  }

  async deleteMarker(markerId) {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('markers')
        .delete()
        .eq('id', markerId)
        .eq('user_id', this.userId)
    );
  }

  async deleteAllMarkers() {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('markers')
        .delete()
        .eq('user_id', this.userId)
    );
  }
}

// Singleton — accessible anywhere as window.supabaseService
window.supabaseService = new SupabaseService();