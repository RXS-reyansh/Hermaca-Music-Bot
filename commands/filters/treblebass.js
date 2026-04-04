module.exports = {
    name: 'treblebass',
    apply: (player) => {
        player.filters.setEqualizer([
            { band: 0, gain: 0.4 },
            { band: 1, gain: 0.3 },
            { band: 14, gain: 0.2 },
            { band: 15, gain: 0.2 }
        ]);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('treblebass')) player.activeFilters.push('treblebass');
    }
};
