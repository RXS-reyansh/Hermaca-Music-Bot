module.exports = {
    name: 'nightcore',
    apply: (player) => {
        player.filters.setNightcore(true);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('nightcore')) player.activeFilters.push('nightcore');
    }
};
