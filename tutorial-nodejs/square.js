/* // Build properties one by one
exports.area = function (width) {
    return width * width;
  };

exports.perimeter = function (width) {
return 4 * width;
}; */

// Build object
module.exports = {
    area(width) {
      return width * width;
    },
  
    perimeter(width) {
      return 4 * width;
    },
  };