module.exports = {
    name: 'earrape',
    apply: (player) => {
        // Extreme distortion and volume
        player.filters.setDistortion(true, {
            sinOffset: 0.8,
            sinScale: 0.5,
            cosOffset: 0.8,
            cosScale: 0.5,
            tanOffset: 0.8,
            tanScale: 0.5,
            offset: 0.8,
            scale: 0.5
        });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('earrape')) player.activeFilters.push('earrape');
    }
};
