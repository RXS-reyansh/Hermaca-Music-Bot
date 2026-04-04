module.exports = {
    name: 'chipmunk',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 2.0, pitch: 1.5, rate: 0.8 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('chipmunk')) player.activeFilters.push('chipmunk');
    }
};
