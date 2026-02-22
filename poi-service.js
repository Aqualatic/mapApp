// ===== POI SERVICE =====
// Fetches Point of Interest data from Mapbox Search Box API
// and builds popup HTML for map click interactions.

const POI_SEARCH_BOX_BASE = 'https://api.mapbox.com/search/searchbox/v1';

// ===== CATEGORY CLASSIFICATION =====

const CATEGORY_GROUPS = {
    Commercial: {
        color: '#0a84ff',
        keywords: [
            'restaurant', 'hotel', 'shopping', 'mall', 'gas_station', 'fuel',
            'grocery', 'supermarket', 'store', 'shop', 'cafe', 'coffee',
            'bank', 'atm', 'pharmacy', 'fast_food', 'bar', 'nightlife',
            'food_and_drink', 'food', 'lodging', 'convenience_store', 'bakery',
            'clothing', 'electronics', 'salon', 'spa', 'gym', 'fitness'
        ]
    },
    Recreational: {
        color: '#30d158',
        keywords: [
            'park', 'museum', 'theater', 'theatre', 'entertainment', 'cinema',
            'zoo', 'aquarium', 'amusement', 'playground', 'garden', 'stadium',
            'sports', 'recreation', 'beach', 'lake', 'trail', 'hiking',
            'golf', 'bowling', 'swimming', 'art_gallery', 'gallery', 'library'
        ]
    },
    Transportation: {
        color: '#ff9f0a',
        keywords: [
            'airport', 'train_station', 'bus_stop', 'bus_station', 'parking',
            'transit', 'subway', 'metro', 'ferry', 'taxi', 'car_rental',
            'charging_station', 'ev_charging', 'bicycle', 'bike_share',
            'port', 'heliport', 'rail', 'station', 'terminal', 'transportation'
        ]
    },
    Landmarks: {
        color: '#bf5af2',
        keywords: [
            'historic', 'historical', 'monument', 'memorial', 'landmark',
            'castle', 'palace', 'temple', 'church', 'mosque', 'synagogue',
            'cathedral', 'ruins', 'heritage', 'statue', 'tower', 'bridge',
            'architecture', 'famous', 'attraction', 'tourist', 'tourism',
            'place_of_worship', 'religious'
        ]
    },
    Buildings: {
        color: '#8e8e93',
        keywords: [
            'building', 'office', 'government', 'hospital', 'school',
            'university', 'college', 'police', 'fire_station', 'post_office',
            'courthouse', 'city_hall', 'embassy', 'clinic', 'medical',
            'community_center', 'convention_center'
        ]
    }
};

// Mapbox category slugs to search per group
const CATEGORY_SEARCH_SLUGS = {
    Commercial: ['restaurant', 'hotel', 'shopping_mall', 'gas_station', 'cafe'],
    Recreational: ['park', 'museum', 'entertainment', 'cinema', 'sports'],
    Transportation: ['airport', 'bus_station', 'parking', 'train_station'],
    Landmarks: ['monument', 'historic_site', 'tourist_attraction', 'church'],
    Buildings: ['hospital', 'school', 'government_office', 'post_office']
};

/**
 * Classify a POI into a group based on its category array.
 * Returns { group, color, tags }.
 */
function classifyPOI(poiCategories, poiCategoryIds) {
    const cats = (poiCategories || []).map(c => c.toLowerCase());
    const catIds = (poiCategoryIds || []).map(c => c.toLowerCase());
    const all = [...new Set([...cats, ...catIds])];

    let matchedGroup = null;
    let matchedColor = '#8e8e93';

    for (const [group, { color, keywords }] of Object.entries(CATEGORY_GROUPS)) {
        if (all.some(c => keywords.some(kw => c.includes(kw)))) {
            matchedGroup = group;
            matchedColor = color;
            break;
        }
    }

    // Build quick-glance tags from the raw categories
    const tags = cats
        .map(c => c.replace(/_/g, ' '))
        .filter(c => c !== matchedGroup?.toLowerCase())
        .slice(0, 6);

    return {
        group: matchedGroup || 'Other',
        color: matchedColor,
        tags
    };
}

// ===== API CALLS =====

/**
 * Reverse lookup: find POIs at the given coordinates.
 */
async function reverseSearchPOI(lat, lng, accessToken) {
    const url = `${POI_SEARCH_BOX_BASE}/reverse?longitude=${lng}&latitude=${lat}&limit=1&types=poi&language=en&access_token=${accessToken}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Reverse lookup failed: ${res.status}`);
    return res.json();
}

/**
 * Category search: find POIs of a specific category near coordinates.
 */
