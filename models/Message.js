

const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema(
  {
  
    
    name: {
      type: String,      
      required: true,    
      trim: true         // 
    },
    
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true    // Convert to lowercase
    },
    
    message: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true  // Automatically add createdAt and updatedAt fields
  }

);


const Message = mongoose.model('Message', messageSchema);


module.exports = Message;