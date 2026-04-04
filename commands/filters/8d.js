module.exports = {
    name: '8d',
    apply: (player) => {
        player.filters.set8D(true);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('8d')) player.activeFilters.push('8d');
    }
};
