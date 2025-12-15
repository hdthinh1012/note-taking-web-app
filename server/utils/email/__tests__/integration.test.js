import nodemailer from 'nodemailer';

test('sendEmail integration with Ethereal', async () => {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from: '"Test" <test@example.com>',
    to: 'recipient@example.com',
    subject: 'Test Email',
    html: '<b>Hello</b>'
  });

  expect(info.messageId).toBeDefined();
  expect(info.envelope.from).toBe('test@example.com');
  expect(info.envelope.to).toContain('recipient@example.com');
}, 20000);