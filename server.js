const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const connectDB = require('./config/database');
const Message = require('./models/Message');

dotenv.config();
connectDB();

const app = express();

// Allow requests from your frontend domain
app.use(cors({
  origin: ['https://karunanidhii16.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configure Nodemailer with timeout settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,  // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
});

console.log('📧 Email configured for:', process.env.EMAIL_USER);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Save to MongoDB first (most important)
    const newMessage = await Message.create({
      name,
      email,
      message
    });
    
    console.log('✅ Message saved to database:', newMessage._id);
    
    // Try to send email (non-blocking if it fails)
    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Portfolio Contact: ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          <div style="background: #ffffff; padding: 15px; border-left: 4px solid #2563eb;">
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          </div>
        </div>
      `
    };
    
    // Send email with error handling
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', process.env.EMAIL_USER);
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('⚠️ Email sending failed (message saved to DB):', emailError.message);
      // Message is already saved, so we still return success
    }
    
    // Always return success if message was saved
    res.status(200).json({
      success: true,
      message: 'Message sent successfully!',
      data: {
        id: newMessage._id,
        name: newMessage.name
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});