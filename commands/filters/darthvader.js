module.exports = {
    name: 'darthvader',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 0.8, pitch: 0.5, rate: 1.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('darthvader')) player.activeFilters.push('darthvader');
    }
};
