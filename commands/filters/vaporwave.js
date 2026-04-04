module.exports = {
    name: 'vaporwave',
    apply: (player) => {
        player.filters.setVaporwave(true);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('vaporwave')) player.activeFilters.push('vaporwave');
    }
};
