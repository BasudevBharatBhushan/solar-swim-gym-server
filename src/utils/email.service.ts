export const sendActivationEmail = async (email: string, token: string) => {
  // Mock email implementation
  console.log(`--------------------------------------------------`);
  console.log(`SENDING EMAIL TO: ${email}`);
  console.log(`ACTIVATION LINK: http://localhost:3000/api/v1/activation/validate/${token}`);
  console.log(`--------------------------------------------------`);
  
  // In a real app, you'd use nodemailer or a service like SendGrid/Postmark
  return true;
};
