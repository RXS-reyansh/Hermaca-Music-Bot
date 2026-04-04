module.exports = {
    name: 'bass',
    apply: (player) => {
        player.filters.setEqualizer([
            { band: 0, gain: 0.3 },
            { band: 1, gain: 0.25 },
            { band: 2, gain: 0.2 }
        ]);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('bass')) player.activeFilters.push('bass');
    }
};
