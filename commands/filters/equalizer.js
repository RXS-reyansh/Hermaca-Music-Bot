module.exports = {
    name: 'equalizer',
    apply: (player) => {
        player.filters.setEqualizer([
            { band: 0, gain: 0.2 },
            { band: 1, gain: 0.2 },
            { band: 2, gain: 0.2 },
            { band: 3, gain: 0.2 },
            { band: 4, gain: 0.2 }
        ]);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('equalizer')) player.activeFilters.push('equalizer');
    }
};
