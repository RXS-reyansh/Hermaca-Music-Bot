module.exports = {
    name: 'pitch',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 1.0, pitch: 1.2, rate: 1.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('pitch')) player.activeFilters.push('pitch');
    }
};
