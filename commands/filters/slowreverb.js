module.exports = {
    name: 'slowreverb',
    apply: (player) => {
        player.filters.setTimescale(true, { speed: 0.8, pitch: 0.8, rate: 0.8 });
        player.filters.setReverb(true, {
            roomSize: 0.3,
            damping: 0.5,
            wetLevel: 0.5,
            dryLevel: 0.5
        });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('slowreverb')) player.activeFilters.push('slowreverb');
    }
};
