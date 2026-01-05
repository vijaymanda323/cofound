const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (email, otp, purpose = 'verification') => {
  try {
    const subject = purpose === 'password_reset' 
      ? 'Found - Password Reset OTP' 
      : 'Found - Email Verification OTP';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F7F7F7;">
        <div style="background-color: #EFE9E1; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #4A4A4A; margin: 0;">Found</h1>
          <p style="color: #7A7A7A; margin: 10px 0 0 0;">Find the right co-founder</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #4A4A4A; text-align: center;">Your OTP Code</h2>
          
          <div style="background-color: #1155ccff; color: #ffffff; font-size: 32px; font-weight: bold; 
                      padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
            ${otp}
          </div>
          
          <p style="color: #7A7A7A; text-align: center; margin: 20px 0;">
            This OTP will expire in 5 minutes for security reasons.
          </p>
          
          <p style="color: #7A7A7A; text-align: center; font-size: 14px;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #7A7A7A; font-size: 12px;">
          <p>&copy; 2024 Found. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

const sendFeedbackEmail = async (feedbackData) => {
  try {
    const { content, type, rating, email, userName } = feedbackData;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F7F7F7;">
        <div style="background-color: #EFE9E1; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #4A4A4A; margin: 0;">Found - New Feedback</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h3 style="color: #4A4A4A;">Feedback Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; color: #7A7A7A; font-weight: bold;">From:</td>
              <td style="padding: 8px; color: #4A4A4A;">${userName} (${email})</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #7A7A7A; font-weight: bold;">Type:</td>
              <td style="padding: 8px; color: #4A4A4A;">${type}</td>
            </tr>
            ${rating ? `
            <tr>
              <td style="padding: 8px; color: #7A7A7A; font-weight: bold;">Rating:</td>
              <td style="padding: 8px; color: #4A4A4A;">${rating}/5</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; color: #7A7A7A; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 8px; color: #4A4A4A;">${content}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #F7F7F7; border-radius: 5px;">
            <p style="margin: 0; color: #7A7A7A; font-size: 12px;">
              This feedback was submitted via the Found mobile app.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'aarati@tensorn.com',
      subject: `Found - New ${type} feedback`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending feedback email:', error);
    return false;
  }
};

module.exports = {
  sendOTP,
  sendFeedbackEmail
};
