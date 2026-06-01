const TO_EMAIL = "sanchezjacksondashiell@gmail.com";
const FROM_EMAIL = "Berkeley Student Windows <onboarding@resend.dev>";

function clean(value) {
  return String(value ?? "").trim();
}

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return json(response, 405, { ok: false, error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return json(response, 500, { ok: false, error: "Email is not configured yet." });
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);

  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return json(response, 400, { ok: false, error: "Invalid request." });
  }

  const fields = {
    name: clean(body.name),
    phone: clean(body.phone),
    email: clean(body.email),
    address: clean(body.address),
    windows: clean(body.windows),
    selectedTime: clean(body.selectedTime)
  };

  if (Object.values(fields).some((value) => !value)) {
    return json(response, 400, { ok: false, error: "Please fill out every field and choose a time." });
  }

  const text = [
    "New Berkeley Student Windows request:",
    "",
    `Name: ${fields.name}`,
    `Phone: ${fields.phone}`,
    `Email: ${fields.email}`,
    `Address: ${fields.address}`,
    `Windows: ${fields.windows}`,
    `Requested time: ${fields.selectedTime}`
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      reply_to: fields.email,
      subject: "New Berkeley Student Windows time request",
      text
    })
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    return json(response, 502, { ok: false, error: "Email failed to send.", detail: errorText });
  }

  return json(response, 200, { ok: true });
}
