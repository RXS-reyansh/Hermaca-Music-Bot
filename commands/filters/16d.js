module.exports = {
    name: '16d',
    apply: (player) => {
        player.filters.setRotation(true, { rotationHz: 0.4 });
        player.filters.setTremolo(true, { depth: 0.3, frequency: 4.0 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('16d')) player.activeFilters.push('16d');
    }
};
