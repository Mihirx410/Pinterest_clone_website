const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const plm=require('passport-local-mongoose')

mongoose.connect('mongodb://localhost:27017/pinterest');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    dp: {
        type: String//dp will be stored as a file path or url
    },
    banner:{
        type:String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullname: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

userSchema.plugin(plm)

module.exports = mongoose.model('User', userSchema);

