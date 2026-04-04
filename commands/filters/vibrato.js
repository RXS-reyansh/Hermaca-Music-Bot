module.exports = {
    name: 'vibrato',
    apply: (player) => {
        player.filters.setVibrato(true, { frequency: 5.0, depth: 0.5 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('vibrato')) player.activeFilters.push('vibrato');
    }
};
