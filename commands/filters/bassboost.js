module.exports = {
    name: 'bassboost',
    apply: (player) => {
        player.filters.setEqualizer([
            { band: 0, gain: 0.4 },
            { band: 1, gain: 0.3 },
            { band: 2, gain: 0.2 }
        ]);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('bassboost')) player.activeFilters.push('bassboost');
    }
};
