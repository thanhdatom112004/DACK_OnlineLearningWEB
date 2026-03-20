module.exports = {
  // Convert course title to a simple slug (lowercase + replace spaces with '-')
  convertTitleToSlug: function (title) {
    if (!title) return "";
    let result = String(title).toLowerCase();
    result = result.replaceAll(" ", "-");
    return result;
  },
};

