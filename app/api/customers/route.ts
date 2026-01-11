import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import neo4j from "neo4j-driver";
import { hashCustomerPassword } from "@/lib/customer/password";
import { isSmtpConfigured, sendEmail } from "@/lib/email";

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME!,
    process.env.NEO4J_PASSWORD!
  )
);

export async function GET() {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (c:Customer)
      RETURN c
      ORDER BY c.CustomerID ASC
    `);

    const customers = result.records.map((record) => {
      const props = record.get("c").properties as Record<string, unknown>;
      const safe = { ...props };
      delete safe.PasswordHash;
      delete safe.EmailVerificationTokenHash;
      delete safe.EmailVerificationExpiresAt;
      return safe;
    });

    return NextResponse.json({ customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const appUrl = process.env.APP_URL || request.nextUrl.origin;
  const emailVerificationDisabled =
    process.env.DISABLE_EMAIL_VERIFICATION === "true";

  if (
    !emailVerificationDisabled &&
    process.env.NODE_ENV === "production" &&
    !isSmtpConfigured()
  ) {
    return NextResponse.json(
      {
        error:
          "SMTP is not configured. Set SMTP_* env vars or set DISABLE_EMAIL_VERIFICATION=true.",
      },
      { status: 503 }
    );
  }

  const data = body as Record<string, unknown>;
  const nameRaw = (data.Name ?? data.name) as unknown;
  const emailRaw = (data.Email ?? data.email) as unknown;
  const shippingAddressRaw = (data.ShippingAddress ??
    data.shippingAddress ??
    data.Shipping ??
    data.shipping ??
    data.Address ??
    data.address) as unknown;
  const passwordRaw = (data.Password ?? data.password) as unknown;
  const phoneRaw = (data.Phone ?? data.phone) as unknown;
  const cityRaw = (data.City ?? data.city) as unknown;

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const shippingAddress =
    typeof shippingAddressRaw === "string" ? shippingAddressRaw.trim() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!shippingAddress) {
    return NextResponse.json(
      { error: "Shipping address is required" },
      { status: 400 }
    );
  }

  if (shippingAddress.length > 1000) {
    return NextResponse.json(
      { error: "Shipping address is too long" },
      { status: 400 }
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (password.length > 256) {
    return NextResponse.json(
      { error: "Password is too long" },
      { status: 400 }
    );
  }

  const verificationToken = emailVerificationDisabled
    ? ""
    : crypto.randomBytes(32).toString("base64url");
  const verificationTokenHash = emailVerificationDisabled
    ? ""
    : crypto.createHash("sha256").update(verificationToken).digest("hex");
  const verificationExpiresAt = emailVerificationDisabled
    ? ""
    : new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  const session = driver.session();
  try {
    const existing = await session.run(
      `
      MATCH (c:Customer)
      WHERE toLower(c.Email) = $email
      RETURN c
      LIMIT 1
      `,
      { email }
    );

    if (existing.records.length > 0) {
      const existingCustomer = existing.records[0].get("c")?.properties as
        | Record<string, unknown>
        | undefined;
      const isVerified = existingCustomer?.EmailVerified === true;
      if (isVerified) {
        return NextResponse.json(
          { error: "A customer with this email already exists" },
          { status: 409 }
        );
      }

      if (emailVerificationDisabled) {
        await session.run(
          `
          MATCH (c:Customer)
          WHERE toLower(c.Email) = $email
          SET c.EmailVerified = true,
              c.EmailVerifiedAt = datetime(),
              c.ShippingAddress = $shippingAddress
          REMOVE c.EmailVerificationTokenHash
          REMOVE c.EmailVerificationExpiresAt
          RETURN c
          `,
          { email, shippingAddress }
        );
      } else {
        await session.run(
          `
          MATCH (c:Customer)
          WHERE toLower(c.Email) = $email
          SET c.EmailVerificationTokenHash = $verificationTokenHash,
              c.EmailVerificationExpiresAt = datetime($verificationExpiresAt),
              c.EmailVerified = false,
              c.ShippingAddress = $shippingAddress
          RETURN c
          `,
          {
            email,
            verificationTokenHash,
            verificationExpiresAt,
            shippingAddress,
          }
        );

        const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(
          verificationToken
        )}`;
        await sendEmail({
          to: email,
          subject: "Confirm your email",
          text: `Please confirm your email by clicking this link:\n\n${verifyUrl}\n\nIf you did not request this, you can ignore this email.`,
        });
      }

      return NextResponse.json({
        ok: true,
        emailVerified: emailVerificationDisabled,
      });
    }

    const passwordHash = await hashCustomerPassword(password);

    const result = emailVerificationDisabled
      ? await session.run(
          `
          MATCH (c:Customer)
          WITH coalesce(max(toInteger(c.CustomerID)), 0) AS maxId
          CREATE (customer:Customer {
            CustomerID: maxId + 1,
            Name: $name,
            Email: $email,
            PasswordHash: $passwordHash,
            EmailVerified: true,
            EmailVerifiedAt: datetime(),
            Phone: $phone,
            City: $city,
            ShippingAddress: $shippingAddress,
            CreatedAt: datetime()
          })
          RETURN customer.CustomerID AS CustomerID
          `,
          {
            name,
            email,
            passwordHash,
            phone: phone || null,
            city: city || null,
            shippingAddress,
          }
        )
      : await session.run(
          `
          MATCH (c:Customer)
          WITH coalesce(max(toInteger(c.CustomerID)), 0) AS maxId
          CREATE (customer:Customer {
            CustomerID: maxId + 1,
            Name: $name,
            Email: $email,
            PasswordHash: $passwordHash,
            EmailVerified: false,
            EmailVerificationTokenHash: $verificationTokenHash,
            EmailVerificationExpiresAt: datetime($verificationExpiresAt),
            Phone: $phone,
            City: $city,
            ShippingAddress: $shippingAddress,
            CreatedAt: datetime()
          })
          RETURN customer.CustomerID AS CustomerID
          `,
          {
            name,
            email,
            passwordHash,
            verificationTokenHash,
            verificationExpiresAt,
            phone: phone || null,
            city: city || null,
            shippingAddress,
          }
        );

    if (!emailVerificationDisabled) {
      const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(
        verificationToken
      )}`;
      await sendEmail({
        to: email,
        subject: "Confirm your email",
        text: `Thanks for registering!\n\nPlease confirm your email by clicking this link:\n\n${verifyUrl}\n\nIf you did not request this, you can ignore this email.`,
      });
    }

    const customerId = result.records[0]?.get("CustomerID") ?? null;
    return NextResponse.json({
      ok: true,
      emailVerified: emailVerificationDisabled,
      customerId: JSON.parse(JSON.stringify(customerId)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
