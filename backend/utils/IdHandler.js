module.exports = {
  getMaxID: function (data) {
    let ids = data.map((e) => e.id);
    return Math.max(...ids);
  },
};

