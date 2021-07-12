const mongoose= require('mongoose');
const commentSchema = new mongoose.Schema({
    userid:
    {
        type:String,
        required :true
    },
    postid:
    {
        type:String,
        required :true
    },
    comment:
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

module.exports=mongoose.model('Comments',commentSchema);
