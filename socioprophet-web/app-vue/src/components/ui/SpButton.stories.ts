import type { Meta, StoryObj } from "@storybook/vue3";
import SpButton from "./SpButton.vue";

const meta = {
  title: "UI/SpButton",
  component: SpButton,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SpButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => ({
    components: { SpButton },
    template: `
      <div style="display:grid; gap:14px;">
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <SpButton>Default</SpButton>
          <SpButton disabled>Disabled</SpButton>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <SpButton variant="primary" data-canary="sp">Primary</SpButton>
          <SpButton variant="ghost" data-canary="sp">Ghost</SpButton>
          <SpButton variant="danger" data-canary="sp">Danger</SpButton>
        </div>
      </div>
    `,
  }),
};
