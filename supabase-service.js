// ============================================================
// supabase-service.js
// Drop into your project alongside app.js and routing-service.js
// Handles all Supabase interactions: auth, markers, categories,
// routes, and map preferences.
//
// SETUP:
//   1. npm install @supabase/supabase-js
//   2. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env
//   3. Run build-config.js to inject them into config.js
//   4. Load this file in index.html BEFORE app.js
// ============================================================

class SupabaseService {
  constructor() {
    const cfg = window.config?.supabase || {};
    if (!cfg.url || !cfg.anonKey) {
      console.warn('[SupabaseService] Missing supabase config. Auth/sync disabled.');
      this.client = null;
      return;
    }

    // supabase-js is loaded as a CDN UMD bundle (see index.html)
    this.client = supabase.createClient(cfg.url, cfg.anonKey);
    this._session = null;
    this._authListeners = [];

    // Keep local session in sync
    this.client.auth.onAuthStateChange((event, session) => {
      this._session = session;
      this._authListeners.forEach(fn => fn(event, session));
    });
  }

  // ----------------------------------------------------------
  // INTERNAL HELPERS
  // ----------------------------------------------------------

  get isReady() {
    return !!this.client;
  }

  get user() {
    return this._session?.user ?? null;
  }

  get userId() {
    return this.user?.id ?? null;
  }

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
    const data = await this._query(() =>
      this.client
        .from('map_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()
    );
    return data;
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

  /**
   * Upsert a category by name. Returns the category row.
   */
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

    // Ensure category exists
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

    // If category name is being changed, resolve/create the category first
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

  // ----------------------------------------------------------
  // ROUTES
  // ----------------------------------------------------------

  async getRoutes() {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('routes')
        .select('*, route_waypoints(*)')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
    );
  }

  /**
   * Save a route + its waypoints atomically.
   *
   * @param {Object} routeData
   * @param {string}   routeData.name
   * @param {string}   routeData.transportMode   'driving' | 'walking' | 'cycling'
   * @param {number}   routeData.totalDistance   meters
   * @param {number}   routeData.totalDuration   seconds
   * @param {Array}    routeData.waypoints        [{ lat, lng, markerId?, label? }, ...]
   *                   First element = start point, rest = intermediate/end stops.
   */
  async saveRoute({ name, transportMode, totalDistance, totalDuration, waypoints }) {
    this._requireAuth();

    // Insert route header
    const route = await this._query(() =>
      this.client
        .from('routes')
        .insert({
          user_id:        this.userId,
          name,
          transport_mode: transportMode,
          total_distance: totalDistance,
          total_duration: totalDuration
        })
        .select()
        .single()
    );

    // Insert waypoints
    const waypointRows = waypoints.map((wp, i) => ({
      route_id:  route.id,
      position:  i,
      lat:       wp.lat,
      lng:       wp.lng,
      marker_id: wp.markerId ?? null,
      label:     wp.label ?? null
    }));

    await this._query(() =>
      this.client.from('route_waypoints').insert(waypointRows)
    );

    return route;
  }

  async deleteRoute(routeId) {
    this._requireAuth();
    // Waypoints cascade-delete via FK
    return this._query(() =>
      this.client
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', this.userId)
    );
  }

  async renameRoute(routeId, newName) {
    this._requireAuth();
    return this._query(() =>
      this.client
        .from('routes')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', routeId)
        .eq('user_id', this.userId)
        .select()
        .single()
    );
  }
}

// Singleton — access anywhere as window.supabaseService
window.supabaseService = new SupabaseService();