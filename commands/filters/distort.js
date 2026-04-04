module.exports = {
    name: 'distort',
    apply: (player) => {
        player.filters.setDistortion(true, {
            sinOffset: 0.5,
            sinScale: 0.2,
            cosOffset: 0.5,
            cosScale: 0.2,
            tanOffset: 0.5,
            tanScale: 0.2,
            offset: 0.5,
            scale: 0.2
        });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('distort')) player.activeFilters.push('distort');
    }
};
