/* @param {number|string} classId
@returns {string}
*/
export const getClassColor = (classId) => {
    const colors = [
        'from-blue-400 to-blue-600',
        'from-green-400 to-green-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-yellow-400 to-yellow-600',
        'from-red-400 to-red-600',
        'from-indigo-400 to-indigo-600',
        'from-teal-400 to-teal-600',
        'from-gray-400 to-gray-600',
        'from-orange-400 to-orange-600',
    ];
    const numberId = typeof classId === 'string' ? parseInt(classId, 10) : classId;
    const colorIndex = numberId % colors.length;
    return colors[colorIndex];
};

export const getBorderColor = (gradientClass) => {
    if (gradientClass.includes('blue')) return 'border-blue-200';
    if (gradientClass.includes('green')) return 'border-green-200';
    if (gradientClass.includes('purple')) return 'border-purple-200';
    if (gradientClass.includes('pink')) return 'border-pink-200';
    if (gradientClass.includes('yellow')) return 'border-yellow-200';
    if (gradientClass.includes('red')) return 'border-red-200';
    if (gradientClass.includes('indigo')) return 'border-indigo-200';
    if (gradientClass.includes('teal')) return 'border-teal-200';
    if (gradientClass.includes('gray')) return 'border-gray-200';
    if (gradientClass.includes('orange')) return 'border-orange-200';
    return 'border-gray-200';
};