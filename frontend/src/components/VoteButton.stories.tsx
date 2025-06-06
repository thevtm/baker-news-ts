import type { Meta, StoryObj } from "@storybook/react";

import VoteButton from "./VoteButton";
import { VoteType } from "../state";

const meta: Meta<typeof VoteButton> = {
  component: VoteButton,
};

export default meta;
type Story = StoryObj<typeof VoteButton>;

export const Up: Story = {
  args: {
    voteType: VoteType.UpVote,
    active: true,
    onClick: () => {},
  },
};

export const Down: Story = {
  args: {
    voteType: VoteType.DownVote,
    active: false,
    onClick: () => {},
  },
};
