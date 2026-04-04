module.exports = {
    name: 'vocalboost',
    apply: (player) => {
        player.filters.setEqualizer([
            { band: 5, gain: 0.2 },
            { band: 6, gain: 0.2 },
            { band: 7, gain: 0.2 },
            { band: 8, gain: 0.2 }
        ]);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('vocalboost')) player.activeFilters.push('vocalboost');
    }
};
