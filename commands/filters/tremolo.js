module.exports = {
    name: 'tremolo',
    apply: (player) => {
        player.filters.setTremolo(true, { depth: 0.5, frequency: 2.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('tremolo')) player.activeFilters.push('tremolo');
    }
};
