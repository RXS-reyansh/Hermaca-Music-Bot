module.exports = {
    name: 'soft',
    apply: (player) => {
        player.filters.setLowPass(true, { smoothing: 10.0 });
        player.filters.setTimescale(true, { speed: 0.98, pitch: 0.98, rate: 0.98 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('soft')) player.activeFilters.push('soft');
    }
};
