module.exports = function(mongoose) {
    const opts = {
        timestamps: true
    };

    const inviteSchema = mongoose.Schema({
        active: {
            type: Boolean,
            required: true,
            default: true,
        },
        invitedUserId: {
            type: String,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }}, opts);

    return mongoose.model('Invite', inviteSchema);
}
