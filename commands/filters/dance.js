module.exports = {
    name: 'dance',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 1.2, pitch: 1.1, rate: 0.9 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('dance')) player.activeFilters.push('dance');
    }
};
