import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";

vi.mock("nodemailer");

describe("Mail Utility Unit Tests", () => {
  const originalEnv = process.env;
  let sendMail: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    const mailModule: any = await vi.importActual("@backend/utils/mail");
    sendMail = mailModule.sendMail;
  });

  it("should return null and warn if MAIL_USER or MAIL_PASS is missing", async () => {
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASS;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendMail({ to: "test@example.com", subject: "Hello" });
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Mail service is not fully configured.");
  });

  it("should create transport and send email when config is present", async () => {
    process.env.MAIL_USER = "sender@example.com";
    process.env.MAIL_PASS = "secretpass";

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: "123" });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    const result = await sendMail({
      to: "recipient@example.com",
      subject: "Test Subject",
      text: "Test body",
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: "sender@example.com",
        pass: "secretpass",
      },
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "sender@example.com",
      to: "recipient@example.com",
      subject: "Test Subject",
      text: "Test body",
      html: undefined,
      attachments: undefined,
    });
    expect(result).toEqual({ messageId: "123" });
  });
});
