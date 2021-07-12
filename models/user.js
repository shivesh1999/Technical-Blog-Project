const mongoose= require('mongoose');

const userSchema = new mongoose.Schema({
    firstname:{
        type : String,
        required: [true,'First Name cannot be blank']
    },
    lastname:
    {
        type : String,
        required: [true,'Lastname Name cannot be blank']
    },
    email:
    {
        type: String,
        required: [true,'Email cannot be blank']
    },
    password:
    {
        type: String,
        required: [true,'Password cannot be blank']
    },
    day:
    {
        type: String,
        required: [true,'Date of birth cannot be blank.']
    },
    month:
    {
        type: String,
        required: [true,'Date of birth cannot be blank.']
    },
    year:
    {
        type: String,
        required: [true,'Date of birth cannot be blank.']
    },
    gender:{
    type: String,
    required: [true,'Date of birth cannot be blank.']
    }
})

module.exports=mongoose.model('User',userSchema);