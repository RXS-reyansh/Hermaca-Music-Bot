module.exports = {
    name: 'rotation',
    apply: (player) => {
        player.filters.setRotation(true, { rotationHz: 0.2 });
        if (!player.activeFilters) player.activeFilters = [];
        if (!player.activeFilters.includes('rotation')) player.activeFilters.push('rotation');
    }
};
