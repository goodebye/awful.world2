const mongoosePaginate = require('mongoose-paginate');

module.exports = function (mongoose) {
  const opts = {
    timestamps: true,
  };

  const postSchema = mongoose.Schema({
    user_id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: 'new post',
    },
    post: {
      type: String,
      default: '<center><p>need help? take a look at the <a href="/thehandbook">handbook</a> (open in new tab!!)</p></center>',
      required: true,
    },
    published: {
      type: Boolean,
      required: true,
      default: false,
    },
  }, opts);

  postSchema.plugin(mongoosePaginate);

  return mongoose.model('Post', postSchema);
};
