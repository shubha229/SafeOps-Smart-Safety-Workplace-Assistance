import twilio from "twilio";

const accountSid =
  process.env.TWILIO_ACCOUNT_SID;

const authToken =
  process.env.TWILIO_AUTH_TOKEN;

const twilioPhoneNumber =
  process.env.TWILIO_PHONE_NUMBER;

if (
  !accountSid ||
  !authToken ||
  !twilioPhoneNumber
) {
  console.warn(
    "⚠️ Twilio environment variables are not fully configured."
  );
}

const client =
  accountSid && authToken
    ? twilio(
        accountSid,
        authToken
      )
    : null;

export const makeEmergencyCall = async (
  phoneNumber: string,
  contactName: string,
  relation: string,
  userName: string
) => {
  if (!client) {
    throw new Error(
      "Twilio is not configured. Check your .env file."
    );
  }

  if (!twilioPhoneNumber) {
    throw new Error(
      "TWILIO_PHONE_NUMBER is missing."
    );
  }

  if (!phoneNumber) {
    throw new Error(
      "Phone number is required."
    );
  }

  const name =
    contactName?.trim() || "the person";

  const contactRelation =
    relation?.trim() || "your emergency contact";

  console.log(
    "📞 Emergency call details:",
    {
      phoneNumber,
      contactName: name,
      relation: contactRelation,
    }
  );
  const relationshipToContact: Record<string, string> = {
    mother: "daughter",
    father: "son",
    sister: "sibling",
    brother: "sibling",
    friend: "friend",
    spouse: "spouse",
    partner: "partner",
    cousin: "cousin",
    uncle: "nephew/niece",
    aunt: "nephew/niece",
    grandparent: "grandchild",
    grandchild: "grandparent",
    "best friend": "best friend",
    roommate: "roommate",
    neighbor: "neighbor",
    colleague: "colleague",
    classmate: "classmate",   
  };

  const relationToUser =
    relationshipToContact[relation.toLowerCase()] || "family member";
  const call =
    await client.calls.create({
      from: twilioPhoneNumber,

      to: phoneNumber,

      twiml: `
        <Response>
          <Say
            voice="alice"
            language="en-IN"
          >
            Emergency alert from SafeOps.

            ${contactName}, Your ${relationToUser}, ${userName}, is in danger and needs immediate assistance.

            Please contact ${userName} as soon as possible
            and help them reach a safe location.

            This is an automated SafeOps emergency alert.
          </Say>
        </Response>
      `,
    });

  console.log(
    "📞 SafeOps emergency call created:",
    call.sid
  );

  return call;
};