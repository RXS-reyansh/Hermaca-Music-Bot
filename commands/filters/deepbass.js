module.exports = {
    name: 'deepbass',
    apply: (player) => {
        player.filters.setEqualizer([
            { band: 0, gain: 0.5 },
            { band: 1, gain: 0.4 },
            { band: 2, gain: 0.3 }
        ]);
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('deepbass')) player.activeFilters.push('deepbass');
    }
};
