module.exports = {
    name: 'clear',
    apply: (player) => {
        player.filters.clearFilters();
        player.activeFilters = [];
    }
};
