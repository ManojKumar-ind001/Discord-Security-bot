class SearchManager {
  constructor(kazagumo) {
    this.kazagumo = kazagumo;
    // In-memory LRU cache for autocomplete with 60 second TTL
    this.cache = new Map();
    this.pendingSearches = new Map();
    this.maxCacheSize = 200;
    this.ttl = 60000;
  }

  formatDuration(ms) {
    if (!ms || isNaN(ms) || ms < 0) return 'Live';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0) {
      return `${hours}:${remMin < 10 ? '0' : ''}${remMin}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  isUrl(str) {
    if (!str) return false;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  detectSource(query) {
    if (!query) return 'youtube';
    const lower = query.toLowerCase();
    if (lower.includes('spotify.com')) return 'spotify';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('soundcloud.com')) return 'soundcloud';
    return 'search';
  }

  normalizeTrack(track, requester = null) {
    if (!track) return null;
    return {
      title: track.title || 'Unknown Title',
      author: track.author || 'Unknown Artist',
      duration: track.length || 0,
      durationFormatted: this.formatDuration(track.length),
      thumbnail: track.thumbnail || null,
      uri: track.uri || '',
      identifier: track.identifier || '',
      source: track.sourceName || 'youtube',
      isSeekable: track.isSeekable ?? true,
      isStream: track.isStream ?? false,
      raw: track,
      requester: requester ? {
        id: requester.id,
        tag: requester.tag || requester.username || 'Unknown',
        avatar: requester.displayAvatarURL?.({ size: 256 }) || null,
      } : null,
    };
  }

  /**
   * Fast autocomplete search with deduplication, in-memory caching and relevance ranking
   */
  async autocomplete(query) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery || cleanQuery.length < 2) return [];

    const cacheKey = cleanQuery.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.results;
    }

    // Deduplicate in-flight identical searches
    if (this.pendingSearches.has(cacheKey)) {
      return await this.pendingSearches.get(cacheKey);
    }

    const searchPromise = (async () => {
      try {
        if (!this.kazagumo) return [];

        const isUrlQuery = this.isUrl(cleanQuery);
        const searchEngine = isUrlQuery ? null : 'youtube';

        const res = await Promise.race([
          this.kazagumo.search(cleanQuery, { engine: searchEngine }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Search Timeout')), 2500)),
        ]);

        if (!res || !res.tracks || res.tracks.length === 0) {
          return [];
        }

        const seenNames = new Set();
        const choices = [];

        for (const track of res.tracks) {
          const title = (track.title || '').trim();
          const author = (track.author || '').trim();
          const duration = this.formatDuration(track.length);

          if (!title) continue;

          // Unique label comparison
          const uniqueKey = `${title.toLowerCase()}-${author.toLowerCase()}`;
          if (seenNames.has(uniqueKey)) continue;
          seenNames.add(uniqueKey);

          // Discord allows max 100 characters for name and value
          let name = `${author ? `${author} - ` : ''}${title}`;
          if (duration && duration !== 'Live') {
            name = `${name} [${duration}]`;
          }
          if (name.length > 100) {
            name = name.substring(0, 97) + '...';
          }

          const value = (track.uri || cleanQuery).substring(0, 100);

          choices.push({ name, value });
          if (choices.length >= 25) break; // Maximum allowed by Discord API
        }

        // Cache results
        this.cache.set(cacheKey, { timestamp: Date.now(), results: choices });
        if (this.cache.size > this.maxCacheSize) {
          this.cache.delete(this.cache.keys().next().value);
        }

        return choices;
      } catch (err) {
        return [];
      } finally {
        this.pendingSearches.delete(cacheKey);
      }
    })();

    this.pendingSearches.set(cacheKey, searchPromise);
    return await searchPromise;
  }
}

module.exports = SearchManager;
