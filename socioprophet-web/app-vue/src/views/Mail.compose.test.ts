import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Mail from "./Mail.vue";
import { useMail } from "../stores/mail";
import * as mailApi from "../services/mailApi";

vi.mock("../services/mailApi", async () => {
  const actual = await vi.importActual<typeof mailApi>("../services/mailApi");
  return {
    ...actual,
    listThreads: vi.fn().mockResolvedValue([]),
    listScreener: vi.fn().mockResolvedValue([]),
    sendMail: vi.fn().mockResolvedValue(undefined),
    aiDraft: vi.fn().mockResolvedValue("Drafted reply text."),
  };
});

describe("Mail.vue — compose & reply UI", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(mailApi.sendMail).mockClear();
    vi.mocked(mailApi.aiDraft).mockClear();
  });

  it("opens the compose modal from the rail button and sends via mail.sendNew", async () => {
    const wrapper = mount(Mail);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".compose-modal").exists()).toBe(false);
    await wrapper.find("button.compose").trigger("click");
    expect(wrapper.find(".compose-modal").exists()).toBe(true);

    const inputs = wrapper.findAll(".compose-modal input");
    await inputs[0].setValue("friend@example.com");
    await inputs[1].setValue("Hello");
    await wrapper.find(".compose-modal textarea").setValue("Body text");

    await wrapper.find(".compose-modal button.send").trigger("click");
    await wrapper.vm.$nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(mailApi.sendMail).toHaveBeenCalledWith({ to: "friend@example.com", subject: "Hello", body: "Body text" });
    expect(wrapper.find(".compose-modal").exists()).toBe(false);
  });

  it("Escape closes the compose modal", async () => {
    const wrapper = mount(Mail);
    const mail = useMail();
    mail.composeOpen = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".compose-modal").exists()).toBe(true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(mail.composeOpen).toBe(false);
  });

  it("sends a reply on Enter and clears the input", async () => {
    const wrapper = mount(Mail);
    const mail = useMail();
    // let onMounted's mail.load("imbox")/loadScreener() settle first — otherwise their
    // stub-empty resolution races our manual mail.current assignment below and nulls it.
    await new Promise((r) => setTimeout(r, 0));
    mail.current = {
      id: "t1", view: "imbox", from: "Mira", fromEmail: "mira@socioprophet.ai",
      subject: "Q3 deck", snippet: "", ts: "9:42", unread: false, messages: [],
    };
    await wrapper.vm.$nextTick();

    const replyInput = wrapper.find(".replybar input");
    await replyInput.setValue("On it.");
    await replyInput.trigger("keyup.enter");
    await wrapper.vm.$nextTick();
    await new Promise((r) => setTimeout(r, 0));

    expect(mailApi.sendMail).toHaveBeenCalledWith({
      to: "mira@socioprophet.ai", subject: "Re: Q3 deck", body: "On it.", inReplyTo: "t1",
    });
    expect((replyInput.element as HTMLInputElement).value).toBe("");
  });

  it("AI draft button fills the reply input from mail.draftReply", async () => {
    const wrapper = mount(Mail);
    const mail = useMail();
    await new Promise((r) => setTimeout(r, 0));
    mail.current = {
      id: "t1", view: "imbox", from: "Mira", fromEmail: "mira@socioprophet.ai",
      subject: "Q3 deck", snippet: "", ts: "9:42", unread: false, messages: [],
    };
    await wrapper.vm.$nextTick();

    await wrapper.find("button.draft").trigger("click");
    await wrapper.vm.$nextTick();
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(mailApi.aiDraft).toHaveBeenCalledWith("t1", "reply");
    expect((wrapper.find(".replybar input").element as HTMLInputElement).value).toBe("Drafted reply text.");
  });
});
