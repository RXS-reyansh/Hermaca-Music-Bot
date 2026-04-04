module.exports = {
    name: 'daycore',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 0.8, pitch: 0.9, rate: 0.8 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('daycore')) player.activeFilters.push('daycore');
    }
};
