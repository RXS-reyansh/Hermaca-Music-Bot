module.exports = {
    name: 'lowpass',
    apply: (player) => {
        player.filters.setLowPass(true, { smoothing: 20.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('lowpass')) player.activeFilters.push('lowpass');
    }
};
