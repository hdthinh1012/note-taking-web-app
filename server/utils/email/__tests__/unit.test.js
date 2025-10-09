const nodemailer = require('nodemailer');

test('transporter.sendMail is called successfully', async () => {
  const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-id' });

  const transporter = nodemailer.createTransport({
      host: 'dummy-host',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
          user: 'dummy-user',
          pass: 'dummy-pass',
      },
  });

  jest.spyOn(transporter, 'sendMail').mockImplementation(sendMailMock);

  // Simulate calling sendEmail function
  const messageInfo = await transporter.sendMail({
      from: 'sender@example.com',
      to: 'test@example.com',
      subject: 'Subject',
      html: 'Body'
  });

  expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
    to: 'test@example.com',
    subject: 'Subject',
    html: 'Body'
  }));
  expect(messageInfo).toEqual({ messageId: 'test-id' });
});