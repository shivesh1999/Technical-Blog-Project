const mongoose= require('mongoose');
const postSchema = new mongoose.Schema({
    userid:
    {
        type:String,
        required :true
    },
    date:
    {
        type: Date,
        required:true,
        default: Date.now
    },
    name:
    {
        type : String,
        required: true
    },
    topic:
    {
        type : String,
        required: [true,'Topic cannot be blank']
    },
    content:
    {
        type : String,
        required: [true,'content cannot be blank']
    },
    upvote:
    {
        type:Number,
        default:0
    },
    downvote:
    {
        type:Number,
        default:0
    }
})

module.exports=mongoose.model('Post',postSchema);