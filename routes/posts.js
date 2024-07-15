const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/pinterest');

const postSchema = new Schema({
    imagetext: {
        type: String,
        required: true
    },
    imagedesc:{
        type:String
    },
    image:{
        type:String
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,//it will select id for the user from posts
        ref:'User'//it will reference to user model
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: [],//to save users id we'll use array for likes
        default:[]
    }
}, {
    timestamps: true
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
