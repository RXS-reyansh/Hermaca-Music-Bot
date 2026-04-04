module.exports = {
    name: 'speed',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 1.5, pitch: 1.0, rate: 1.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('speed')) player.activeFilters.push('speed');
    }
};
