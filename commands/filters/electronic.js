module.exports = {
    name: 'electronic',
    apply: (player) => {
        player.filters.setKaraoke(true, {
            level: 1.0,
            monoLevel: 1.0,
            filterBand: 220,
            filterWidth: 100
        });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('electronic')) player.activeFilters.push('electronic');
    }
};