async function categorySearchPOI(category, lat, lng, accessToken) {
    const url = `${POI_SEARCH_BOX_BASE}/category/${category}?proximity=${lng},${lat}&limit=1&language=en&access_token=${accessToken}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}

/**
 * Main entry: Fetch the best POI near the clicked coordinates.
 * 1. Try reverse lookup (types=poi)
 * 2. If no POI found, try category searches in parallel
 * 3. Return the closest result, or null
 */
async function fetchPOINearby(lat, lng, accessToken) {
    if (!accessToken || accessToken === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
        return { feature: null, html: buildFallbackPopupHTML(lat, lng, 'No Mapbox API token configured') };
    }

    try {
        // Step 1: Reverse lookup
        const reverseData = await reverseSearchPOI(lat, lng, accessToken);
        if (reverseData.features && reverseData.features.length > 0) {
            const feature = reverseData.features[0];
            if (feature.properties.feature_type === 'poi') {
                return { feature, html: buildPOIPopupHTML(feature, lat, lng) };
            }
        }

        // Step 2: Parallel category searches
        const allSlugs = Object.values(CATEGORY_SEARCH_SLUGS).flat();
        const categoryPromises = allSlugs.map(slug =>
            categorySearchPOI(slug, lat, lng, accessToken).catch(() => null)
        );
        const categoryResults = await Promise.all(categoryPromises);

        // Find the closest POI from category results
        let bestFeature = null;
        let bestDistance = Infinity;

        for (const result of categoryResults) {
            if (!result || !result.features || result.features.length === 0) continue;
            const f = result.features[0];
            const coords = f.geometry?.coordinates;
            if (!coords) continue;
            const dist = haversineDistance(lat, lng, coords[1], coords[0]);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestFeature = f;
            }
        }

        // Only use the category result if it's within ~500m of the click
        if (bestFeature && bestDistance < 500) {
            return { feature: bestFeature, html: buildPOIPopupHTML(bestFeature, lat, lng) };
        }

        // Step 3: Reverse lookup without POI filter for address info
        const addressUrl = `${POI_SEARCH_BOX_BASE}/reverse?longitude=${lng}&latitude=${lat}&limit=1&language=en&access_token=${accessToken}`;
        const addressRes = await fetch(addressUrl);
        if (addressRes.ok) {
            const addressData = await addressRes.json();
            if (addressData.features && addressData.features.length > 0) {
                return { feature: addressData.features[0], html: buildAddressPopupHTML(addressData.features[0], lat, lng) };
            }
        }

        return { feature: null, html: buildFallbackPopupHTML(lat, lng) };
    } catch (err) {
        console.error('[POI Service] Fetch error:', err);
        return { feature: null, html: buildFallbackPopupHTML(lat, lng, 'Failed to fetch POI data') };
    }
}

// ===== HAVERSINE DISTANCE =====

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===== HTML BUILDERS =====

function escapeHtmlPOI(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Build full POI popup HTML.
 */
function buildPOIPopupHTML(feature, clickedLat, clickedLng) {
    const p = feature.properties || {};
    const classification = classifyPOI(p.poi_category, p.poi_category_ids);

    const name = p.name_preferred || p.name || 'Unknown POI';
    const address = p.full_address || p.address || p.place_formatted || '';
    const phone = p.metadata?.phone || '';
    const website = p.metadata?.website || '';
    const hours = p.metadata?.open_hours || '';
    const description = p.metadata?.description || '';
    const rating = p.metadata?.rating || '';
    const reviewCount = p.metadata?.review_count || '';
    const photos = p.metadata?.primary_photo || [];
    const priceLevel = p.metadata?.price_level || '';

    // Build tags section
    let tagsHTML = '';
    const allTags = [...classification.tags];

    // Add extra quick-glance tags
    if (priceLevel) allTags.push(priceLevelLabel(priceLevel));
    if (hours) allTags.push('Hours available');
    if (phone) allTags.push('Has phone');
    if (website) allTags.push('Has website');
    if (p.maki) allTags.push(p.maki.replace(/_/g, ' '));

    const uniqueTags = [...new Set(allTags)].slice(0, 8);
    if (uniqueTags.length > 0) {
        tagsHTML = `
      <div class="poi-tags">
        ${uniqueTags.map(t => `<span class="poi-tag">${escapeHtmlPOI(t)}</span>`).join('')}
      </div>`;
    }

    // Build details section
    let detailsHTML = '';

    if (description) {
        detailsHTML += `<div class="poi-detail-row"><span class="poi-detail-icon">📝</span><span class="poi-detail-text">${escapeHtmlPOI(description)}</span></div>`;
    }

    if (address) {
        detailsHTML += `<div class="poi-detail-row"><span class="poi-detail-icon">📍</span><span class="poi-detail-text">${escapeHtmlPOI(address)}</span></div>`;
    }

    if (phone) {
        detailsHTML += `<div class="poi-detail-row"><span class="poi-detail-icon">📞</span><a class="poi-detail-link" href="tel:${escapeHtmlPOI(phone)}">${escapeHtmlPOI(phone)}</a></div>`;
    }

    if (website) {
        const displayURL = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
        detailsHTML += `<div class="poi-detail-row"><span class="poi-detail-icon">🌐</span><a class="poi-detail-link" href="${escapeHtmlPOI(website)}" target="_blank" rel="noopener">${escapeHtmlPOI(displayURL)}</a></div>`;
    }

    if (hours) {
        detailsHTML += `<div class="poi-detail-row"><span class="poi-detail-icon">🕐</span><span class="poi-detail-text">${escapeHtmlPOI(hours)}</span></div>`;
    }

    // Rating
    let ratingHTML = '';
    if (rating) {
        const stars = '★'.repeat(Math.round(Number(rating))) + '☆'.repeat(5 - Math.round(Number(rating)));
        ratingHTML = `
      <div class="poi-rating">
        <span class="poi-stars">${stars}</span>
        <span class="poi-rating-value">${Number(rating).toFixed(1)}</span>
        ${reviewCount ? `<span class="poi-review-count">(${reviewCount} reviews)</span>` : ''}
      </div>`;
    }

    // Photos
    let photosHTML = '';
    if (photos && photos.length > 0) {
        const photoItems = photos.slice(0, 4).map(photo => {
            const url = typeof photo === 'string' ? photo : photo.url || photo.prefix + 'width300' + photo.suffix;
            return `<img class="poi-photo" src="${escapeHtmlPOI(url)}" alt="POI photo" loading="lazy" onerror="this.style.display='none'">`;
        }).join('');
        photosHTML = `<div class="poi-photos">${photoItems}</div>`;
    }

    return `
    <div class="poi-popup-container">
      <div class="poi-header">
        <div class="poi-name">${escapeHtmlPOI(name)}</div>
        <span class="poi-category-badge" style="background: ${classification.color}20; color: ${classification.color}; border-color: ${classification.color}40;">
          ${escapeHtmlPOI(classification.group)}
        </span>
      </div>
      <div class="poi-coords">
        <span>${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}</span>
      </div>
      ${ratingHTML}
      ${tagsHTML}
      ${detailsHTML ? `<div class="poi-details">${detailsHTML}</div>` : ''}
      ${photosHTML}
    </div>
  `;
}

/**
 * Build popup HTML for address-only reverse lookup results (no POI found).
 */
function buildAddressPopupHTML(feature, clickedLat, clickedLng) {
    const p = feature.properties || {};
    const name = p.name || p.address || 'Address';
    const fullAddress = p.full_address || p.place_formatted || '';

    return `
    <div class="poi-popup-container">
      <div class="poi-header">
        <div class="poi-name">${escapeHtmlPOI(name)}</div>
        <span class="poi-category-badge poi-badge-other">Address</span>
      </div>
      <div class="poi-coords">
        <span>${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}</span>
      </div>
      ${fullAddress ? `
      <div class="poi-details">
        <div class="poi-detail-row"><span class="poi-detail-icon">📍</span><span class="poi-detail-text">${escapeHtmlPOI(fullAddress)}</span></div>
      </div>` : ''}
    </div>
  `;
}

/**
 * Build fallback popup HTML when no POI or address is found.
 */
function buildFallbackPopupHTML(lat, lng, message) {
    return `
    <div class="poi-popup-container poi-fallback">
      <div class="poi-fallback-icon">📌</div>
      <div class="poi-fallback-title">No POI Found</div>
      <div class="poi-coords">
        <span>${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
      </div>
      ${message ? `<div class="poi-fallback-message">${escapeHtmlPOI(message)}</div>` : ''}
    </div>
  `;
}

function priceLevelLabel(level) {
    const n = Number(level);
    if (n === 1) return '💲 Budget';
    if (n === 2) return '💲💲 Moderate';
    if (n === 3) return '💲💲💲 Pricey';
    if (n >= 4) return '💲💲💲💲 High-end';
    return `Price: ${level}`;
}

// ===== EXPOSE GLOBALLY =====
window.poiService = {
    fetchPOINearby,
    buildFallbackPopupHTML,
    buildPOIPopupHTML,
    classifyPOI
};
