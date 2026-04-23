import twilio from "twilio";

let twilioClient;
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
if (sid && token && sid.startsWith("AC")) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendSMS(to, body) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    return { mocked: true, to, body };
  }

  const message = await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });

  return message;
}
