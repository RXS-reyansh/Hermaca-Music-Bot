module.exports = {
    name: 'enhance',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 1.1, pitch: 1.0, rate: 1.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('enhance')) player.activeFilters.push('enhance');
    }
};
