import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useMail } from "./mail";
import * as mailApi from "../services/mailApi";

vi.mock("../services/mailApi", async () => {
  const actual = await vi.importActual<typeof mailApi>("../services/mailApi");
  return {
    ...actual,
    sendMail: vi.fn(),
    aiDraft: vi.fn(),
  };
});

function withCurrentThread(store: ReturnType<typeof useMail>) {
  store.current = {
    id: "t1",
    view: "imbox",
    from: "Mira Chen",
    fromEmail: "mira@socioprophet.ai",
    subject: "Q3 board deck",
    snippet: "",
    ts: "9:42",
    unread: false,
    messages: [],
  };
}

describe("mail store — compose/reply", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(mailApi.sendMail).mockReset();
    vi.mocked(mailApi.aiDraft).mockReset();
  });

  it("replyToCurrent sends via mailApi with Re: subject and inReplyTo, then appends the message optimistically", async () => {
    const store = useMail();
    withCurrentThread(store);
    vi.mocked(mailApi.sendMail).mockResolvedValue(undefined);

    await store.replyToCurrent("Sounds good, ship it.");

    expect(mailApi.sendMail).toHaveBeenCalledWith({
      to: "mira@socioprophet.ai",
      subject: "Re: Q3 board deck",
      body: "Sounds good, ship it.",
      inReplyTo: "t1",
    });
    expect(store.current?.messages).toHaveLength(1);
    expect(store.current?.messages?.[0].bodyText).toBe("Sounds good, ship it.");
    expect(store.error).toBe("");
  });

  it("replyToCurrent is a no-op with no open thread or empty body", async () => {
    const store = useMail();
    await store.replyToCurrent("hello");
    expect(mailApi.sendMail).not.toHaveBeenCalled();

    withCurrentThread(store);
    await store.replyToCurrent("   ");
    expect(mailApi.sendMail).not.toHaveBeenCalled();
  });

  it("replyToCurrent sets store.error and rethrows on failure", async () => {
    const store = useMail();
    withCurrentThread(store);
    vi.mocked(mailApi.sendMail).mockRejectedValue(new Error("bridge down"));

    await expect(store.replyToCurrent("hi")).rejects.toThrow("bridge down");
    expect(store.error).toBe("bridge down");
    expect(store.current?.messages).toHaveLength(0);
  });

  it("sendNew requires to and subject, and forwards the payload otherwise", async () => {
    const store = useMail();
    const okMissing = await store.sendNew({ to: "", subject: "", body: "" });
    expect(okMissing).toBe(false);
    expect(mailApi.sendMail).not.toHaveBeenCalled();

    vi.mocked(mailApi.sendMail).mockResolvedValue(undefined);
    const ok = await store.sendNew({ to: "a@b.com", subject: "Hi", body: "text" });
    expect(ok).toBe(true);
    expect(mailApi.sendMail).toHaveBeenCalledWith({ to: "a@b.com", subject: "Hi", body: "text" });
  });

  it("sendNew returns false and sets error on failure", async () => {
    const store = useMail();
    vi.mocked(mailApi.sendMail).mockRejectedValue(new Error("network"));
    const ok = await store.sendNew({ to: "a@b.com", subject: "Hi", body: "text" });
    expect(ok).toBe(false);
    expect(store.error).toBe("network");
  });

  it("draftReply returns '' with no open thread, otherwise forwards to mailApi.aiDraft", async () => {
    const store = useMail();
    expect(await store.draftReply("reply")).toBe("");
    expect(mailApi.aiDraft).not.toHaveBeenCalled();

    withCurrentThread(store);
    vi.mocked(mailApi.aiDraft).mockResolvedValue("Sounds great — approved.");
    const draft = await store.draftReply("reply");
    expect(draft).toBe("Sounds great — approved.");
    expect(mailApi.aiDraft).toHaveBeenCalledWith("t1", "reply");
  });
});
