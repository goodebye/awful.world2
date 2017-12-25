const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const opts = {
  timestamps: true,
};

const userSchema = mongoose.Schema({
  profile: {
    type: String,
    required: true,
    default: 'you can put anything here!!!',
  },
  profilePreview: {
    type: String,
    required: true,
    default: 'you can put anything here!!!',
  },
  remainingInvites: {
    type: Number,
    required: true,
    default: 2,
  },
  email: {
    type: String,
    required: true,
  },
  invites: [mongoose.Schema.Types.ObjectId],
  inviteId: {
    type: String,
    required: true,
    default: 'patient0',
  },
  username: String,
  password: String,
}, opts);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
