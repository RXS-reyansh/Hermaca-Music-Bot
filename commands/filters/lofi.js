module.exports = {
    name: 'lofi',
    apply: (player) => {
        player.filters.setLowPass(true, { smoothing: 20.0 });
        player.filters.setTimescale(true, { speed: 0.98, pitch: 0.98, rate: 0.98 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('lofi')) player.activeFilters.push('lofi');
    }
};
